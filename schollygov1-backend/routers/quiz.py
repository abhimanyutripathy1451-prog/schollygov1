from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Literal, Union
from datetime import date, timedelta
import aiomysql

from core.database import get_db
from core.security import get_current_user
from routers.auth import get_new_level
from core.mastery import calculate_rolling_mastery

router = APIRouter(prefix="/quiz", tags=["Quiz"])

# --- Gamification Logic ---


def calculate_difficulty_distribution(accuracy: float, total_attempts: int, quiz_size: int = 10) -> dict:
    if total_attempts < 5:
        easy = int(round(quiz_size * 0.70))
        medium = int(round(quiz_size * 0.30))
        hard = 0
    elif accuracy < 50:
        easy = int(round(quiz_size * 0.70))
        medium = int(round(quiz_size * 0.30))
        hard = 0
    elif accuracy <= 80:
        easy = int(round(quiz_size * 0.20))
        medium = int(round(quiz_size * 0.60))
        hard = int(round(quiz_size * 0.20))
    else:
        easy = 0
        medium = int(round(quiz_size * 0.20))
        hard = int(round(quiz_size * 0.80))
        
    # Ensure exact sum by adjusting the largest share if rounding causes a mismatch
    total = easy + medium + hard
    if total != quiz_size:
        diff = quiz_size - total
        if hard > easy and hard >= medium:
            hard += diff
        elif medium >= easy and medium >= hard:
            medium += diff
        else:
            easy += diff
            
    return {"easy": easy, "medium": medium, "hard": hard}

def calculate_dynamic_quiz_xp(score: int, total_questions: int, difficulty: str, time_taken_seconds: int, current_streak: int, weighted_base_xp: float) -> int:
    diff_mult = {'easy': 1.0, 'medium': 2.0, 'hard': 5.0}.get(difficulty, 1.0)
    
    streak_mult = 1.0
    if current_streak >= 14: streak_mult = 1.5
    elif current_streak >= 7: streak_mult = 1.25
    elif current_streak >= 3: streak_mult = 1.1
        
    total_xp = int(weighted_base_xp * diff_mult * streak_mult)
    
    if score == total_questions and total_questions > 0:
        total_xp += 50
        
    par_time = total_questions * 30
    if time_taken_seconds > 0 and time_taken_seconds < par_time:
        total_xp += 20
        
    return total_xp

def process_streak_logic(last_date: date, current_streak: int, freezes: int, today: date):
    if last_date == today:
        return current_streak, freezes, False, False
        
    def check_milestone(new_streak: int) -> bool:
        return new_streak > 0 and new_streak % 7 == 0
        
    if last_date == today - timedelta(days=1):
        new_s = current_streak + 1
        return new_s, freezes, True, check_milestone(new_s)
        
    if last_date is not None and last_date < today - timedelta(days=1):
        days_missed = (today - last_date).days - 1
        if freezes > 0:
            freezes_to_use = min(freezes, days_missed)
            freezes -= freezes_to_use
            if freezes_to_use == days_missed:
                new_s = current_streak + 1
                return new_s, freezes, True, check_milestone(new_s)
            else:
                return 1, freezes, True, False
        else:
            return 1, freezes, True, False
    return 1, freezes, True, False

class QuestionResult(BaseModel):
    question_id: int
    is_correct: bool
    time_spent: int = 0

class QuizAttemptSubmit(BaseModel):
    idempotency_key: str = Field(..., description="Unique UUID for this attempt to prevent double submission")
    topic_code: Union[str, int, None] = None
    chapter_code: str
    is_topic_quiz: bool = False
    difficulty_chosen: Literal['easy', 'medium', 'hard', 'adaptive']
    score: int = Field(ge=0, description="The user's score")
    total_questions: int = Field(gt=0, description="Total questions; must be > 0") 
    time_taken_seconds: int = Field(ge=0, description="Time taken in seconds to complete")
    question_results: list[QuestionResult] = []

class ReportSubmit(BaseModel):
    question_id: int
    issue_type: Literal['wrong_answer', 'incomplete_question', 'unclear', 'other']
    comment: str | None = None

@router.post("/reports")
async def report_question(
    report: ReportSubmit,
    user_id: str = Depends(get_current_user),
    conn: aiomysql.Connection = Depends(get_db)
):
    async with conn.cursor() as cursor:
        try:
            query = """
                INSERT INTO question_reports 
                (question_id, user_id, issue_type, comment) 
                VALUES (%s, %s, %s, %s)
            """
            await cursor.execute(query, (report.question_id, user_id, report.issue_type, report.comment))
            await conn.commit()
            return {"success": True, "message": "Report submitted successfully"}
        except Exception as e:
            await conn.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to submit report: {str(e)}")

@router.get("/debug_triggers")
async def debug_triggers(conn: aiomysql.Connection = Depends(get_db)):
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute("SHOW TRIGGERS")
        triggers = await cur.fetchall()
        found = []
        for t in triggers:
            stmt = t.get('Statement', '').lower()
            if 'quizzes' in stmt:
                found.append(t)
        return {"found": found}

@router.get("/debug_all")
async def debug_all(conn: aiomysql.Connection = Depends(get_db)):
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute("SHOW TABLES")
        tables = await cur.fetchall()
        
        await cur.execute("SHOW TRIGGERS")
        triggers = await cur.fetchall()
        trig_found = [t['Trigger'] for t in triggers if 'quizzes' in t.get('Statement', '').lower()]
        
        await cur.execute("SHOW FULL TABLES WHERE TABLE_TYPE LIKE 'VIEW'")
        views = await cur.fetchall()
        
        return {
            "tables": tables,
            "triggers_with_quizzes": trig_found,
            "views": views
        }

def format_questions(rows):
    formatted = []
    import json
    for q in rows:
        options = []
        for i in range(4):
            text = q.get(f"option_{i}")
            img = q.get(f"option_{i}_image_url")
            if text is not None or img is not None:
                options.append({"text": text, "image_url": img})
        
        ans_raw = q.get("correct_answers")
        ans = []
        if isinstance(ans_raw, str):
            try:
                ans = json.loads(ans_raw)
            except:
                ans = []
        elif isinstance(ans_raw, list):
            ans = ans_raw
        elif q.get("ans") is not None:
            ans = [q.get("ans")]
            
        formatted.append({
            **q,
            "options": options,
            "ans": ans
        })
    return formatted



