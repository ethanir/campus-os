import shutil
from pathlib import Path

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.models import Course, Material, MaterialType
from app.schemas.schemas import CourseCreate, CourseResponse, MaterialResponse
from app.services.file_extraction import extract_text
from app.services.ai_service import parse_syllabus
from app.services.ai_service import parse_schedule_screenshot

router = APIRouter(prefix="/api/courses", tags=["courses"])


@router.get("", response_model=list[CourseResponse])
def list_courses(db: Session = Depends(get_db)):
    courses = db.query(Course).all()
    result = []
    for c in courses:
        result.append(CourseResponse(
            id=c.id,
            name=c.name,
            code=c.code,
            professor=c.professor,
            semester=c.semester,
            color=c.color,
            created_at=c.created_at,
            material_count=len(c.materials),
            assignment_count=len(c.assignments),
        ))
    return result


@router.post("", response_model=CourseResponse)
def create_course(data: CourseCreate, db: Session = Depends(get_db)):
    course = Course(**data.model_dump())
    db.add(course)
    db.commit()
    db.refresh(course)
    return CourseResponse(
        id=course.id,
        name=course.name,
        code=course.code,
        professor=course.professor,
        semester=course.semester,
        color=course.color,
        created_at=course.created_at,
    )


# ── Schedule Screenshot Import ──────────────────────────

@router.post("/import-screenshot")
async def import_from_screenshot(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Upload a screenshot of a course schedule and AI-extract courses from it."""
    contents = await file.read()

    ext = file.filename.lower().rsplit(".", 1)[-1] if file.filename else "png"
    media_map = {"png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg", "webp": "image/webp"}
    media_type = media_map.get(ext, "image/png")

    result = parse_schedule_screenshot(contents, media_type)

    created = []
    skipped = []
    for c in result.get("courses", []):
        code = c.get("code", "").strip()
        name = c.get("name", "").strip()
        if not code:
            continue

        existing = db.query(Course).filter(Course.code == code).first()
        if existing:
            skipped.append(code)
            continue

        colors = ["#E8FF5A", "#5AF0FF", "#FF5A8A", "#5AFF8C", "#C49AFF", "#FFA35A"]
        color = colors[len(created) % len(colors)]

        course = Course(
            code=code,
            name=name,
            professor=c.get("professor", ""),
            semester=result.get("semester", "Spring 2026"),
            color=color,
        )
        db.add(course)
        db.commit()
        db.refresh(course)
        created.append({
            "id": course.id,
            "code": course.code,
            "name": course.name,
            "professor": course.professor,
            "notes": c.get("notes", ""),
        })

    return {
        "created": created,
        "skipped": skipped,
        "total_detected": len(result.get("courses", [])),
    }


@router.get("/{course_id}", response_model=CourseResponse)
def get_course(course_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return CourseResponse(
        id=course.id,
        name=course.name,
        code=course.code,
        professor=course.professor,
        semester=course.semester,
        color=course.color,
        created_at=course.created_at,
        material_count=len(course.materials),
        assignment_count=len(course.assignments),
    )


@router.delete("/{course_id}")
def delete_course(course_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    db.delete(course)
    db.commit()
    return {"ok": True}


# ── File Upload ─────────────────────────────────────────

@router.post("/{course_id}/upload", response_model=MaterialResponse)
async def upload_material(
    course_id: int,
    file: UploadFile = File(...),
    material_type: str = Form("other"),
    db: Session = Depends(get_db),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Save file to disk
    course_dir = settings.upload_path / str(course_id)
    course_dir.mkdir(parents=True, exist_ok=True)
    file_path = course_dir / file.filename

    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Extract text
    extracted = extract_text(str(file_path))

    # Save to DB
    mat = Material(
        course_id=course_id,
        filename=file.filename,
        file_path=str(file_path),
        material_type=MaterialType(material_type),
        extracted_text=extracted,
    )
    db.add(mat)
    db.commit()
    db.refresh(mat)

    return MaterialResponse(
        id=mat.id,
        course_id=mat.course_id,
        filename=mat.filename,
        material_type=mat.material_type.value,
        uploaded_at=mat.uploaded_at,
    )


@router.get("/{course_id}/materials", response_model=list[MaterialResponse])
def list_materials(course_id: int, db: Session = Depends(get_db)):
    mats = db.query(Material).filter(Material.course_id == course_id).all()
    return [
        MaterialResponse(
            id=m.id,
            course_id=m.course_id,
            filename=m.filename,
            material_type=m.material_type.value,
            uploaded_at=m.uploaded_at,
        )
        for m in mats
    ]


# ── Syllabus Parsing ───────────────────────────────────

@router.post("/{course_id}/parse-syllabus")
def parse_course_syllabus(course_id: int, db: Session = Depends(get_db)):
    """Find the syllabus material for this course and AI-parse it into assignments."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    syllabus = (
        db.query(Material)
        .filter(Material.course_id == course_id, Material.material_type == MaterialType.SYLLABUS)
        .first()
    )
    if not syllabus:
        raise HTTPException(status_code=404, detail="No syllabus uploaded for this course. Upload one first.")

    if not syllabus.extracted_text:
        raise HTTPException(status_code=400, detail="Syllabus text extraction failed. Try re-uploading.")

    result = parse_syllabus(syllabus.extracted_text, course.name)
    return result
