from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from pydantic import BaseModel, Field
import logging

logger = logging.getLogger(__name__)

import aiomysql
import uuid
import random
import string
from typing import Optional

from core.database import get_db
from core.security import verify_passkey, get_passkey_hash, create_access_token, get_current_user
from core.limiter import limiter

router = APIRouter(prefix="/auth", tags=["Authentication"])

# --- Gamification Logic ---
async def set_user_rank_details(cursor, user: dict):
    total_xp = user.get('total_xp', 0)
    
    await cursor.execute("SELECT rank_level, title, min_xp FROM ranks ORDER BY rank_level DESC LIMIT 1")
    max_rank = await cursor.fetchone()
    
    if max_rank and total_xp >= max_rank['min_xp']:
        extra_xp = total_xp - max_rank['min_xp']
        prestige_level = extra_xp // 5000
        current_lvl = max_rank['rank_level'] + prestige_level
        rank_title = f"{max_rank['title']} +{prestige_level}" if prestige_level > 0 else max_rank['title']
        prev_lvl_xp = max_rank['min_xp'] + (prestige_level * 5000)
        next_lvl_xp = prev_lvl_xp + 5000
        tier_size = 5000
        xp_within_level = total_xp - prev_lvl_xp
        progress_pct = (xp_within_level / tier_size) * 100
    else:
        await cursor.execute("SELECT rank_level, title, min_xp FROM ranks WHERE min_xp <= %s ORDER BY rank_level DESC LIMIT 1", (total_xp,))
        current_rank = await cursor.fetchone()
        
        if not current_rank:
            current_rank = {'rank_level': 1, 'title': 'Novice', 'min_xp': 0}
            
        current_lvl = current_rank['rank_level']
        rank_title = current_rank['title']
        prev_lvl_xp = current_rank['min_xp']
        
        await cursor.execute("SELECT min_xp FROM ranks WHERE rank_level = %s", (current_lvl + 1,))
        next_rank = await cursor.fetchone()
        
        if next_rank:
            next_lvl_xp = next_rank['min_xp']
            tier_size = next_lvl_xp - prev_lvl_xp
            xp_within_level = total_xp - prev_lvl_xp
            progress_pct = (xp_within_level / tier_size) * 100 if tier_size > 0 else 100
        else:
            tier_size = 0
            xp_within_level = total_xp - prev_lvl_xp
            progress_pct = 100.0 if total_xp > 0 else 0.0

    user['computed_level'] = current_lvl
    user['rankTitle'] = rank_title
    user['next_level_xp'] = tier_size
    user['xpWithinLevel'] = xp_within_level
    user['level_progress_percentage'] = round(progress_pct, 1)

async def get_new_level(cursor, total_xp: int) -> tuple[int, str]:
    await cursor.execute("SELECT rank_level, title, min_xp FROM ranks ORDER BY rank_level DESC LIMIT 1")
    max_rank = await cursor.fetchone()
    
    if not max_rank:
        return 1, "Novice"
        
    if total_xp >= max_rank['min_xp']:
        extra_xp = total_xp - max_rank['min_xp']
        prestige_level = extra_xp // 5000
        new_rank_level = max_rank['rank_level'] + prestige_level
        title = f"{max_rank['title']} +{prestige_level}" if prestige_level > 0 else max_rank['title']
        return new_rank_level, title
        
    await cursor.execute("SELECT rank_level, title FROM ranks WHERE min_xp <= %s ORDER BY rank_level DESC LIMIT 1", (total_xp,))
    res = await cursor.fetchone()
    return (res['rank_level'], res['title']) if res else (1, "Novice")
# --- End Gamification Logic ---

class LoginRequest(BaseModel):
    identifier: str = Field(..., description="Username, Mobile, or Roll Number")
    passkey: str = Field(..., min_length=4, max_length=4)

class SignupRequest(BaseModel):
    name: str
    nickName: str
    mobile: str
    gender: str = "Not Specified"
    curriculum_code: str
    grade: Optional[str] = None
    school: str = "Not Specified"
    parentName: str
    parentMobile: str
    parentEmail: Optional[str] = None
    passkey: str = Field(..., min_length=4, max_length=4)
    inviteCode: Optional[str] = None
    centerCode: Optional[str] = None # Added for Multi-Tenancy
    avatarSeed: Optional[str] = None
    vaultQuestion: Optional[str] = None
    vaultAnswer: Optional[str] = None

class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    nickName: Optional[str] = None
    mobile: Optional[str] = None
    avatarSeed: Optional[str] = None
    curriculum_code: Optional[str] = None
    grade: Optional[str] = None
    school: Optional[str] = None
    parentName: Optional[str] = None
    parentMobile: Optional[str] = None
    passkey: Optional[str] = Field(None, min_length=4, max_length=4)

