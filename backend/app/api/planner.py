import json
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import Assignment, Material, StudyGuide, WeeklyPlan, Course
from app.schemas.schemas import StudyGuideResponse, WeeklyPlanResponse
from app.services.ai_service import generate_study_guide, generate_weekly_plan

router = APIRouter(prefix="/api", tags=["planner"])


# ── Weekly Plan ─────────────────────────────────────────

@router.get("/plan/weekly", response_model=WeeklyPlanResponse)
def get_weekly_plan(db: Session = Depends(get_db)):
    """Get the most recent weekly plan."""
    plan = db.query(WeeklyPlan).order_by(WeeklyPlan.created_at.desc()).first()
    if not plan:
        raise HTTPException(status_code=404, detail="No weekly plan generated yet.")
    return WeeklyPlanResponse(
        id=plan.id,
        week_start=plan.week_start,
        plan_json=plan.plan_json,
        created_at=plan.created_at,
    )


@router.post("/plan/weekly/generate", response_model=WeeklyPlanResponse)
def generate_plan(db: Session = Depends(get_db)):
    """Generate a new weekly plan from all upcoming assignments."""
    today = datetime.utcnow()
    cutoff = today + timedelta(days=21)  # Look 3 weeks ahead

    assignments = (
        db.query(Assignment)
        .filter(Assignment.due_date != None, Assignment.due_date <= cutoff)
        .filter(Assignment.status != "done")
        .order_by(Assignment.due_date.asc())
        .all()
    )

    if not assignments:
        raise HTTPException(status_code=400, detail="No upcoming assignments to plan around.")

    assignments_data = []
    for a in assignments:
        course = db.query(Course).filter(Course.id == a.course_id).first()
        assignments_data.append({
            "title": a.title,
            "course_code": course.code if course else "Unknown",
            "due_date": a.due_date.isoformat() if a.due_date else None,
            "weight": a.weight,
            "status": a.status.value,
            "step_count": len(a.steps),
            "steps_done": sum(1 for s in a.steps if s.is_done),
        })

    # Monday of current week
    week_start = today - timedelta(days=today.weekday())

    result = generate_weekly_plan(assignments_data, week_start.strftime("%Y-%m-%d"))

    plan = WeeklyPlan(
        week_start=week_start,
        plan_json=json.dumps(result),
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)

    return WeeklyPlanResponse(
        id=plan.id,
        week_start=plan.week_start,
        plan_json=plan.plan_json,
        created_at=plan.created_at,
    )


# ── Study Guides ────────────────────────────────────────

@router.get("/courses/{course_id}/study-guides", response_model=list[StudyGuideResponse])
def list_study_guides(course_id: int, db: Session = Depends(get_db)):
    guides = db.query(StudyGuide).filter(StudyGuide.course_id == course_id).all()
    return [
        StudyGuideResponse(
            id=g.id,
            course_id=g.course_id,
            title=g.title,
            content=g.content,
            topics_covered=g.topics_covered,
            created_at=g.created_at,
        )
        for g in guides
    ]


@router.post("/courses/{course_id}/study-guide")
def create_study_guide(
    course_id: int,
    exam_title: str = "Midterm",
    material_ids: str = "",
    db: Session = Depends(get_db),
):
    """Generate an AI study guide. Optionally filter by material IDs (comma-separated)."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Filter materials if IDs provided
    if material_ids:
        ids = [int(x.strip()) for x in material_ids.split(",") if x.strip().isdigit()]
        materials = db.query(Material).filter(Material.id.in_(ids), Material.course_id == course_id).all()
    else:
        materials = db.query(Material).filter(Material.course_id == course_id).all()

    if not materials:
        raise HTTPException(status_code=400, detail="No materials selected.")

    combined_text = "\n\n".join(
        f"[{m.material_type.value}: {m.filename}]\n{m.extracted_text}"
        for m in materials
        if m.extracted_text
    )

    result = generate_study_guide(course.name, exam_title, combined_text)

    guide = StudyGuide(
        course_id=course_id,
        title=result.get("title", f"Study Guide: {exam_title}"),
        content=result.get("content", ""),
        topics_covered=json.dumps(result.get("topics", [])),
    )
    db.add(guide)
    db.commit()
    db.refresh(guide)

    return StudyGuideResponse(
        id=guide.id,
        course_id=guide.course_id,
        title=guide.title,
        content=guide.content,
        topics_covered=guide.topics_covered,
        created_at=guide.created_at,
    )
