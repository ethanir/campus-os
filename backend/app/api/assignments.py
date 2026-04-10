from pathlib import Path
import json
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.auth import get_current_user, require_credits, deduct_credits
from app.models.models import Assignment, TaskStep, Course, Material, MaterialType, AssignmentStatus, User, Generation
from app.schemas.schemas import AssignmentCreate, AssignmentResponse, TaskStepResponse, TaskStepToggle
from app.services.ai_service import generate_task_steps, generate_draft, generate_homework_turnin, generate_homework_study
from app.services.file_extraction import extract_text

router = APIRouter(prefix="/api", tags=["assignments"])


def _verify_course(db, user, course_id):
    course = db.query(Course).filter(Course.id == course_id, Course.user_id == user.id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


def _save_generation(db, course_id, assignment_id, gen_type, title, result, notes=""):
    """Save an AI generation to the database."""
    gen = Generation(
        course_id=course_id,
        assignment_id=assignment_id,
        gen_type=gen_type,
        title=title,
        content=json.dumps(result),
        notes=notes,
    )
    db.add(gen)
    db.commit()
    db.refresh(gen)
    return gen


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


# ── Update Assignment Context Notes ─────────────────────

@router.patch("/assignments/{assignment_id}/context-notes")
def update_context_notes(assignment_id: int, data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    _verify_course(db, user, assignment.course_id)
    assignment.context_notes = data.get("context_notes", "")
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
    deduct_credits(user, db)

    db.query(TaskStep).filter(TaskStep.assignment_id == assignment_id).delete()
    for i, step_data in enumerate(result.get("steps", [])):
        step = TaskStep(assignment_id=assignment_id, order=i + 1, text=step_data["text"], estimated_minutes=step_data.get("estimated_minutes", 30))
        db.add(step)
    db.commit()

    _save_generation(db, assignment.course_id, assignment_id, "steps", f"Steps: {assignment.title}", result)
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

def _gather_course_images(db, course_id):
    """Collect reference image file paths from course materials."""
    materials = db.query(Material).filter(
        Material.course_id == course_id,
        Material.material_type == MaterialType.REFERENCE_IMAGE,
    ).all()
    image_paths = []
    for m in materials:
        if m.file_path and Path(m.file_path).exists():
            image_paths.append(str(m.file_path))
    return image_paths


def _gather_course_context(db, course_id):
    """Assemble all course materials with clear labels so the AI knows what each source is."""
    TYPE_LABELS = {
        "textbook": "COURSE TEXTBOOK (use this as the primary reference for methods, theorems, and notation)",
        "slides": "LECTURE SLIDES (these show what the professor emphasized in class)",
        "syllabus": "COURSE SYLLABUS (contains grading policy, schedule, and expectations)",
        "announcement": "PROFESSOR ANNOUNCEMENT (may contain hints, clarifications, or policy changes)",
        "completed_work": "PAST COMPLETED WORK (use this as reference for writing style, formatting, and how this student solves problems)",
        "other": "COURSE MATERIAL",
    }
    materials = db.query(Material).filter(Material.course_id == course_id).all()
    parts = []
    for m in materials:
        # Reference images: include description as text context (image itself sent separately via vision)
        if m.material_type == MaterialType.REFERENCE_IMAGE:
            desc = (getattr(m, 'image_description', '') or '').strip()
            if desc:
                parts.append(f"=== REFERENCE IMAGE: {m.filename} ===\nUser description: {desc}\n(The actual image is attached separately for the AI to see)")
            continue

        if not m.extracted_text:
            continue
        label = TYPE_LABELS.get(m.material_type.value, "COURSE MATERIAL")
        parts.append(f"=== {label}: {m.filename} ===\n{m.extracted_text}")
    return "\n\n".join(parts)


@router.post("/assignments/{assignment_id}/draft")
def create_draft(assignment_id: int, user: User = Depends(require_credits(1)), db: Session = Depends(get_db)):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    _verify_course(db, user, assignment.course_id)
    context = _gather_course_context(db, assignment.course_id)
    result = generate_draft(assignment.title, assignment.description, context, premium=user.has_purchased)
    deduct_credits(user, db)
    _save_generation(db, assignment.course_id, assignment_id, "draft", f"Draft: {assignment.title}", result, result.get("notes", ""))
    return result


@router.post("/assignments/{assignment_id}/homework-turnin")
def create_homework_turnin(assignment_id: int, user: User = Depends(require_credits(1)), db: Session = Depends(get_db)):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    _verify_course(db, user, assignment.course_id)
    context = _gather_course_context(db, assignment.course_id)
    images = _gather_course_images(db, assignment.course_id)
    result = generate_homework_turnin(assignment.title, assignment.description, context, premium=user.has_purchased, image_paths=images)
    deduct_credits(user, db)
    _save_generation(db, assignment.course_id, assignment_id, "turnin", f"Turn-in: {assignment.title}", result, result.get("notes", ""))
    return result


@router.post("/assignments/{assignment_id}/homework-study")
def create_homework_study(assignment_id: int, user: User = Depends(require_credits(1)), db: Session = Depends(get_db)):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    _verify_course(db, user, assignment.course_id)
    context = _gather_course_context(db, assignment.course_id)
    images = _gather_course_images(db, assignment.course_id)
    result = generate_homework_study(assignment.title, assignment.description, context, premium=user.has_purchased, image_paths=images)
    deduct_credits(user, db)
    _save_generation(db, assignment.course_id, assignment_id, "study", f"Study: {assignment.title}", result, ", ".join(result.get("key_concepts", [])))
    return result


# ── List saved generations ──────────────────────────────

@router.get("/courses/{course_id}/generations")
def list_generations(course_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _verify_course(db, user, course_id)
    gens = db.query(Generation).filter(Generation.course_id == course_id).order_by(Generation.created_at.desc()).all()
    return [{
        "id": g.id,
        "assignment_id": g.assignment_id,
        "gen_type": g.gen_type,
        "title": g.title,
        "content": g.content,
        "notes": g.notes,
        "created_at": g.created_at.isoformat(),
    } for g in gens]


@router.get("/generations/{gen_id}")
def get_generation(gen_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    gen = db.query(Generation).filter(Generation.id == gen_id).first()
    if not gen:
        raise HTTPException(status_code=404, detail="Generation not found")
    _verify_course(db, user, gen.course_id)
    return {
        "id": gen.id,
        "assignment_id": gen.assignment_id,
        "gen_type": gen.gen_type,
        "title": gen.title,
        "content": gen.content,
        "notes": gen.notes,
        "created_at": gen.created_at.isoformat(),
    }


@router.delete("/generations/{gen_id}")
def delete_generation(gen_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    gen = db.query(Generation).filter(Generation.id == gen_id).first()
    if not gen:
        raise HTTPException(status_code=404, detail="Generation not found")
    _verify_course(db, user, gen.course_id)
    db.delete(gen)
    db.commit()
    return {"ok": True}


def _assignment_response(a: Assignment) -> AssignmentResponse:
    return AssignmentResponse(
        id=a.id, course_id=a.course_id, title=a.title, description=a.description,
        due_date=a.due_date, weight=a.weight, status=a.status.value, ai_summary=a.ai_summary or "",
        context_notes=a.context_notes or "",
        step_count=len(a.steps), steps_done=sum(1 for s in a.steps if s.is_done),
    )