async def fetch_questions_from_db(cursor, user_id, topic_code, diff_level, limit, excluded_ids=None):
    if limit <= 0: return []
    if excluded_ids is None:
        excluded_ids = []
    
    placeholders = ''
    if excluded_ids:
        placeholders = 'AND q.id NOT IN (' + ', '.join(['%s'] * len(excluded_ids)) + ')'
    
    query = f'''
        SELECT 
            q.id, q.base_xp, q.question_text as q, q.question_image_url, 
            q.option_0, q.option_0_image_url, q.option_1, q.option_1_image_url, 
            q.option_2, q.option_2_image_url, q.option_3, q.option_3_image_url, 
            q.correct_answers, q.question_type,
            q.explanation, q.tags, q.expected_time_seconds,
            q.question_translations, q.options_translations, q.explanation_translations
        FROM quiz_questions q
        LEFT JOIN user_question_history uqh ON q.id = uqh.question_id AND uqh.user_id = %s
        WHERE q.topic_code = %s AND q.difficulty = %s AND q.is_active = TRUE {placeholders}
        ORDER BY 
            COALESCE(uqh.times_seen, 0) ASC,
            uqh.is_correct ASC,
            uqh.last_seen_at ASC,
            RAND()
        LIMIT %s
    '''
    params = [user_id, topic_code, diff_level] + excluded_ids + [limit]
    await cursor.execute(query, tuple(params))
    return await cursor.fetchall()


@router.get("/topics/{topic_code}/questions")
async def get_quiz_questions(
    topic_code: str,
    difficulty: Literal['easy', 'medium', 'hard', 'adaptive'] = Query("easy"),
    user_id: str = Depends(get_current_user),
    conn: aiomysql.Connection = Depends(get_db)
):
    """Fetches the quiz questions from the universal pool for a chapter/topic."""
    async with conn.cursor(aiomysql.DictCursor) as cursor:
        quiz_size = 10
        
        if difficulty == 'adaptive':
            # 1. Historical Accuracy Service
            await cursor.execute(
                "SELECT COALESCE(mastery_percentage, 0) as accuracy, COALESCE(lifetime_attempts, 0) as attempts FROM user_topic_progress WHERE user_id = %s AND topic_code = %s",
                (user_id, topic_code)
            )
            stats = await cursor.fetchone()
            if stats:
                acc = float(stats['accuracy'])
                attempts = int(stats['attempts'])
            else:
                acc = 0.0
                attempts = 0
                
            # 2. Distribution Engine Logic
            dist = calculate_difficulty_distribution(acc, attempts, quiz_size)
            req_easy, req_medium, req_hard = dist["easy"], dist["medium"], dist["hard"]
            
            # Helper to fetch questions for a specific difficulty
            async def fetch_questions(diff_level, limit):
                if limit <= 0: return []
                query = '''
                    SELECT 
                        q.id, q.base_xp, q.question_text as q, q.question_image_url, 
                        q.option_0, q.option_0_image_url, q.option_1, q.option_1_image_url, 
                        q.option_2, q.option_2_image_url, q.option_3, q.option_3_image_url, 
                        q.correct_answers, q.question_type,
                        q.explanation, q.tags, q.expected_time_seconds,
                        q.question_translations, q.options_translations, q.explanation_translations
                    FROM quiz_questions q
                    LEFT JOIN user_question_history uqh ON q.id = uqh.question_id AND uqh.user_id = %s
                    WHERE q.topic_code = %s AND q.difficulty = %s AND q.is_active = TRUE
                    ORDER BY 
                        COALESCE(uqh.times_seen, 0) ASC,
                        uqh.is_correct ASC,
                        uqh.last_seen_at ASC,
                        RAND()
                    LIMIT %s
                '''
                await cursor.execute(query, (user_id, topic_code, diff_level, limit))
                return await cursor.fetchall()

            # 3. Quiz Payload Fetcher with Waterfall Fill
            final_questions = []
            
            # Try fetching Hard
            hard_q = await fetch_questions('hard', req_hard)
            final_questions.extend(hard_q)
            deficit = req_hard - len(hard_q)
            req_medium += deficit # cascade down
            
            # Try fetching Medium
            med_q = await fetch_questions('medium', req_medium)
            final_questions.extend(med_q)
            deficit = req_medium - len(med_q)
            req_easy += deficit # cascade down
            
            # Try fetching Easy
            easy_q = await fetch_questions('easy', req_easy)
            final_questions.extend(easy_q)
            deficit = req_easy - len(easy_q)
            
            # If still deficit, cascade UP (we just need ANY questions)
            if deficit > 0:
                # get any remaining questions not already in final_questions
                excluded_ids = [q['id'] for q in final_questions]
                if excluded_ids:
                    placeholders = ', '.join(['%s'] * len(excluded_ids))
                    query = f'''
                        SELECT 
                            q.id, q.base_xp, q.question_text as q, q.question_image_url, 
                            q.option_0, q.option_0_image_url, q.option_1, q.option_1_image_url, 
                            q.option_2, q.option_2_image_url, q.option_3, q.option_3_image_url, 
                            q.correct_answers, q.question_type,
                            q.explanation, q.tags, q.expected_time_seconds,
                            q.question_translations, q.options_translations, q.explanation_translations
                        FROM quiz_questions q
                        WHERE q.topic_code = %s AND q.is_active = TRUE AND q.id NOT IN ({placeholders})
                        ORDER BY RAND()
                        LIMIT %s
                    '''
                    params = [topic_code] + excluded_ids + [deficit]
                    await cursor.execute(query, tuple(params))
                else:
                    query = '''
                        SELECT 
                            q.id, q.base_xp, q.question_text as q, q.question_image_url, 
                            q.option_0, q.option_0_image_url, q.option_1, q.option_1_image_url, 
                            q.option_2, q.option_2_image_url, q.option_3, q.option_3_image_url, 
                            q.correct_answers, q.question_type,
                            q.explanation, q.tags, q.expected_time_seconds,
                            q.question_translations, q.options_translations, q.explanation_translations
                        FROM quiz_questions q
                        WHERE q.topic_code = %s AND q.is_active = TRUE
                        ORDER BY RAND()
                        LIMIT %s
                    '''
                    await cursor.execute(query, (topic_code, deficit))
                extra_q = await cursor.fetchall()
                final_questions.extend(extra_q)
                
            # Shuffle final questions
            import random
            random.shuffle(final_questions)
            return format_questions(final_questions)
            
        else:
            # Standard logic
            query = '''
                SELECT 
                    q.id, q.base_xp, q.question_text as q, q.question_image_url, 
                    q.option_0, q.option_0_image_url, q.option_1, q.option_1_image_url, 
                    q.option_2, q.option_2_image_url, q.option_3, q.option_3_image_url, 
                    q.correct_answers, q.question_type,
                    q.explanation, q.tags, q.expected_time_seconds,
                    q.question_translations, q.options_translations, q.explanation_translations
                FROM quiz_questions q
                LEFT JOIN user_question_history uqh ON q.id = uqh.question_id AND uqh.user_id = %s
                WHERE q.topic_code = %s AND q.difficulty = %s AND q.is_active = TRUE
                ORDER BY 
                    COALESCE(uqh.times_seen, 0) ASC,
                    uqh.is_correct ASC,
                    uqh.last_seen_at ASC,
                    RAND()
                LIMIT %s
            '''
            await cursor.execute(query, (user_id, topic_code, difficulty, quiz_size))
            return format_questions(await cursor.fetchall())


