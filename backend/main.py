from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import init_db
from app.api import courses, assignments, planner

app = FastAPI(
    title="Campus OS",
    description="AI-native academic operating system",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(courses.router)
app.include_router(assignments.router)
app.include_router(planner.router)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/")
def root():
    return {"name": "Campus OS", "version": "0.1.0", "status": "running"}


@app.get("/health")
def health():
    return {"status": "ok"}
