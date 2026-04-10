import shutil
from pathlib import Path

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.auth import get_current_user, require_credits, deduct_credits
from app.models.models import Course, Material, MaterialType, User
from app.schemas.schemas import CourseCreate, CourseResponse, MaterialResponse
from app.services.file_extraction import extract_text
from app.services.ai_service import parse_syllabus, parse_schedule_screenshot

router = APIRouter(prefix="/api/courses", tags=["courses"])


@router.get("", response_model=list[CourseResponse])
def list_courses(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    courses = db.query(Course).filter(Course.user_id == user.id).all()
    return [_course_response(c) for c in courses]


@router.post("", response_model=CourseResponse)
def create_course(data: CourseCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    course = Course(user_id=user.id, **data.model_dump())
    db.add(course)
    db.commit()
    db.refresh(course)
    return _course_response(course)


# ── Screenshot Import (MUST be before /{course_id}) ─────

@router.post("/import-screenshot")
async def import_from_screenshot(
    file: UploadFile = File(...),
    user: User = Depends(require_credits(1)),
    db: Session = Depends(get_db),
):
    contents = await file.read()
    ext = file.filename.lower().rsplit(".", 1)[-1] if file.filename else "png"
    media_map = {"png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg", "webp": "image/webp"}
    media_type = media_map.get(ext, "image/png")

    premium = user.has_purchased
    result = parse_schedule_screenshot(contents, media_type, premium=premium)

    # SUCCESS — now deduct
    deduct_credits(user, db)

    created = []
    skipped = []
    colors = ["#E8FF5A", "#5AF0FF", "#FF5A8A", "#5AFF8C", "#C49AFF", "#FFA35A"]
    for c in result.get("courses", []):
        code = c.get("code", "").strip()
        name = c.get("name", "").strip()
        if not code:
            continue
        existing = db.query(Course).filter(Course.code == code, Course.user_id == user.id).first()
        if existing:
            skipped.append(code)
            continue
        course = Course(
            user_id=user.id, code=code, name=name,
            professor=c.get("professor", ""),
            semester=result.get("semester", "Spring 2026"),
            color=colors[len(created) % len(colors)],
        )
        db.add(course)
        db.commit()
        db.refresh(course)
        created.append({"id": course.id, "code": course.code, "name": course.name, "professor": course.professor})

    return {"created": created, "skipped": skipped, "total_detected": len(result.get("courses", []))}


@router.get("/{course_id}", response_model=CourseResponse)
def get_course(course_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id, Course.user_id == user.id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return _course_response(course)


@router.delete("/{course_id}")
def delete_course(course_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id, Course.user_id == user.id).first()
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
    description: str = Form(""),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    course = db.query(Course).filter(Course.id == course_id, Course.user_id == user.id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    course_dir = settings.upload_path / str(user.id) / str(course_id)
    course_dir.mkdir(parents=True, exist_ok=True)
    file_path = course_dir / file.filename
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Reference images: store image file, no text extraction
    if material_type == "reference_image":
        mat = Material(
            course_id=course_id,
            filename=file.filename,
            file_path=str(file_path),
            material_type=MaterialType.REFERENCE_IMAGE,
            extracted_text="",
            image_description=description.strip(),
        )
    else:
        extracted = extract_text(str(file_path))
    
    # Check if adding this material would exceed context limit
    from app.services.ai_service import MAX_CONTEXT_CHARS, MAX_CONTEXT_CHARS_FREE
    max_chars = MAX_CONTEXT_CHARS if user.has_purchased else MAX_CONTEXT_CHARS_FREE
    existing_chars = sum(len(m.extracted_text or "") for m in course.materials)
    if existing_chars + len(extracted) > max_chars:
        import os; os.remove(str(file_path))
        raise HTTPException(
            status_code=400,
            detail=f"Adding this file would exceed your context limit ({max_chars:,} chars). Remove some materials first or upload a shorter file."
        )
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
    return _material_response(mat)


@router.get("/{course_id}/materials", response_model=list[MaterialResponse])
def list_materials(course_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id, Course.user_id == user.id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    mats = db.query(Material).filter(Material.course_id == course_id).all()
    return [_material_response(m) for m in mats]


@router.delete("/{course_id}/materials/{material_id}")
def delete_material(course_id: int, material_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id, Course.user_id == user.id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    mat = db.query(Material).filter(Material.id == material_id, Material.course_id == course_id).first()
    if not mat:
        raise HTTPException(status_code=404, detail="Material not found")
    db.delete(mat)
    db.commit()
    return {"ok": True}


# ── Syllabus Parsing ────────────────────────────────────

@router.post("/{course_id}/parse-syllabus")
def parse_course_syllabus(course_id: int, user: User = Depends(require_credits(1)), db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id, Course.user_id == user.id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    syllabus = db.query(Material).filter(Material.course_id == course_id, Material.material_type == MaterialType.SYLLABUS).first()
    if not syllabus or not syllabus.extracted_text:
        raise HTTPException(status_code=404, detail="No syllabus found")
    result = parse_syllabus(syllabus.extracted_text, course.name, premium=user.has_purchased)
    deduct_credits(user, db)
    return result


def _course_response(c: Course) -> CourseResponse:
    return CourseResponse(
        id=c.id, name=c.name, code=c.code, professor=c.professor,
        semester=c.semester, color=c.color, created_at=c.created_at,
        material_count=len(c.materials), assignment_count=len(c.assignments),
    )


def _material_response(m: Material) -> MaterialResponse:
    return MaterialResponse(
        id=m.id, course_id=m.course_id, filename=m.filename,
        material_type=m.material_type.value,
        image_description=getattr(m, 'image_description', '') or '',
        uploaded_at=m.uploaded_at,
    )


# ── Context Usage ───────────────────────────────────────

@router.get("/{course_id}/context-usage")
def get_context_usage(course_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id, Course.user_id == user.id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    from app.models.models import Assignment
    mats = db.query(Material).filter(Material.course_id == course_id).all()
    assignments = db.query(Assignment).filter(Assignment.course_id == course_id).all()
    mat_chars = sum(len(m.extracted_text or "") for m in mats)
    assign_chars = sum(len(a.description or "") for a in assignments)
    total_chars = mat_chars + assign_chars
    max_chars = 150000 if user.has_purchased else 50000
    return {
        "used_chars": total_chars,
        "max_chars": max_chars,
        "used_pct": round((min(total_chars, max_chars) / max_chars) * 100, 1),
        "tier": "premium" if user.has_purchased else "free",
        "materials": [{"id": m.id, "filename": m.filename, "chars": len(m.extracted_text or "")} for m in mats],
    }
