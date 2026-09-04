from fastapi import APIRouter, Depends, HTTPException
import aiomysql
from datetime import datetime, timedelta

from core.database import get_db

router = APIRouter(prefix="/admin", tags=["Admin"])