@router.get("/chapters/{chapter_code}/mistakes")
async def get_mistakes_questions(
    chapter_code: str,
    user_id: str = Depends(get_current_user),
    conn: aiomysql.Connection = Depends(get_db)
):
    """Fetches up to 10 questions the user got wrong in a specific chapter."""
    async with conn.cursor(aiomysql.DictCursor) as cursor:
        query = """
            SELECT 
                q.id, q.base_xp, q.question_text as q, q.question_image_url, 
                q.option_0, q.option_0_image_url, q.option_1, q.option_1_image_url, 
                q.option_2, q.option_2_image_url, q.option_3, q.option_3_image_url, 
                q.correct_answers, q.question_type,
                q.explanation, q.tags, q.expected_time_seconds,
                q.question_translations, q.options_translations, q.explanation_translations
            FROM quiz_questions q
            JOIN user_question_history uqh ON q.id = uqh.question_id
            JOIN topics t ON q.topic_code = t.code
            WHERE uqh.user_id = %s AND t.chapter_code = %s AND uqh.is_correct = FALSE AND q.is_active = TRUE
            ORDER BY uqh.last_seen_at ASC, RAND()
            LIMIT 10
        """
        await cursor.execute(query, (user_id, chapter_code))
        questions = await cursor.fetchall()

        return format_questions(questions)


def allocate_adaptive_slots(topic_scores: dict, starved_topics: list, old_topics: list) -> dict:
    allocations = {t: 0 for t in topic_scores}
    
    coverage_slots = 3
    for st in starved_topics:
        if coverage_slots > 0 and st in allocations:
            allocations[st] += 1
            coverage_slots -= 1
            
    spaced_slots = 2
    for ot in old_topics:
        if spaced_slots > 0 and ot in allocations:
            allocations[ot] += 1
            spaced_slots -= 1
            
    weakness_slots = 5 + coverage_slots + spaced_slots
    sorted_topics = sorted(topic_scores.keys(), key=lambda t: topic_scores[t])
    weak_1 = sorted_topics[0] if len(sorted_topics) > 0 else None
    weak_2 = sorted_topics[1] if len(sorted_topics) > 1 else weak_1
    
    for _ in range(weakness_slots):
        if weak_1 and allocations.get(weak_1, 0) <= allocations.get(weak_2, 0):
            allocations[weak_1] += 1
        elif weak_2:
            allocations[weak_2] += 1
        elif weak_1:
            allocations[weak_1] += 1
            
    return allocations

