import asyncio
import aiomysql
import bcrypt
import uuid

async def seed():
    pool = await aiomysql.create_pool(host='127.0.0.1', port=3306, user='root', password='Abhi@05051987', db='tteduappcgv2')
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            uid = str(uuid.uuid4())
            pw_hash = bcrypt.hashpw('1234'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            await cur.execute(
                "INSERT INTO users (id, username, roll_number, mobile, passkey_hash, referral_code, full_name, curriculum_code, parent_name, grade) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) "
                "ON DUPLICATE KEY UPDATE passkey_hash=%s",
                (uid, 'curr_tester', '12345', '9999999999', pw_hash, 'REF123', 'Tester User', 'G6_MATH', 'Parent', '6', pw_hash)
            )
            await conn.commit()
            print('Seeded curr_tester!')
    pool.close()
    await pool.wait_closed()

asyncio.run(seed())
