from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import Assignment, TaskStep, Course, Material, AssignmentStatus
from app.schemas.schemas import (
    AssignmentCreate,
    AssignmentResponse,
    TaskStepResponse,
    TaskStepToggle,
)
from app.services.ai_service import generate_task_steps, generate_draft, generate_homework_turnin, generate_homework_study

router = APIRouter(prefix="/api", tags=["assignments"])


# ── Assignments CRUD ────────────────────────────────────

@router.get("/courses/{course_id}/assignments", response_model=list[AssignmentResponse])
def list_assignments(course_id: int, db: Session = Depends(get_db)):
    assignments = (
        db.query(Assignment)
        .filter(Assignment.course_id == course_id)
        .order_by(Assignment.due_date.asc())
        .all()
    )
    return [_assignment_response(a) for a in assignments]


@router.post("/courses/{course_id}/assignments", response_model=AssignmentResponse)
def create_assignment(course_id: int, data: AssignmentCreate, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    assignment = Assignment(course_id=course_id, **data.model_dump())
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return _assignment_response(assignment)


@router.patch("/assignments/{assignment_id}/status")
def update_assignment_status(assignment_id: int, status: str, db: Session = Depends(get_db)):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    assignment.status = AssignmentStatus(status)
    db.commit()
    return {"ok": True}


# ── Task Steps ──────────────────────────────────────────

@router.get("/assignments/{assignment_id}/steps", response_model=list[TaskStepResponse])
def list_steps(assignment_id: int, db: Session = Depends(get_db)):
    steps = (
        db.query(TaskStep)
        .filter(TaskStep.assignment_id == assignment_id)
        .order_by(TaskStep.order)
        .all()
    )
    return [
        TaskStepResponse(
            id=s.id, order=s.order, text=s.text,
            is_done=s.is_done, estimated_minutes=s.estimated_minutes,
        )
        for s in steps
    ]


@router.post("/assignments/{assignment_id}/generate-steps")
def generate_steps(assignment_id: int, db: Session = Depends(get_db)):
    """Use AI to generate actionable task steps for an assignment."""
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # Gather course materials for context
    materials = db.query(Material).filter(Material.course_id == assignment.course_id).all()
    context = "\n\n".join(
        f"[{m.material_type.value}: {m.filename}]\n{m.extracted_text[:3000]}"
        for m in materials
        if m.extracted_text
    )

    result = generate_task_steps(assignment.title, assignment.description, context)

    # Delete existing steps and create new ones
    db.query(TaskStep).filter(TaskStep.assignment_id == assignment_id).delete()
    for i, step_data in enumerate(result.get("steps", [])):
        step = TaskStep(
            assignment_id=assignment_id,
            order=i + 1,
            text=step_data["text"],
            estimated_minutes=step_data.get("estimated_minutes", 30),
        )
        db.add(step)

    db.commit()
    return result


@router.patch("/steps/{step_id}")
def toggle_step(step_id: int, data: TaskStepToggle, db: Session = Depends(get_db)):
    step = db.query(TaskStep).filter(TaskStep.id == step_id).first()
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")
    step.is_done = data.is_done
    db.commit()
    return {"ok": True, "is_done": step.is_done}


# ── Draft Generation ────────────────────────────────────

def _gather_course_context(db, course_id):
    """Gather ALL materials for a course as context."""
    materials = db.query(Material).filter(Material.course_id == course_id).all()
    return "\n\n".join(
        f"[{m.material_type.value}: {m.filename}]\n{m.extracted_text}"
        for m in materials
        if m.extracted_text
    )


@router.post("/assignments/{assignment_id}/draft")
def create_draft(assignment_id: int, db: Session = Depends(get_db)):
    """Generate an AI first draft for an assignment."""
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    context = _gather_course_context(db, assignment.course_id)
    result = generate_draft(assignment.title, assignment.description, context)
    return result


# ── Homework Completion ─────────────────────────────────

@router.post("/assignments/{assignment_id}/homework-turnin")
def create_homework_turnin(assignment_id: int, db: Session = Depends(get_db)):
    """Generate a turn-in ready homework submission using all course materials."""
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    context = _gather_course_context(db, assignment.course_id)
    result = generate_homework_turnin(assignment.title, assignment.description, context)
    return result


@router.post("/assignments/{assignment_id}/homework-study")
def create_homework_study(assignment_id: int, db: Session = Depends(get_db)):
    """Generate a detailed study version of the homework with step-by-step explanations."""
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    context = _gather_course_context(db, assignment.course_id)
    result = generate_homework_study(assignment.title, assignment.description, context)
    return result


# ── Helper ──────────────────────────────────────────────

def _assignment_response(a: Assignment) -> AssignmentResponse:
    return AssignmentResponse(
        id=a.id,
        course_id=a.course_id,
        title=a.title,
        description=a.description,
        due_date=a.due_date,
        weight=a.weight,
        status=a.status.value,
        ai_summary=a.ai_summary or "",
        step_count=len(a.steps),
        steps_done=sum(1 for s in a.steps if s.is_done),
    )
