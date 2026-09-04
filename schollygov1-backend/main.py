from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from core.database import db_instance
from core.limiter import limiter
from routers import auth, curriculum, quiz, notices, partners, batches, teachers, students
from routers import admin

load_dotenv()

# Setup connection pool lifecycle
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create DB Pool
    await db_instance.connect()
    
    yield
    # Shutdown: Close DB Pool
    await db_instance.disconnect()

app = FastAPI(
    title="Topper's Tribe API", 
    description="Backend API using FastAPI and raw MySQL queries",
    lifespan=lifespan
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "")
if not allowed_origins_str:
    logger.warning("ALLOWED_ORIGINS is not set. No external origins will be allowed.")
    allowed_origins = []
elif allowed_origins_str == "*":
    logger.warning("ALLOWED_ORIGINS is set to '*'. This is insecure for production.")
    allowed_origins = ["*"]
else:
    allowed_origins = [origin.strip() for origin in allowed_origins_str.split(",") if origin.strip()]

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=(allowed_origins != ["*"]),
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(curriculum.router)
app.include_router(quiz.router)
app.include_router(notices.router)
app.include_router(partners.router)
app.include_router(batches.router)
app.include_router(teachers.router)
app.include_router(students.router)
app.include_router(admin.router)

@app.get("/")
def read_root():
    return {"message": "Jumpgrades API is running!"}


