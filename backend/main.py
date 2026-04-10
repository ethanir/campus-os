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
    # Auto-migrate: add columns if missing
    from app.core.database import engine
    import sqlalchemy
    migrations = [
        "ALTER TABLE assignments ADD COLUMN context_notes TEXT DEFAULT ''",
        "ALTER TABLE materials ADD COLUMN page_images_dir TEXT DEFAULT ''",
        "ALTER TABLE materials ADD COLUMN image_description TEXT DEFAULT ''",
        "UPDATE materials SET material_type = 'completed_work' WHERE material_type = 'assignment'",
    ]
    try:
        with engine.connect() as conn:
            for sql in migrations:
                try:
                    conn.execute(sqlalchemy.text(sql))
                except Exception:
                    pass  # Column already exists or migration already applied
            conn.commit()
    except Exception:
        pass


@app.get("/")
def root():
    return {"name": "YourCourse AI", "version": "1.0.0", "status": "running"}
