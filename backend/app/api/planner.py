import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth import get_current_user, require_credits
from app.models.models import Material, StudyGuide, Course, User
from app.schemas.schemas import StudyGuideResponse
from app.services.ai_service import generate_study_guide

router = APIRouter(prefix="/api", tags=["planner"])


@router.get("/courses/{course_id}/study-guides", response_model=list[StudyGuideResponse])
def list_study_guides(course_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id, Course.user_id == user.id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    guides = db.query(StudyGuide).filter(StudyGuide.course_id == course_id).all()
    return [StudyGuideResponse(id=g.id, course_id=g.course_id, title=g.title, content=g.content, topics_covered=g.topics_covered, created_at=g.created_at) for g in guides]


@router.post("/courses/{course_id}/study-guide")
def create_study_guide(
    course_id: int,
    exam_title: str = "Midterm",
    material_ids: str = "",
    user: User = Depends(require_credits(1)),
    db: Session = Depends(get_db),
):
    course = db.query(Course).filter(Course.id == course_id, Course.user_id == user.id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if material_ids:
        ids = [int(x.strip()) for x in material_ids.split(",") if x.strip().isdigit()]
        materials = db.query(Material).filter(Material.id.in_(ids), Material.course_id == course_id).all()
    else:
        materials = db.query(Material).filter(Material.course_id == course_id).all()

    if not materials:
        raise HTTPException(status_code=400, detail="No materials selected.")

    combined_text = "\n\n".join(f"[{m.material_type.value}: {m.filename}]\n{m.extracted_text}" for m in materials if m.extracted_text)
    premium = user.has_purchased
    result = generate_study_guide(course.name, exam_title, combined_text, premium=premium)

    guide = StudyGuide(course_id=course_id, title=result.get("title", f"Study Guide: {exam_title}"), content=result.get("content", ""), topics_covered=json.dumps(result.get("topics", [])))
    db.add(guide)
    db.commit()
    db.refresh(guide)

    return StudyGuideResponse(id=guide.id, course_id=guide.course_id, title=guide.title, content=guide.content, topics_covered=guide.topics_covered, created_at=guide.created_at)
