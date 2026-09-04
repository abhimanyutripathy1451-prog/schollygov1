from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
import aiomysql
from typing import List, Optional
from core.database import get_db
# Assuming a function to hash passwords exists in core.security
# from core.security import get_password_hash

router = APIRouter(prefix="/api/teachers", tags=["Teachers"])

class TeacherCreateRequest(BaseModel):
    institute_id: int
    name: str = Field(..., max_length=100)
    contact_number: str = Field(..., max_length=15)
    passkey: str = Field(..., min_length=4, max_length=10) # Using plain passkey to hash it

class TeacherResponse(BaseModel):
    id: int
    institute_id: int
    name: str
    contact_number: str
    is_active: bool

class TeacherBatchAssignRequest(BaseModel):
    teacher_id: int
    batch_id: int
    subject: str = Field(..., max_length=100)

@router.post("/", response_model=TeacherResponse, status_code=status.HTTP_201_CREATED)
async def create_teacher(payload: TeacherCreateRequest, conn: aiomysql.Connection = Depends(get_db)):
    # hash_passkey = get_password_hash(payload.passkey)
    # Using a dummy hash for now, assuming security module will be integrated
    hash_passkey = f"hashed_{payload.passkey}"
    
    async with conn.cursor(aiomysql.DictCursor) as cursor:
        try:
            query = """
                INSERT INTO teachers (institute_id, name, contact_number, passkey_hash)
                VALUES (%s, %s, %s, %s)
            """
            await cursor.execute(query, (payload.institute_id, payload.name, payload.contact_number, hash_passkey))
            await conn.commit()
            
            teacher_id = cursor.lastrowid
            return {
                "id": teacher_id,
                "institute_id": payload.institute_id,
                "name": payload.name,
                "contact_number": payload.contact_number,
                "is_active": True
            }
        except aiomysql.IntegrityError:
            await conn.rollback()
            raise HTTPException(status_code=400, detail="Contact number already exists.")
        except Exception as e:
            await conn.rollback()
            raise HTTPException(status_code=400, detail=str(e))

@router.get("/{institute_id}", response_model=List[TeacherResponse])
async def get_teachers(institute_id: int, conn: aiomysql.Connection = Depends(get_db)):
    async with conn.cursor(aiomysql.DictCursor) as cursor:
        query = "SELECT id, institute_id, name, contact_number, is_active FROM teachers WHERE institute_id = %s"
        await cursor.execute(query, (institute_id,))
        teachers = await cursor.fetchall()
        
        # Ensure correct types are returned
        return [
            {
                "id": t["id"],
                "institute_id": t["institute_id"],
                "name": t["name"],
                "contact_number": t["contact_number"],
                "is_active": bool(t["is_active"])
            }
            for t in teachers
        ]

@router.post("/assign", status_code=status.HTTP_201_CREATED)
async def assign_teacher(payload: TeacherBatchAssignRequest, conn: aiomysql.Connection = Depends(get_db)):
    async with conn.cursor() as cursor:
        try:
            query = """
                INSERT INTO teacher_batch_assignments (teacher_id, batch_id, subject)
                VALUES (%s, %s, %s)
            """
            await cursor.execute(query, (payload.teacher_id, payload.batch_id, payload.subject))
            await conn.commit()
            return {"message": "Teacher assigned successfully"}
        except aiomysql.IntegrityError:
            await conn.rollback()
            raise HTTPException(status_code=400, detail="Assignment already exists.")
        except Exception as e:
            await conn.rollback()
            raise HTTPException(status_code=400, detail=str(e))
