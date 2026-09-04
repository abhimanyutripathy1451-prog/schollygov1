import asyncio
import aiomysql
import os

async def check():
    db_user = os.getenv('DB_USER', 'root')
    db_password = os.getenv('DB_PASSWORD', 'Abhi@05051987')
    db_host = os.getenv('DB_HOST', 'localhost')
    db_name = os.getenv('DB_NAME', 'tteduappcgv2')

    conn = await aiomysql.connect(host=db_host, user=db_user, password=db_password, db=db_name)
    async with conn.cursor(aiomysql.DictCursor) as cursor:
        await cursor.execute("SELECT id, username FROM users WHERE username = 'ads'")
        user = await cursor.fetchone()
        print('User:', user)
        if user:
            await cursor.execute("SELECT COUNT(*) as c FROM xp_logs WHERE user_id = %s AND DATE(created_at) = CURDATE()", (user['id'],))
            print('Activity count:', (await cursor.fetchone())['c'])
            
            await cursor.execute("SELECT * FROM user_notices WHERE user_id = %s", (user['id'],))
            notices = await cursor.fetchall()
            print('Notices:', notices)
    conn.close()

asyncio.run(check())