async def update_topic_progress_python(cursor, user_id: str, topic_code: str, is_sandbox: bool):
    await cursor.execute("SELECT mastery_percentage FROM user_topic_progress WHERE user_id = %s AND topic_code = %s", (user_id, topic_code))
    existing = await cursor.fetchone()
    previous_mastery = float(existing['mastery_percentage']) if existing and existing['mastery_percentage'] is not None else 0.0

    if previous_mastery <= 40.0:
        filter_sql = "WHERE user_id = %s AND topic_code = %s"
    else:
        filter_sql = "WHERE user_id = %s AND topic_code = %s AND quiz_mode = 'adaptive'"

    await cursor.execute(f"""
        SELECT 
            COUNT(*) as total_qs,
            SUM(CASE WHEN q.difficulty='easy' THEN 1 ELSE 0 END) as easy_qs,
            SUM(CASE WHEN q.difficulty='easy' AND qal.is_correct=1 THEN 1 ELSE 0 END) as easy_score,
            SUM(CASE WHEN q.difficulty='medium' THEN 1 ELSE 0 END) as med_qs,
            SUM(CASE WHEN q.difficulty='medium' AND qal.is_correct=1 THEN 1 ELSE 0 END) as med_score,
            SUM(CASE WHEN q.difficulty='hard' THEN 1 ELSE 0 END) as hard_qs,
            SUM(CASE WHEN q.difficulty='hard' AND qal.is_correct=1 THEN 1 ELSE 0 END) as hard_score
        FROM (
            SELECT question_id, is_correct 
            FROM question_attempt_logs 
            {filter_sql}
            ORDER BY id DESC LIMIT 30
        ) qal
        JOIN quiz_questions q ON qal.question_id = q.id
    """, (user_id, topic_code))
    stats = await cursor.fetchone()
    if not stats or not stats['total_qs']:
        return

    rolling_attempts_count = int(stats['total_qs'] or 0)
    easy_qs = int(stats['easy_qs'] or 0)
    med_qs = int(stats['med_qs'] or 0)
    hard_qs = int(stats['hard_qs'] or 0)
    easy_score = int(stats['easy_score'] or 0)
    med_score = int(stats['med_score'] or 0)
    hard_score = int(stats['hard_score'] or 0)
    
    total_earned_weights = (easy_score * 1) + (med_score * 2) + (hard_score * 3)
    dynamic_denominator = rolling_attempts_count * 3
    
    new_mastery = (total_earned_weights / dynamic_denominator * 100) if dynamic_denominator > 0 else 0
    easy_acc = (easy_score / easy_qs * 100) if easy_qs > 0 else 0
    med_acc = (med_score / med_qs * 100) if med_qs > 0 else 0
    hard_acc = (hard_score / hard_qs * 100) if hard_qs > 0 else 0
    
    if is_sandbox:
        capped_acc = min(new_mastery, 40.0)
        if previous_mastery > 40.0:
            new_mastery = previous_mastery
        else:
            new_mastery = capped_acc

    status = 'calibrating' if rolling_attempts_count < 10 else 'active'
    
    # Calculate unresolved mistakes
    await cursor.execute("""
        SELECT COUNT(*) as unresolved 
        FROM user_mistake_lifecycle uml
        JOIN quiz_questions q ON uml.question_id = q.id
        WHERE uml.user_id = %s AND q.topic_code = %s AND uml.status = 'pending'
    """, (user_id, topic_code))
    mistakes_res = await cursor.fetchone()
    unresolved_count = mistakes_res['unresolved'] if mistakes_res else 0
    
    await cursor.execute("""
        INSERT INTO user_topic_progress (
            user_id, topic_code, lifetime_attempts, mastery_percentage, easy_accuracy, medium_accuracy, hard_accuracy, 
            status, last_attempted_at, rolling_attempts_count, previous_mastery_percentage, unresolved_mistakes_count
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW(), %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            lifetime_attempts = lifetime_attempts + 1,
            previous_mastery_percentage = mastery_percentage,
            mastery_percentage = VALUES(mastery_percentage),
            easy_accuracy = VALUES(easy_accuracy),
            medium_accuracy = VALUES(medium_accuracy),
            hard_accuracy = VALUES(hard_accuracy),
            status = VALUES(status),
            last_attempted_at = NOW(),
            rolling_attempts_count = VALUES(rolling_attempts_count),
            unresolved_mistakes_count = VALUES(unresolved_mistakes_count)
    """, (user_id, topic_code, 1, new_mastery, easy_acc, med_acc, hard_acc, status, rolling_attempts_count, previous_mastery, unresolved_count))

    # --- Trigger 4: Arena Unlock ---
    await cursor.execute("SELECT chapter_code FROM topics WHERE code = %s", (topic_code,))
    topic_res = await cursor.fetchone()
    if topic_res:
        chapter_code = topic_res['chapter_code']
        await cursor.execute("""
            SELECT AVG(utp.mastery_percentage) as avg_topic_mastery
            FROM user_topic_progress utp
            JOIN topics t ON utp.topic_code = t.id
            WHERE utp.user_id = %s AND t.chapter_code = %s
        """, (user_id, chapter_code))
        avg_res = await cursor.fetchone()
        avg_topic_mastery = float(avg_res['avg_topic_mastery']) if avg_res and avg_res['avg_topic_mastery'] else 0.0
        
        if avg_topic_mastery >= 70.0:
            import uuid
            action_url = f"chapter/{chapter_code}"
            await cursor.execute("""
                SELECT id FROM user_notices 
                WHERE user_id = %s AND notice_type = 'MILESTONE' AND action_url = %s
            """, (user_id, action_url))
            if not await cursor.fetchone():
                await cursor.execute("""
                    INSERT INTO user_notices (id, user_id, notice_type, message, action_cta, action_url)
                    VALUES (%s, %s, 'MILESTONE', 'Chapter Challenge Unlocked! Your Topic Mastery is over 70%%. You are ready to earn maximum XP.', 'ENTER ARENA', %s)
                """, (str(uuid.uuid4()), user_id, action_url))

async def update_chapter_progress_python(cursor, user_id: str, chapter_code: str):
    await cursor.execute("""
        SELECT 
            COUNT(*) as total_qs,
            SUM(CASE WHEN q.difficulty='easy' THEN 1 ELSE 0 END) as easy_qs,
            SUM(CASE WHEN q.difficulty='easy' AND qal.is_correct=1 THEN 1 ELSE 0 END) as easy_score,
            SUM(CASE WHEN q.difficulty='medium' THEN 1 ELSE 0 END) as med_qs,
            SUM(CASE WHEN q.difficulty='medium' AND qal.is_correct=1 THEN 1 ELSE 0 END) as med_score,
            SUM(CASE WHEN q.difficulty='hard' THEN 1 ELSE 0 END) as hard_qs,
            SUM(CASE WHEN q.difficulty='hard' AND qal.is_correct=1 THEN 1 ELSE 0 END) as hard_score
        FROM (
            SELECT question_id, is_correct 
            FROM question_attempt_logs 
            WHERE user_id = %s AND chapter_code = %s AND quiz_mode = 'adaptive'
            ORDER BY id DESC LIMIT 30
        ) qal
        JOIN quiz_questions q ON qal.question_id = q.id
    """, (user_id, chapter_code))
    stats = await cursor.fetchone()
    if not stats or not stats['total_qs']:
        return

    rolling_attempts_count = int(stats['total_qs'] or 0)
    easy_qs = int(stats['easy_qs'] or 0)
    med_qs = int(stats['med_qs'] or 0)
    hard_qs = int(stats['hard_qs'] or 0)
    easy_score = int(stats['easy_score'] or 0)
    med_score = int(stats['med_score'] or 0)
    hard_score = int(stats['hard_score'] or 0)
    
    total_earned_weights = (easy_score * 1) + (med_score * 2) + (hard_score * 3)
    dynamic_denominator = rolling_attempts_count * 3
    
    new_mastery = (total_earned_weights / dynamic_denominator * 100) if dynamic_denominator > 0 else 0
    easy_acc = (easy_score / easy_qs * 100) if easy_qs > 0 else 0
    med_acc = (med_score / med_qs * 100) if med_qs > 0 else 0
    hard_acc = (hard_score / hard_qs * 100) if hard_qs > 0 else 0
    
    await cursor.execute("SELECT mastery_percentage FROM user_chapter_progress WHERE user_id = %s AND chapter_code = %s", (user_id, chapter_code))
    existing = await cursor.fetchone()
    previous_mastery = float(existing['mastery_percentage']) if existing and existing['mastery_percentage'] is not None else 0.0

    status = 'calibrating' if rolling_attempts_count < 10 else 'active'
    
    # Calculate unresolved mistakes
    await cursor.execute("""
        SELECT COUNT(*) as unresolved 
        FROM user_mistake_lifecycle uml
        JOIN quiz_questions q ON uml.question_id = q.id
        WHERE uml.user_id = %s AND q.chapter_code = %s AND uml.status = 'pending'
    """, (user_id, chapter_code))
    mistakes_res = await cursor.fetchone()
    unresolved_count = mistakes_res['unresolved'] if mistakes_res else 0
    
    await cursor.execute("""
        INSERT INTO user_chapter_progress (
            user_id, chapter_code, lifetime_attempts, mastery_percentage, 
            status, last_attempted_at, rolling_attempts_count, previous_mastery_percentage, unresolved_mistakes_count
        )
        VALUES (%s, %s, %s, %s, %s, NOW(), %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            lifetime_attempts = lifetime_attempts + 1,
            previous_mastery_percentage = mastery_percentage,
            mastery_percentage = VALUES(mastery_percentage),
            status = VALUES(status),
            last_attempted_at = NOW(),
            rolling_attempts_count = VALUES(rolling_attempts_count),
            unresolved_mistakes_count = VALUES(unresolved_mistakes_count)
    """, (user_id, chapter_code, 1, new_mastery, status, rolling_attempts_count, previous_mastery, unresolved_count))


