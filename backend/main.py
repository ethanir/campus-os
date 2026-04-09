import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import init_db
from app.api import auth, courses, assignments, planner

app = FastAPI(
    title="YourCourse AI",
    description="AI-powered academic assistant",
    version="1.0.0",
)

# CORS — allow frontend origin from env, plus localhost for dev
frontend_url = os.getenv("FRONTEND_URL", "https://yourcourseai.com")
allowed_origins = [
    frontend_url,
    "https://www.yourcourseai.com",
    "http://localhost:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(courses.router)
app.include_router(assignments.router)
app.include_router(planner.router)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/")
def root():
    return {"name": "YourCourse AI", "version": "1.0.0", "status": "running"}
