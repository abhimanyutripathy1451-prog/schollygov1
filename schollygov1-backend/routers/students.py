from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
import aiomysql
import csv
import io
import re
from core.database import get_db

router = APIRouter(prefix="/api/students", tags=["Students"])