async def update_subject_progress_python(cursor, user_id: str, subject_code: str):
    # Total active chapters in subject
    await cursor.execute("SELECT COUNT(*) as count FROM chapters WHERE subject_code = %s AND is_active = TRUE", (subject_code,))
    total_chapters = (await cursor.fetchone())['count'] or 0

    if total_chapters == 0:
        return

    # Sum active chapter mastery percentages
    await cursor.execute("""
        SELECT 
            SUM(ucp.mastery_percentage) as total_mastery,
            SUM(CASE WHEN ucp.mastery_percentage >= 75.00 AND ucp.status = 'active' THEN 1 ELSE 0 END) as chapters_completed
        FROM chapters c
        JOIN user_chapter_progress ucp ON c.code = ucp.chapter_code
        WHERE c.subject_code = %s AND c.is_active = TRUE AND ucp.user_id = %s AND ucp.status = 'active'
    """, (subject_code, user_id))
    stats = await cursor.fetchone()
    
    total_mastery = float(stats['total_mastery']) if stats and stats['total_mastery'] is not None else 0.0
    chapters_completed = int(stats['chapters_completed']) if stats and stats['chapters_completed'] is not None else 0

    new_mastery = total_mastery / total_chapters
    
    await cursor.execute("SELECT mastery_percentage FROM user_subject_progress WHERE user_id = %s AND subject_code = %s", (user_id, subject_code))
    existing = await cursor.fetchone()
    previous_mastery = float(existing['mastery_percentage']) if existing and existing['mastery_percentage'] is not None else 0.0

    await cursor.execute("""
        INSERT INTO user_subject_progress (
            user_id, subject_code, mastery_percentage, previous_mastery_percentage,
            chapters_completed, total_chapters, last_attempted_at
        )
        VALUES (%s, %s, %s, %s, %s, %s, NOW())
        ON DUPLICATE KEY UPDATE
            previous_mastery_percentage = mastery_percentage,
            mastery_percentage = VALUES(mastery_percentage),
            chapters_completed = VALUES(chapters_completed),
            total_chapters = VALUES(total_chapters),
            last_attempted_at = NOW()
    """, (user_id, subject_code, new_mastery, previous_mastery, chapters_completed, total_chapters))

