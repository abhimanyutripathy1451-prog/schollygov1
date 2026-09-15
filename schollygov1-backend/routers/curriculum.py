from fastapi import APIRouter, Depends, HTTPException, Query
import aiomysql
from core.database import get_db
from core.security import get_current_user 

router = APIRouter(prefix="/curriculum", tags=["Curriculum"])

@router.get("/curriculums")
async def get_curriculums(conn: aiomysql.Connection = Depends(get_db)):
    """Fetches available curriculums for signup/curriculum selection."""
    async with conn.cursor(aiomysql.DictCursor) as cursor:
        await cursor.execute("SELECT code, name, board, stream, medium, grade, type FROM curriculums WHERE is_active = 1 ORDER BY sequence_order, id")
        return await cursor.fetchall()

@router.get("/curriculums/{curriculum_code}/grades")
async def get_curriculum_grades(curriculum_code: str, conn: aiomysql.Connection = Depends(get_db)):
    """Fetches unique grades available for a given curriculum code based on subjects."""
    async with conn.cursor(aiomysql.DictCursor) as cursor:
        await cursor.execute(
            "SELECT DISTINCT grade FROM subjects WHERE curriculum_code = %s AND grade IS NOT NULL ORDER BY CAST(grade AS UNSIGNED)",
            (curriculum_code,)
        )
        grades = await cursor.fetchall()
        return [g['grade'] for g in grades]

@router.get("/subjects")
async def get_subjects(
    curriculum_code: str = Query(...),
    user_id: str = Depends(get_current_user),
    conn: aiomysql.Connection = Depends(get_db)
):
    """Fetches subjects for a given curriculum/grade with the current user's progress."""
    async with conn.cursor(aiomysql.DictCursor) as cursor:
        query = """
            SELECT 
                s.code as subject_code,
                s.name,
                s.name_translations, 
                s.icon_class,
                curr.medium as curriculum_medium,
                COALESCE(usp.mastery_percentage, 0.00) as progress,
                COALESCE(usp.chapters_completed, 0) as chapters_completed,
                COALESCE(usp.total_chapters, (SELECT COUNT(id) FROM chapters WHERE subject_code = s.code)) as total_chapters,
                (
                    SELECT COALESCE(SUM(qa.xp_earned), 0)
                    FROM quiz_attempts qa
                    JOIN chapters c ON qa.chapter_code = c.code
                    WHERE qa.user_id = %s AND c.subject_code = s.code
                ) as total_xp
            FROM subjects s
            LEFT JOIN curriculums curr ON s.curriculum_code = curr.code
            LEFT JOIN user_subject_progress usp ON s.code = usp.subject_code AND usp.user_id = %s
            WHERE s.curriculum_code = %s
            ORDER BY s.sequence_order
        """
        await cursor.execute(query, (user_id, user_id, curriculum_code))
        
        # NOTE: the frontend expects `id` for Subject interface. 
        # Map `subject_code` to `id` here.
        subjects = await cursor.fetchall()
        for sub in subjects:
            sub['id'] = sub['subject_code']
        return subjects

@router.get("/subjects/{subject_code}/chapters")
async def get_chapters(
    subject_code: str, 
    user_id: str = Depends(get_current_user), 
    conn: aiomysql.Connection = Depends(get_db)
):
    """Fetches all chapters for a specific subject ID along with user progress and nested topics."""
    async with conn.cursor(aiomysql.DictCursor) as cursor:
        # Check if subject exists to return 404 instead of empty list
        await cursor.execute("SELECT code FROM subjects WHERE code = %s", (subject_code,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="Subject not found")

        await cursor.execute("SELECT partner_id FROM users WHERE id = %s", (user_id,))
        partner_res = await cursor.fetchone()
        partner_id = partner_res['partner_id'] if partner_res else None

        query = """
            SELECT 
                c.code as id,
                c.subject_code,
                c.module_name,
                c.module_translations,
                c.title,
                c.title_translations,
                c.description,
                c.sequence_order,
                COALESCE(ucp.status, 'untested') as status,
                COALESCE(ucp.mastery_percentage, 0.00) as accuracy,
                0 as easy_accuracy,
                0 as medium_accuracy,
                0 as hard_accuracy,
                COALESCE(ucp.lifetime_attempts, 0) as attempts,
                COALESCE(ucp.unresolved_mistakes_count, 0) as unresolved_mistakes_count,
                COALESCE((SELECT SUM(time_taken_seconds) FROM quiz_attempts WHERE chapter_code = c.code AND user_id = %s), 0) as total_time_seconds,
                FALSE as is_locked
            FROM chapters c
            LEFT JOIN user_chapter_progress ucp ON c.code = ucp.chapter_code AND ucp.user_id = %s
            WHERE c.subject_code = %s 
            ORDER BY c.sequence_order
        """
        await cursor.execute(query, (user_id, user_id, subject_code))
        chapters = await cursor.fetchall()
        
        if not chapters:
            return []

        # Fetch all topics for these chapters in ONE query
        chapter_codes = [c['id'] for c in chapters]
        placeholders = ','.join(['%s'] * len(chapter_codes))
        topic_query = f"""
            SELECT 
                t.*,
                t.code as id,
                COALESCE(utp.mastery_percentage, 0) as accuracy,
                COALESCE(utp.lifetime_attempts, 0) as attempts,
                COALESCE(utp.status, 'untested') as mastery_state
            FROM topics t
            LEFT JOIN user_topic_progress utp 
                ON t.code = utp.topic_code 
                AND utp.user_id = %s 
            WHERE t.chapter_code IN ({placeholders}) AND t.is_active = TRUE
            ORDER BY t.sequence_order
        """
        await cursor.execute(topic_query, [user_id] + chapter_codes)
        topics = await cursor.fetchall()

        # Stitch topics into chapters in-memory O(N)
        topics_by_chapter = {}
        for t in topics:
            c_id = t['chapter_code']
            if c_id not in topics_by_chapter:
                topics_by_chapter[c_id] = []
            topics_by_chapter[c_id].append(t)
            
        for c in chapters:
            c['topics'] = topics_by_chapter.get(c['id'], [])
            
        return chapters

@router.get("/chapters/{chapter_code}/topics")
async def get_chapter_topics(
    chapter_code: str, 
    user_id: str = Depends(get_current_user), 
    conn: aiomysql.Connection = Depends(get_db)
):
    """Fetches all topics for a specific chapter ID along with user progress."""
    async with conn.cursor(aiomysql.DictCursor) as cursor:
        await cursor.execute("SELECT code FROM chapters WHERE code = %s", (chapter_code,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="Chapter not found")

        query = """
            SELECT 
                t.*,
                t.code as id,
                COALESCE(utp.mastery_percentage, 0) as accuracy,
                COALESCE(utp.lifetime_attempts, 0) as attempts,
                COALESCE(utp.status, 'untested') as mastery_state
            FROM topics t
            LEFT JOIN user_topic_progress utp 
                ON t.code = utp.topic_code 
                AND utp.user_id = %s 
            WHERE t.chapter_code = %s AND t.is_active = TRUE
            ORDER BY t.sequence_order
        """
        await cursor.execute(query, (user_id, chapter_code))
        return await cursor.fetchall()
        
