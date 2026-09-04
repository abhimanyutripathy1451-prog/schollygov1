import aiomysql
from core.database import db_instance

async def calculate_rolling_mastery(user_id: str, topic_id: int, chapter_id: int):
    WINDOW_SIZE = 30
    THRESHOLD = 10
    
    if not db_instance.pool:
        await db_instance.connect()
        
    async with db_instance.pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            # 1. Topic Mastery
            topic_query = """
                SELECT difficulty, is_correct
                FROM question_attempt_logs
                WHERE user_id = %s AND topic_id = %s
                ORDER BY attempted_at DESC
                LIMIT %s
            """
            await cursor.execute(topic_query, (user_id, topic_id, WINDOW_SIZE))
            topic_logs = await cursor.fetchall()
            await update_entity_mastery(cursor, user_id, 'topic', topic_id, topic_logs, THRESHOLD)

            # 2. Chapter Mastery
            chapter_query = """
                SELECT difficulty, is_correct
                FROM question_attempt_logs
                WHERE user_id = %s AND chapter_id = %s
                ORDER BY attempted_at DESC
                LIMIT %s
            """
            await cursor.execute(chapter_query, (user_id, chapter_id, WINDOW_SIZE))
            chapter_logs = await cursor.fetchall()
            await update_entity_mastery(cursor, user_id, 'chapter', chapter_id, chapter_logs, THRESHOLD)
            
            await conn.commit()

async def update_entity_mastery(cursor, user_id, level, entity_id, logs, threshold):
    attempts = len(logs)
    state = 'Active' if attempts >= threshold else 'Calibrating'
    
    total_earned = 0
    total_possible = 0
    
    for log in logs:
        weight = 1 if log['difficulty'] == 'easy' else (2 if log['difficulty'] == 'medium' else 3)
        total_possible += weight
        if log['is_correct']:
            total_earned += weight
            
    # Apply Absolute Benchmark only for Chapter Mastery
    if level == 'chapter':
        total_possible = attempts * 3
            
    mastery_percentage = 0.00
    if total_possible > 0:
        mastery_percentage = (total_earned / total_possible) * 100
        
    upsert_query = """
        INSERT INTO user_mastery_stats (user_id, level, entity_id, attempts, state, mastery_percentage)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            attempts = VALUES(attempts),
            state = VALUES(state),
            mastery_percentage = VALUES(mastery_percentage)
    """
    await cursor.execute(upsert_query, (user_id, level, entity_id, attempts, state, mastery_percentage))