class VerifyVaultRequest(BaseModel):
    mobile: str
    vaultAnswer: str

class ResetPasskeyRequest(BaseModel):
    mobile: str
    vaultAnswer: str
    newPasskey: str = Field(..., min_length=4, max_length=4)

def generate_roll_number(grade: Optional[str], curriculum_code: str, prefix: str = 'TT') -> str:
    unique_id = uuid.uuid4().hex[:6].upper()
    grade_str = str(grade).strip('- ') if grade else "ALL"
    curr_str = str(curriculum_code)[:4].upper().strip('- ') if curriculum_code else "GEN"
    pref_str = str(prefix).strip('- ') if prefix else "TT"
    
    parts = [p for p in [pref_str, curr_str, grade_str, unique_id] if p]
    return "-".join(parts)

@router.post("/verify-vault")
@limiter.limit("5/minute")
async def verify_vault(request: Request, payload: VerifyVaultRequest, conn: aiomysql.Connection = Depends(get_db)):
    async with conn.cursor(aiomysql.DictCursor) as cursor:
        await cursor.execute("SELECT vault_answer FROM users WHERE mobile = %s LIMIT 1", (payload.mobile,))
        user = await cursor.fetchone()
        
        if not user or not user.get('vault_answer'):
            raise HTTPException(status_code=400, detail="Secret Vault not set up for this account.")
            
        if user['vault_answer'].strip().lower() != payload.vaultAnswer.strip().lower():
            raise HTTPException(status_code=401, detail="Incorrect Secret Vault answer.")
            
        return {"success": True, "message": "Vault answer verified"}

@router.post("/reset-passkey")
@limiter.limit("5/minute")
async def reset_passkey(request: Request, payload: ResetPasskeyRequest, conn: aiomysql.Connection = Depends(get_db)):
    async with conn.cursor(aiomysql.DictCursor) as cursor:
        await cursor.execute("SELECT vault_answer FROM users WHERE mobile = %s LIMIT 1", (payload.mobile,))
        user = await cursor.fetchone()
        
        if not user or not user.get('vault_answer'):
            raise HTTPException(status_code=400, detail="Secret Vault not set up for this account.")
            
        if user['vault_answer'].strip().lower() != payload.vaultAnswer.strip().lower():
            raise HTTPException(status_code=401, detail="Incorrect Secret Vault answer. Unauthorized request.")
            
        hashed_passkey = get_passkey_hash(payload.newPasskey)
        
        await cursor.execute("UPDATE users SET passkey_hash = %s WHERE mobile = %s", (hashed_passkey, payload.mobile))
        await conn.commit()
        
        return {"success": True, "message": "Passkey reset successfully"}

@router.post("/lookup-profiles")
@limiter.limit("5/minute")
async def lookup_profiles(request: Request, payload: dict, conn: aiomysql.Connection = Depends(get_db)):
    mobile = payload.get("mobile")
    if not mobile:
        raise HTTPException(status_code=400, detail="Mobile number is required.")
        
    async with conn.cursor(aiomysql.DictCursor) as cursor:
        await cursor.execute("SELECT id, username, avatar_seed FROM users WHERE mobile = %s", (mobile,))
        profiles = await cursor.fetchall()
        return {"profiles": profiles}

@router.post("/login")
@limiter.limit("10/minute")
async def login(request: Request, payload: LoginRequest, conn: aiomysql.Connection = Depends(get_db)):
    async with conn.cursor(aiomysql.DictCursor) as cursor:
        query = "SELECT * FROM users WHERE id = %s OR LOWER(username) = LOWER(%s) OR LOWER(roll_number) = LOWER(%s) LIMIT 1"
        await cursor.execute(query, (payload.identifier, payload.identifier, payload.identifier))
        user = await cursor.fetchone()

        if not user:
            logger.warning(f"Login failed: User not found for identifier: {payload.identifier}")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials.")

        hash_val = user.get('passkey_hash', 'None')

        if hash_val is None or not verify_passkey(payload.passkey, hash_val):
            logger.warning(f"Passkey verification failed for identifier: {payload.identifier}")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials.")

        access_token = create_access_token(data={"sub": str(user['id'])})
        user.pop('passkey_hash', None)
        return {"access_token": access_token, "token_type": "bearer", "user": user}

