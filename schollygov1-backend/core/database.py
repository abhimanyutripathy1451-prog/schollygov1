import aiomysql
import os
from typing import AsyncGenerator

class Database:
    def __init__(self):
        self.pool = None

    async def connect(self):
        self.pool = await aiomysql.create_pool(
            host=os.environ.get('DB_HOST'),
            port=int(os.environ.get('DB_PORT')),
            user=os.environ.get('DB_USER'),
            password=os.environ.get('DB_PASSWORD'),
            db=os.environ.get('DB_NAME'),
            autocommit=True
        )

    async def disconnect(self):
        if self.pool:
            self.pool.close()
            await self.pool.wait_closed()

db_instance = Database()

async def get_db() -> AsyncGenerator[aiomysql.Connection, None]:
    if not db_instance.pool:
        await db_instance.connect()
    async with db_instance.pool.acquire() as conn:
        yield conn
