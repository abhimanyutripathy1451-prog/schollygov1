from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
import aiomysql
from typing import List, Optional

from core.database import get_db
# Assuming a dependency to get current user from token
# from core.security import get_current_user 

router = APIRouter(prefix="/api/batches", tags=["Batches"])

class BatchCreateRequest(BaseModel):
    institute_id: int
    name: str = Field(..., max_length=100)
    class_grade: str = Field(..., description="10, 11, or 12")
    stream: str = Field(..., description="Science, Commerce, or General")

class BatchResponse(BaseModel):
    id: int
    institute_id: int
    name: str
    class_grade: str
    stream: str

@router.post("/", response_model=BatchResponse, status_code=status.HTTP_201_CREATED)
async def create_batch(payload: BatchCreateRequest, conn: aiomysql.Connection = Depends(get_db)):
    async with conn.cursor(aiomysql.DictCursor) as cursor:
        try:
            query = """
                INSERT INTO batches (institute_id, name, class_grade, stream)
                VALUES (%s, %s, %s, %s)
            """
            await cursor.execute(query, (payload.institute_id, payload.name, payload.class_grade, payload.stream))
            await conn.commit()
            
            batch_id = cursor.lastrowid
            return {
                "id": batch_id,
                "institute_id": payload.institute_id,
                "name": payload.name,
                "class_grade": payload.class_grade,
                "stream": payload.stream
            }
        except Exception as e:
            await conn.rollback()
            raise HTTPException(status_code=400, detail=str(e))

@router.get("/{institute_id}", response_model=List[BatchResponse])
async def get_batches(institute_id: int, conn: aiomysql.Connection = Depends(get_db)):
    async with conn.cursor(aiomysql.DictCursor) as cursor:
        query = "SELECT id, institute_id, name, class_grade, stream FROM batches WHERE institute_id = %s"
        await cursor.execute(query, (institute_id,))
        batches = await cursor.fetchall()
        return batches