@router.post("/signup")
@limiter.limit("5/minute")
async def signup(request: Request, payload: SignupRequest, conn: aiomysql.Connection = Depends(get_db)):
    async with conn.cursor(aiomysql.DictCursor) as cursor:
        await cursor.execute("SELECT id FROM users WHERE LOWER(username) = LOWER(%s)", (payload.nickName,))
        if await cursor.fetchone():
            raise HTTPException(status_code=400, detail="Username is already taken.")

        code_to_check = payload.centerCode or payload.inviteCode
        partner_id = None
        referred_by_user_id = None
        roll_prefix = 'TT'

        if code_to_check:
            await cursor.execute("SELECT id, roll_number_prefix FROM partners WHERE referral_code = %s", (code_to_check,))
            partner = await cursor.fetchone()
            
            if partner:
                partner_id = partner['id']
                roll_prefix = partner['roll_number_prefix'] or 'TT'
            else:
                await cursor.execute("SELECT id FROM users WHERE referral_code = %s", (code_to_check,))
                referring_user = await cursor.fetchone()
                if referring_user:
                    referred_by_user_id = referring_user['id']
                else:
                    raise HTTPException(status_code=400, detail="Invalid Center/Referral Code provided.")
        else:
            await cursor.execute("SELECT id, roll_number_prefix FROM partners WHERE referral_code = 'SCHOLLYGO'")
            partner = await cursor.fetchone()
            if partner:
                partner_id = partner['id']
                roll_prefix = partner['roll_number_prefix'] or 'TT'

        user_id = str(uuid.uuid4())
        roll_number = generate_roll_number(payload.grade, payload.curriculum_code, roll_prefix)
        hashed_passkey = get_passkey_hash(payload.passkey)
        starting_xp = 50 if payload.inviteCode else 0
        default_avatar = payload.avatarSeed or f"https://api.dicebear.com/9.x/fun-emoji/svg?seed={payload.nickName}"
        user_referral_code = f"{payload.nickName[:4].upper()}{''.join(random.choices(string.ascii_uppercase + string.digits, k=6))}"

        insert_query = """
            INSERT INTO users (
                id, username, roll_number, mobile, passkey_hash, 
                full_name, gender, avatar_seed, curriculum_code, grade, school_name, 
                parent_name, parent_mobile, parent_email, total_xp, partner_id, referral_code, referred_by_user_id,
                vault_question, vault_answer
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        try:
            await conn.begin()
            await cursor.execute(insert_query, (
                user_id, payload.nickName, roll_number, payload.mobile, hashed_passkey,
                payload.name, payload.gender, default_avatar, payload.curriculum_code, payload.grade, payload.school,
                payload.parentName, payload.parentMobile, payload.parentEmail, starting_xp, partner_id, user_referral_code, referred_by_user_id,
                payload.vaultQuestion, payload.vaultAnswer
            ))
            
            # --- Audit Trail Fix: Ensure startup XP is logged so it triggers updates reliably ---
            if starting_xp > 0:
                xp_log_query = "INSERT INTO xp_logs (user_id, amount, source_type, source_reference_table, source_id) VALUES (%s, %s, 'invite_bonus', NULL, NULL)"
                await cursor.execute(xp_log_query, (user_id, starting_xp))
                
            if referred_by_user_id:
                # Reward the referrer with 250 XP
                ref_xp_query = "INSERT INTO xp_logs (user_id, amount, source_type, source_reference_table, source_id) VALUES (%s, %s, 'invite_bonus', NULL, NULL)"
                await cursor.execute(ref_xp_query, (referred_by_user_id, 250))
                await cursor.execute("UPDATE users SET total_xp = total_xp + 250 WHERE id = %s", (referred_by_user_id,))

            await conn.commit()
        except Exception as e:
            await conn.rollback()
            print(f"Error during signup: {e}")
            raise HTTPException(status_code=500, detail=f"Database error during account creation: {e}")

        return {"message": "Account created successfully", "student_id": user_id, "roll_number": roll_number}

@router.get("/check-username")
async def check_username(username: str = Query(..., min_length=3), conn: aiomysql.Connection = Depends(get_db)):
    """Validates if a requested username is available during signup. Provides suggestions if taken."""
    try:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            await cursor.execute("SELECT id FROM users WHERE LOWER(username) = LOWER(%s) LIMIT 1", (username,))
            user = await cursor.fetchone()
            if user is None:
                return {"available": True}
            
            suggestions = []
            suffixes = ["123", "_pro", "99", "_student", "01", "7"]
            for suffix in suffixes:
                sug = f"{username}{suffix}"
                await cursor.execute("SELECT id FROM users WHERE LOWER(username) = LOWER(%s) LIMIT 1", (sug,))
                if not await cursor.fetchone():
                    suggestions.append(sug)
                if len(suggestions) >= 3:
                    break
                    
            return {"available": False, "suggestions": suggestions}
    except Exception as e:
        print(f"Error in check-username: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/check-mobile")
async def check_mobile(mobile: str = Query(..., min_length=10, max_length=10), conn: aiomysql.Connection = Depends(get_db)):
    """Validates if a mobile number is already registered."""
    try:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            await cursor.execute("SELECT id FROM users WHERE mobile = %s LIMIT 1", (mobile,))
            user = await cursor.fetchone()
            return {"available": user is None}
    except Exception as e:
        print(f"Error in check-mobile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/check-invite-code")
async def check_invite_code(code: str = Query(..., min_length=3), conn: aiomysql.Connection = Depends(get_db)):
    """Validates if an invite code or center code is valid."""
    try:
        async with conn.cursor(aiomysql.DictCursor) as cursor:
            # Check partners first
            await cursor.execute("SELECT id FROM partners WHERE referral_code = %s LIMIT 1", (code,))
            partner = await cursor.fetchone()
            if partner:
                return {"valid": True, "type": "partner"}
            
            # Check users
            await cursor.execute("SELECT id FROM users WHERE referral_code = %s LIMIT 1", (code,))
            user = await cursor.fetchone()
            if user:
                return {"valid": True, "type": "user"}
                
            return {"valid": False}
    except Exception as e:
        print(f"Error in check-invite-code: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/me")
async def get_me(user_id: str = Depends(get_current_user), conn: aiomysql.Connection = Depends(get_db)):
    """Returns the current authenticatd user profile."""
    return await get_profile(user_id, conn)

@router.get("/profile/{user_id}")
async def get_profile(user_id: str, conn: aiomysql.Connection = Depends(get_db)):
    """Returns the user profile along with computed dynamic gamification statistics."""
    async with conn.cursor(aiomysql.DictCursor) as cursor:
        await cursor.execute("""
            SELECT u.*, c.name as curriculum_name 
            FROM users u 
            LEFT JOIN curriculums c ON u.curriculum_code = c.code 
            WHERE u.id = %s
        """, (user_id,))
        user = await cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found.")
        
        user.pop('passkey_hash', None)
        
        # Auto-sync total_xp just in case there's a desync from missing records
        await cursor.execute("SELECT COALESCE(SUM(amount), 0) as real_xp FROM xp_logs WHERE user_id = %s", (user_id,))
        real_xp_row = await cursor.fetchone()
        real_xp = int(real_xp_row['real_xp'])
        
        if real_xp != user.get('total_xp'):
            user['total_xp'] = real_xp
            await cursor.execute("UPDATE users SET total_xp = %s WHERE id = %s", (real_xp, user_id))
            await conn.commit()
            
        # Strict Streak Enforcement on Profile Load
        from datetime import date, timedelta
        last_date = user.get('last_streak_date')
        today = date.today()
        if last_date and last_date < today - timedelta(days=1):
            days_missed = (today - last_date).days - 1
            freezes = user.get('streak_freezes', 0)
            if freezes < days_missed:
                # Streak is broken because they missed too many days without freezes
                user['current_streak'] = 0
                await cursor.execute("UPDATE users SET current_streak = 0 WHERE id = %s", (user_id,))
                await conn.commit()
        
        # Hydrate dynamic gamification data in-place
        await set_user_rank_details(cursor, user)

        return user

@router.put("/profile/{user_id}")
async def update_profile(user_id: str, payload: ProfileUpdateRequest, conn: aiomysql.Connection = Depends(get_db)):
    async with conn.cursor(aiomysql.DictCursor) as cursor:
        updates, values = [], []
        
        if payload.name is not None:
            updates.append("full_name = %s")
            values.append(payload.name)
        if payload.nickName is not None:
            updates.append("username = %s")
            values.append(payload.nickName)
        if payload.mobile is not None:
            updates.append("mobile = %s")
            values.append(payload.mobile)
        if payload.avatarSeed is not None:
            updates.append("avatar_seed = %s")
            values.append(payload.avatarSeed)
        if payload.curriculum_code is not None:
            updates.append("curriculum_code = %s")
            values.append(payload.curriculum_code)
        if payload.grade is not None:
            updates.append("grade = %s")
            values.append(payload.grade)
        if payload.school is not None:
            updates.append("school_name = %s")
            values.append(payload.school)
        if payload.parentName is not None:
            updates.append("parent_name = %s")
            values.append(payload.parentName)
        if payload.parentMobile is not None:
            updates.append("parent_mobile = %s")
            values.append(payload.parentMobile)
        if payload.passkey is not None:
            updates.append("passkey_hash = %s")
            values.append(get_passkey_hash(payload.passkey))
        
        if not updates: 
            return {"message": "No fields to update"}
            
        query = f"UPDATE users SET {', '.join(updates)} WHERE id = %s"
        values.append(user_id)
        
        try:
            await cursor.execute(query, tuple(values))
            await conn.commit()
            
            await cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
            updated_user = await cursor.fetchone()
            updated_user.pop('passkey_hash', None)
            
            return {"message": "Profile updated successfully", "user": updated_user}
            
        except Exception as e:
            await conn.rollback()
            raise HTTPException(status_code=500, detail=f"Error updating profile: {str(e)}")