@router.post("/attempts")
async def submit_quiz_attempt(
    attempt: QuizAttemptSubmit,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user),
    conn: aiomysql.Connection = Depends(get_db)
):
    async with conn.cursor(aiomysql.DictCursor) as cursor:
        try:
            await conn.begin()

            await cursor.execute("SELECT total_xp, current_streak, last_streak_date, streak_freezes FROM users WHERE id = %s FOR UPDATE", (user_id,))
            user = await cursor.fetchone()
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            
            total_xp = user.get('total_xp') or 0
            current_streak = user.get('current_streak') or 0
            streak_freezes = user.get('streak_freezes') or 0
            
            old_level, old_rank_title = await get_new_level(cursor, total_xp)
            today = date.today()
            new_streak, new_freezes, streak_updated, milestone_reached = process_streak_logic(
                user.get('last_streak_date'), current_streak, streak_freezes, today
            )
            
            streak_freezes_awarded = 0
            if milestone_reached and new_freezes < 3:
                new_freezes += 1
                streak_freezes_awarded += 1
            
            if not attempt.is_topic_quiz and streak_updated:
                await cursor.execute(
                    "UPDATE users SET current_streak=%s, last_streak_date=%s, streak_freezes=%s WHERE id=%s",
                    (new_streak, today, new_freezes, user_id)
                )

            weighted_base_xp = 0.0
            correct_q_ids = [r.question_id for r in attempt.question_results if r.is_correct]
            if correct_q_ids:
                format_strings = ','.join(['%s'] * len(correct_q_ids))
                query = f"SELECT base_xp, COALESCE(difficulty_weight, 1.0) as weight FROM quiz_questions WHERE id IN ({format_strings})"
                await cursor.execute(query, tuple(correct_q_ids))
                q_weights = await cursor.fetchall()
                for q in q_weights:
                    weighted_base_xp += float(q['base_xp']) * float(q['weight'])

            if not attempt.is_topic_quiz:
                await cursor.execute("SELECT lifetime_attempts FROM user_chapter_progress WHERE user_id = %s AND chapter_code = %s", (user_id, attempt.chapter_code))
                chap_prog = await cursor.fetchone()
                lifetime_attempts = chap_prog['lifetime_attempts'] if chap_prog else 0
                if lifetime_attempts > 0:
                    multiplier = max(0.2, 0.75 ** lifetime_attempts)
                    weighted_base_xp = weighted_base_xp * multiplier

            earned_xp = calculate_dynamic_quiz_xp(
                score=attempt.score, total_questions=attempt.total_questions,
                difficulty=attempt.difficulty_chosen, time_taken_seconds=attempt.time_taken_seconds,
                current_streak=new_streak, weighted_base_xp=weighted_base_xp
            )

            if attempt.is_topic_quiz:
                earned_xp = 0

            attempt_query = """
                INSERT INTO quiz_attempts 
                (user_id, chapter_code, topic_code, difficulty_chosen, score, total_questions, time_taken_seconds, xp_earned, accuracy, idempotency_key)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            tid = attempt.topic_code if attempt.topic_code != -1 else None
            
            # Calculate accuracy explicitly on backend (protects against weighted score inflation)
            correct_count = sum(1 for r in attempt.question_results if r.is_correct)
            calc_accuracy = (correct_count / attempt.total_questions * 100) if attempt.total_questions > 0 else 0.0
            
            import pymysql
            try:
                await cursor.execute(attempt_query, (
                    user_id, attempt.chapter_code, tid, attempt.difficulty_chosen, 
                    attempt.score, attempt.total_questions, attempt.time_taken_seconds, earned_xp, calc_accuracy, attempt.idempotency_key
                ))
            except pymysql.err.IntegrityError as e:
                if e.args[0] == 1062 and "idx_idempotency" in e.args[1]:
                    await conn.rollback()
                    raise HTTPException(status_code=409, detail="Duplicate attempt submission detected.")
                raise e
            
            attempt_id = cursor.lastrowid

            if attempt.question_results:
                history_query = """
                    INSERT INTO user_question_history (user_id, question_id, is_correct, times_seen, avg_time_spent, last_seen_at, ever_incorrect, is_resolved) 
                    VALUES (%s, %s, %s, 1, %s, NOW(), IF(%s=0, TRUE, FALSE), FALSE)
                    ON DUPLICATE KEY UPDATE 
                        is_correct = VALUES(is_correct),
                        avg_time_spent = ROUND(((avg_time_spent * times_seen) + VALUES(avg_time_spent)) / (times_seen + 1)),
                        times_seen = times_seen + 1,
                        last_seen_at = NOW(),
                        ever_incorrect = IF(VALUES(is_correct)=0, TRUE, ever_incorrect),
                        is_resolved = IF(VALUES(is_correct)=1 AND ever_incorrect=TRUE, TRUE, is_resolved)
                """
                history_data = [(user_id, r.question_id, r.is_correct, r.time_spent, r.is_correct) for r in attempt.question_results]
                await cursor.executemany(history_query, history_data)

                mistakes_data = [(user_id, r.question_id) for r in attempt.question_results if not r.is_correct]
                resolved_data = [(user_id, r.question_id) for r in attempt.question_results if r.is_correct]

                q_logs_query = """
                    INSERT INTO question_attempt_logs 
                    (user_id, topic_code, chapter_code, question_id, difficulty, is_correct, quiz_mode)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """
                q_ids = [r.question_id for r in attempt.question_results]
                if q_ids:
                    placeholders = ','.join(['%s'] * len(q_ids))
                    await cursor.execute(f"SELECT id, topic_code FROM quiz_questions WHERE id IN ({placeholders})", tuple(q_ids))
                    q_topic_map = {row['id']: row['topic_code'] for row in await cursor.fetchall()}
                else:
                    q_topic_map = {}

                def get_tid(q_id):
                    t = attempt.topic_code if attempt.topic_code != -1 else None
                    if t is None:
                        mapped = q_topic_map.get(q_id)
                        return mapped if mapped is not None else 1
                    return t

                q_logs_data = [(user_id, get_tid(r.question_id), attempt.chapter_code, r.question_id, attempt.difficulty_chosen, r.is_correct, 'sandbox' if attempt.is_topic_quiz else 'adaptive') for r in attempt.question_results]
                await cursor.executemany(q_logs_query, q_logs_data)
                
                if mistakes_data:
                    mistakes_query = """
                        INSERT INTO user_mistake_lifecycle (user_id, question_id, status, failed_at)
                        VALUES (%s, %s, 'pending', NOW())
                        ON DUPLICATE KEY UPDATE
                            status = 'pending',
                            failed_at = NOW()
                    """
                    await cursor.executemany(mistakes_query, mistakes_data)

                if resolved_data:
                    resolved_query = """
                        UPDATE user_mistake_lifecycle
                        SET status = 'resolved',
                            resolved_at = NOW(),
                            attempts_to_resolve = attempts_to_resolve + 1
                        WHERE user_id = %s AND question_id = %s AND status = 'pending'
                    """
                    await cursor.executemany(resolved_query, resolved_data)

            # TOP-DOWN UPDATE RULE
            # Collect unique topics tested in this quiz
            tested_topics = set()
            if attempt.question_results:
                for r in attempt.question_results:
                    tested_topics.add(get_tid(r.question_id))

            await cursor.execute("SELECT subject_code FROM chapters WHERE code = %s", (attempt.chapter_code,))
            subj_res = await cursor.fetchone()
            subject_code = subj_res['subject_code'] if subj_res else None

            if attempt.is_topic_quiz:
                # Path A: Topic Warm-Up
                for t_id in tested_topics:
                    await update_topic_progress_python(cursor, user_id, t_id, is_sandbox=True)
                if subject_code:
                    await update_subject_progress_python(cursor, user_id, subject_code)
            else:
                # Path B: Chapter Adaptive Quiz
                await update_chapter_progress_python(cursor, user_id, attempt.chapter_code)
                for t_id in tested_topics:
                    await update_topic_progress_python(cursor, user_id, t_id, is_sandbox=False)
                if subject_code:
                    await update_subject_progress_python(cursor, user_id, subject_code)

            # Masteries
            if attempt.is_topic_quiz:
                await cursor.execute("SELECT mastery_percentage, previous_mastery_percentage FROM user_topic_progress WHERE user_id = %s AND topic_code = %s", (user_id, attempt.topic_code))
                mastery_res = await cursor.fetchone()
            else:
                await cursor.execute("SELECT mastery_percentage, previous_mastery_percentage FROM user_chapter_progress WHERE user_id = %s AND chapter_code = %s", (user_id, attempt.chapter_code))
                mastery_res = await cursor.fetchone()
            
            if mastery_res:
                old_mastery = float(mastery_res['previous_mastery_percentage'])
                new_mastery = float(mastery_res['mastery_percentage'])
            else:
                old_mastery = 0.0
                new_mastery = 0.0

            if earned_xp > 0:
                xp_log_query = "INSERT INTO xp_logs (user_id, amount, source_type, source_reference_table, source_id) VALUES (%s, %s, 'quiz', 'quiz_attempts', %s)"
                await cursor.execute(xp_log_query, (user_id, earned_xp, attempt_id))

            new_total_xp = total_xp + earned_xp
            new_level, new_rank_title = await get_new_level(cursor, new_total_xp)
            
            new_accuracy = None
            if attempt.topic_code != -1:
                acc_check_query = "SELECT mastery_percentage FROM user_topic_progress WHERE user_id = %s AND topic_code = %s"
                await cursor.execute(acc_check_query, (user_id, attempt.topic_code))
                acc_check_res = await cursor.fetchone()
                if acc_check_res:
                    new_accuracy = float(acc_check_res['mastery_percentage'])
            
            leveled_up = False
            if new_level > old_level:
                leveled_up = True
                if new_freezes < 3:
                    new_freezes += 1
                    streak_freezes_awarded += 1
                    await cursor.execute(
                        "UPDATE users SET streak_freezes = %s WHERE id = %s",
                        (new_freezes, user_id)
                    )

            # --- Notice Triggers ---
            import uuid
            
            # Trigger 1: XP Decay Warning
            if not attempt.is_topic_quiz:
                await cursor.execute("SELECT lifetime_attempts FROM user_chapter_progress WHERE user_id = %s AND chapter_code = %s", (user_id, attempt.chapter_code))
                chap_prog = await cursor.fetchone()
                lifetime_attempts = chap_prog['lifetime_attempts'] if chap_prog else 1
                
                if lifetime_attempts >= 3:
                    action_url = f"chapter/{attempt.chapter_code}"
                    await cursor.execute("""
                        SELECT id FROM user_notices 
                        WHERE user_id = %s AND notice_type = 'WARNING' AND action_url = %s
                    """, (user_id, action_url))
                    if not await cursor.fetchone():
                        await cursor.execute("""
                            INSERT INTO user_notices (id, user_id, notice_type, message, action_cta, action_url)
                            VALUES (%s, %s, 'WARNING', 'Your XP yield for this chapter is dropping due to repeated attempts. Pause and review the warm-ups.', 'REVIEW WARM-UPS', %s)
                        """, (str(uuid.uuid4()), user_id, action_url))

            # Trigger 2: Weakness Remediation
            if attempt.is_topic_quiz and calc_accuracy < 50.0:
                action_url = f"learning"
                await cursor.execute("""
                    SELECT id FROM user_notices 
                    WHERE user_id = %s AND notice_type = 'RECOMMENDATION' AND action_url = %s
                """, (user_id, action_url))
                if not await cursor.fetchone():
                    await cursor.execute("""
                        INSERT INTO user_notices (id, user_id, notice_type, message, action_cta, action_url)
                        VALUES (%s, %s, 'RECOMMENDATION', 'You struggled with a topic recently. A quick review will boost your next Adaptive score.', 'PRACTICE NOW', %s)
                    """, (str(uuid.uuid4()), user_id, action_url))

            await conn.commit()
            
            return {
                "success": True, 
                "earned_xp": earned_xp,
                "leveled_up": leveled_up,
                "has_ranked_up": leveled_up,
                "new_level": new_level,
                "new_rank_title": new_rank_title,
                "streak_freezes_awarded": streak_freezes_awarded,
                "current_streak_freezes_balance": new_freezes,
                "current_streak": new_streak,
                "new_accuracy": new_accuracy,
                "old_chapter_mastery": old_mastery,
                "new_chapter_mastery": new_mastery
            }
        except HTTPException as e:
            await conn.rollback()
            raise e
        except Exception as e:
            await conn.rollback()
            raise HTTPException(status_code=500, detail=f"Transaction failed: {str(e)}")


@router.get("/analytics/chapters/{chapter_code}/tags")
async def get_topic_analytics(
    chapter_code: str,
    user_id: str = Depends(get_current_user),
    conn: aiomysql.Connection = Depends(get_db)
):
    """Fetches tag-wise accuracy and time spent based on the first tag of each question in a chapter."""
    async with conn.cursor(aiomysql.DictCursor) as cursor:
        query = """
            SELECT 
                JSON_UNQUOTE(JSON_EXTRACT(q.tags, '$[0]')) as topic,
                SUM(uqh.is_correct) as correct_answers,
                COUNT(uqh.question_id) as total_attempts,
                (SUM(uqh.is_correct) / COUNT(uqh.question_id)) * 100 as accuracy,
                AVG(uqh.avg_time_spent) as avg_time_spent
            FROM user_question_history uqh
            JOIN quiz_questions q ON uqh.question_id = q.id
            JOIN topics t ON q.topic_code = t.id
            WHERE uqh.user_id = %s AND t.chapter_code = %s AND q.tags IS NOT NULL AND JSON_LENGTH(q.tags) > 0
            GROUP BY topic
            ORDER BY accuracy ASC
        """
        await cursor.execute(query, (user_id, chapter_code))
        topics = await cursor.fetchall()
        
        # Format decimal values if needed
        for t in topics:
            if t['accuracy'] is not None:
                t['accuracy'] = float(t['accuracy'])
            if t['avg_time_spent'] is not None:
                t['avg_time_spent'] = float(t['avg_time_spent'])
                
        return topics

@router.get("/analytics/chapters/{chapter_code}/err")
async def get_err_analytics(
    chapter_code: str,
    user_id: str = Depends(get_current_user),
    conn: aiomysql.Connection = Depends(get_db)
):
    """Fetches the Error Resolution Rate (ERR) KPI for a chapter."""
    async with conn.cursor(aiomysql.DictCursor) as cursor:
        query = """
            SELECT 
                COUNT(*) as total_mistakes,
                SUM(CASE WHEN uml.status = 'resolved' THEN 1 ELSE 0 END) as resolved_mistakes
            FROM user_mistake_lifecycle uml
            JOIN quiz_questions q ON uml.question_id = q.id
            JOIN topics t ON q.topic_code = t.id
            WHERE uml.user_id = %s AND t.chapter_code = %s
        """
        await cursor.execute(query, (user_id, chapter_code))
        result = await cursor.fetchone()
        
        total = result['total_mistakes'] or 0
        resolved = int(result['resolved_mistakes']) if result['resolved_mistakes'] is not None else 0
        err_percentage = (resolved / total * 100) if total > 0 else 0
        
        return {
            "total_mistakes": total,
            "resolved_mistakes": resolved,
            "err_percentage": round(err_percentage, 2)
        }



@router.get("/chapters/{chapter_code}/questions/adaptive")
async def get_chapter_adaptive_quiz(
    chapter_code: str,
    user_id: str = Depends(get_current_user),
    conn: aiomysql.Connection = Depends(get_db)
):
    """Generates a 10-question adaptive quiz using topic-level mastery allocations."""
    async with conn.cursor(aiomysql.DictCursor) as cursor:
        await cursor.execute("SELECT code FROM topics WHERE chapter_code = %s", (chapter_code,))
        topics = await cursor.fetchall()
        topic_codes = [t['code'] for t in topics]
        
        if not topic_codes:
            return []

        # Find starved topics (Coverage)
        await cursor.execute('''
            SELECT q.topic_code, COUNT(*) as freq
            FROM (
                SELECT question_id 
                FROM question_attempt_logs 
                WHERE user_id = %s AND chapter_code = %s AND difficulty = 'adaptive'
                ORDER BY id DESC 
                LIMIT 30
            ) last_30
            JOIN quiz_questions q ON last_30.question_id = q.id
            GROUP BY q.topic_code
        ''', (user_id, chapter_code))
        freq_results = await cursor.fetchall()
        freq_map = {t: 0 for t in topic_codes}
        for r in freq_results:
            if r['topic_code'] in freq_map:
                freq_map[r['topic_code']] = r['freq']
        starved_topics = [t for t, freq in freq_map.items() if freq < 3]

        # Find old topics (Spaced Repetition)
        await cursor.execute('''
            SELECT topic_code, MAX(attempted_at) as last_attempt
            FROM quiz_attempts
            WHERE user_id = %s AND chapter_code = %s AND topic_code IS NOT NULL
            GROUP BY topic_code
        ''', (user_id, chapter_code))
        last_attempts = await cursor.fetchall()
        import datetime
        now = datetime.datetime.now()
        old_topics = []
        for t in topic_codes:
            last_dt = next((r['last_attempt'] for r in last_attempts if r['topic_code'] == t), None)
            if not last_dt or (now - last_dt).days > 14:
                old_topics.append(t)

        # Get Topic Scores
        await cursor.execute('''
            SELECT topic_code, COALESCE(mastery_percentage, 0) as acc
            FROM user_topic_progress
            WHERE user_id = %s AND topic_code IN ({})
        '''.format(','.join(['%s']*len(topic_codes))), (user_id, *topic_codes))
        acc_results = await cursor.fetchall()
        topic_scores = {t: 0.0 for t in topic_codes}
        for r in acc_results:
            topic_scores[r['topic_code']] = float(r['acc'])

        # Allocate Slots
        allocations = allocate_adaptive_slots(topic_scores, starved_topics, old_topics)

        final_questions = []
        
        # Helper to fetch questions ensuring no recent duplicates
        async def fetch_questions(t_id, diff, limit, exclude_ids):
            placeholders = ''
            if exclude_ids:
                placeholders = 'AND q.id NOT IN (' + ', '.join(['%s']*len(exclude_ids)) + ')'
            
            # Subquery to exclude questions seen in the last 7 days
            q = f'''
                SELECT 
                    q.id, q.base_xp, q.question_text as q, q.question_image_url, 
                    q.option_0, q.option_0_image_url, q.option_1, q.option_1_image_url, 
                    q.option_2, q.option_2_image_url, q.option_3, q.option_3_image_url, 
                    q.correct_answers, q.question_type,
                    q.explanation, q.tags, q.expected_time_seconds,
                    q.question_translations, q.options_translations, q.explanation_translations
                FROM quiz_questions q
                WHERE q.topic_code = %s AND q.difficulty = %s AND q.is_active = TRUE {placeholders}
                AND q.id NOT IN (
                    SELECT question_id FROM question_attempt_logs 
                    WHERE user_id = %s AND attempted_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
                )
                ORDER BY RAND()
                LIMIT %s
            '''
            params = [t_id, diff] + exclude_ids + [user_id, limit]
            await cursor.execute(q, tuple(params))
            return await cursor.fetchall()

        async def fetch_fallback_oldest(t_id, limit, exclude_ids):
            placeholders = ''
            if exclude_ids:
                placeholders = 'AND q.id NOT IN (' + ', '.join(['%s']*len(exclude_ids)) + ')'
            q = f'''
                SELECT 
                    q.id, q.base_xp, q.question_text as q, q.question_image_url, 
                    q.option_0, q.option_0_image_url, q.option_1, q.option_1_image_url, 
                    q.option_2, q.option_2_image_url, q.option_3, q.option_3_image_url, 
                    q.correct_answers, q.question_type,
                    q.explanation, q.tags, q.expected_time_seconds,
                    q.question_translations, q.options_translations, q.explanation_translations
                FROM quiz_questions q
                LEFT JOIN question_attempt_logs qal ON q.id = qal.question_id AND qal.user_id = %s
                WHERE q.topic_code = %s AND q.is_active = TRUE {placeholders}
                GROUP BY q.id
                ORDER BY MAX(qal.attempted_at) ASC
                LIMIT %s
            '''
            params = [user_id, t_id] + exclude_ids + [limit]
            await cursor.execute(q, tuple(params))
            return await cursor.fetchall()

        for t, count in allocations.items():
            if count <= 0: continue
            
            acc = topic_scores[t]
            if acc <= 39: target_diff = 'easy'
            elif acc <= 75: target_diff = 'medium'
            else: target_diff = 'hard'
            
            # Pull UP if exhausted
            diff_chain = []
            if target_diff == 'easy': diff_chain = ['easy', 'medium', 'hard']
            elif target_diff == 'medium': diff_chain = ['medium', 'hard']
            else: diff_chain = ['hard']
            
            needed = count
            for diff in diff_chain:
                if needed <= 0: break
                excluded = [q['id'] for q in final_questions]
                qs = await fetch_questions(t, diff, needed, excluded)
                final_questions.extend(qs)
                needed -= len(qs)

            # If still needed, fallback to oldest seen
            if needed > 0:
                excluded = [q['id'] for q in final_questions]
                qs = await fetch_fallback_oldest(t, needed, excluded)
                final_questions.extend(qs)
                needed -= len(qs)
                
        # Fill remaining deficit if topics didn't have enough questions at all
        deficit = 10 - len(final_questions)
        if deficit > 0 and topic_codes:
            excluded = [q['id'] for q in final_questions]
            qs = await fetch_fallback_oldest(topic_codes[0], deficit, excluded) # just fallback on first topic, or modify query to IN (topic_codes)
            final_questions.extend(qs)
            
        import random
        random.shuffle(final_questions)
        return format_questions(final_questions)