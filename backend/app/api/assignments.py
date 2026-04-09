import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.auth import get_current_user, require_credits, deduct_credits
from app.models.models import Assignment, TaskStep, Course, Material, MaterialType, AssignmentStatus, User
from app.schemas.schemas import AssignmentCreate, AssignmentResponse, TaskStepResponse, TaskStepToggle
from app.services.ai_service import generate_task_steps, generate_draft, generate_homework_turnin, generate_homework_study
from app.services.file_extraction import extract_text

router = APIRouter(prefix="/api", tags=["assignments"])


def _verify_course(db, user, course_id):
    course = db.query(Course).filter(Course.id == course_id, Course.user_id == user.id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


# ── Assignments CRUD ────────────────────────────────────

@router.get("/courses/{course_id}/assignments", response_model=list[AssignmentResponse])
def list_assignments(course_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _verify_course(db, user, course_id)
    assignments = db.query(Assignment).filter(Assignment.course_id == course_id).order_by(Assignment.due_date.asc()).all()
    return [_assignment_response(a) for a in assignments]


@router.post("/courses/{course_id}/assignments", response_model=AssignmentResponse)
def create_assignment(course_id: int, data: AssignmentCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _verify_course(db, user, course_id)
    assignment = Assignment(course_id=course_id, **data.model_dump())
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return _assignment_response(assignment)


@router.delete("/assignments/{assignment_id}")
def delete_assignment(assignment_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    _verify_course(db, user, assignment.course_id)
    db.delete(assignment)
    db.commit()
    return {"ok": True}


# ── Upload Assignment File ──────────────────────────────

@router.post("/courses/{course_id}/upload-assignment")
async def upload_assignment(
    course_id: int,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    course = _verify_course(db, user, course_id)
    course_dir = settings.upload_path / str(user.id) / str(course_id)
    course_dir.mkdir(parents=True, exist_ok=True)
    file_path = course_dir / file.filename
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    extracted = extract_text(str(file_path))
    mat = Material(course_id=course_id, filename=file.filename, file_path=str(file_path), material_type=MaterialType.ASSIGNMENT, extracted_text=extracted)
    db.add(mat)
    db.commit()

    title = file.filename.rsplit(".", 1)[0].replace("_", " ").replace("-", " ")
    assignment = Assignment(course_id=course_id, title=title, description=extracted[:10000] if extracted else "")
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return _assignment_response(assignment)


# ── Task Steps ──────────────────────────────────────────

@router.get("/assignments/{assignment_id}/steps", response_model=list[TaskStepResponse])
def list_steps(assignment_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    steps = db.query(TaskStep).filter(TaskStep.assignment_id == assignment_id).order_by(TaskStep.order).all()
    return [TaskStepResponse(id=s.id, order=s.order, text=s.text, is_done=s.is_done, estimated_minutes=s.estimated_minutes) for s in steps]


@router.post("/assignments/{assignment_id}/generate-steps")
def generate_steps_route(assignment_id: int, user: User = Depends(require_credits(1)), db: Session = Depends(get_db)):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    _verify_course(db, user, assignment.course_id)

    context = _gather_course_context(db, assignment.course_id)
    result = generate_task_steps(assignment.title, assignment.description, context, premium=user.has_purchased)

    # SUCCESS — now deduct
    deduct_credits(user, db)

    db.query(TaskStep).filter(TaskStep.assignment_id == assignment_id).delete()
    for i, step_data in enumerate(result.get("steps", [])):
        step = TaskStep(assignment_id=assignment_id, order=i + 1, text=step_data["text"], estimated_minutes=step_data.get("estimated_minutes", 30))
        db.add(step)
    db.commit()
    return result


@router.patch("/steps/{step_id}")
def toggle_step(step_id: int, data: TaskStepToggle, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    step = db.query(TaskStep).filter(TaskStep.id == step_id).first()
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")
    step.is_done = data.is_done
    db.commit()
    return {"ok": True, "is_done": step.is_done}


# ── AI Generation (credits deducted AFTER success) ─────

def _gather_course_context(db, course_id):
    materials = db.query(Material).filter(Material.course_id == course_id).all()
    return "\n\n".join(f"[{m.material_type.value}: {m.filename}]\n{m.extracted_text}" for m in materials if m.extracted_text)


@router.post("/assignments/{assignment_id}/draft")
def create_draft(assignment_id: int, user: User = Depends(require_credits(1)), db: Session = Depends(get_db)):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    _verify_course(db, user, assignment.course_id)
    context = _gather_course_context(db, assignment.course_id)
    result = generate_draft(assignment.title, assignment.description, context, premium=user.has_purchased)
    deduct_credits(user, db)
    return result


@router.post("/assignments/{assignment_id}/homework-turnin")
def create_homework_turnin(assignment_id: int, user: User = Depends(require_credits(1)), db: Session = Depends(get_db)):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    _verify_course(db, user, assignment.course_id)
    context = _gather_course_context(db, assignment.course_id)
    result = generate_homework_turnin(assignment.title, assignment.description, context, premium=user.has_purchased)
    deduct_credits(user, db)
    return result


@router.post("/assignments/{assignment_id}/homework-study")
def create_homework_study(assignment_id: int, user: User = Depends(require_credits(1)), db: Session = Depends(get_db)):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    _verify_course(db, user, assignment.course_id)
    context = _gather_course_context(db, assignment.course_id)
    result = generate_homework_study(assignment.title, assignment.description, context, premium=user.has_purchased)
    deduct_credits(user, db)
    return result


def _assignment_response(a: Assignment) -> AssignmentResponse:
    return AssignmentResponse(
        id=a.id, course_id=a.course_id, title=a.title, description=a.description,
        due_date=a.due_date, weight=a.weight, status=a.status.value, ai_summary=a.ai_summary or "",
        step_count=len(a.steps), steps_done=sum(1 for s in a.steps if s.is_done),
    )
