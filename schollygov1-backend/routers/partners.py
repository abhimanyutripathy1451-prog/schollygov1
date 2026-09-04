from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
import aiomysql

from core.database import get_db
from core.security import verify_passkey, create_access_token

router = APIRouter(prefix="/api/partners", tags=["Partners"])

class PartnerLoginRequest(BaseModel):
    mobile: str = Field(..., description="Registered mobile number")
    passkey: str = Field(..., min_length=4, max_length=4)

@router.post("/login")
async def login(payload: PartnerLoginRequest, conn: aiomysql.Connection = Depends(get_db)):
    async with conn.cursor(aiomysql.DictCursor) as cursor:
        query = "SELECT * FROM partners WHERE mobile = %s AND is_active = TRUE LIMIT 1"
        await cursor.execute(query, (payload.mobile,))
        partner = await cursor.fetchone()

        if not partner:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials.")

        hash_val = partner.get('passkey_hash')

        if hash_val is None or not verify_passkey(payload.passkey, hash_val):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials.")

        # Create access token for partner
        access_token = create_access_token(data={"sub": str(partner['id']), "role": "partner"})
        partner.pop('passkey_hash', None)
        
        return {"access_token": access_token, "token_type": "bearer", "partner": partner}
