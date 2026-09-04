from fastapi import APIRouter, Depends, HTTPException, Header
import aiomysql
from typing import Optional
from core.database import get_db
from core.security import get_current_user

router = APIRouter(prefix="/api/v2/notices", tags=["Notices"])

@router.get("/active")
async def get_active_notice(
    x_local_hour: Optional[int] = Header(None),
    user_id: str = Depends(get_current_user),
    conn: aiomysql.Connection = Depends(get_db)
):
    """
    Fetches the single most recent active notice for the authenticated user.
    Dynamically checks for Streak Saver condition if local hour is >= 18 (6:00 PM).
    """
    
    async with conn.cursor(aiomysql.DictCursor) as cursor:
        # 1. Live Evaluation for "The Streak Saver"
        if x_local_hour is not None and x_local_hour >= 18:
            # Check for activity today
            await cursor.execute("""
                SELECT COUNT(*) as activity_count 
                FROM xp_logs 
                WHERE user_id = %s AND DATE(created_at) = CURDATE()
            """, (user_id,))
            activity = await cursor.fetchone()
            if activity and activity['activity_count'] == 0:
                return {
                    "id": "streak-saver-dynamic",
                    "notice_type": "RECOMMENDATION",
                    "message": "Streak Risk! Complete at least one Warm-up topic today to keep your streak alive.",
                    "action_cta": "PLAY WARM-UP",
                    "action_url": "learning",
                    "icon": "🔥"
                }

        # 2. Fetch from user_notices table
        await cursor.execute("""
            SELECT id, notice_type, message, action_cta, action_url, created_at
            FROM user_notices
            WHERE user_id = %s AND is_dismissed = FALSE
            ORDER BY created_at DESC
            LIMIT 1
        """, (user_id,))
        notice = await cursor.fetchone()
        
        if notice:
            # Map icons based on type
            icon_map = {
                "WARNING": "⚠️",
                "RECOMMENDATION": "🧠",
                "SYSTEM": "🚀",
                "MILESTONE": "🏆"
            }
            notice["icon"] = icon_map.get(notice["notice_type"], "ℹ️")
            return notice
            
        return None

@router.post("/{notice_id}/dismiss")
async def dismiss_notice(
    notice_id: str,
    user_id: str = Depends(get_current_user),
    conn: aiomysql.Connection = Depends(get_db)
):
    """
    Dismisses a notice so it no longer appears for the user.
    """
    if notice_id == "streak-saver-dynamic":
        return {"status": "success", "message": "Dynamic notice dismissed for session."}
        
    async with conn.cursor() as cursor:
        await cursor.execute("""
            UPDATE user_notices 
            SET is_dismissed = TRUE 
            WHERE id = %s AND user_id = %s
        """, (notice_id, user_id))
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Notice not found or already dismissed.")
            
    return {"status": "success"}
