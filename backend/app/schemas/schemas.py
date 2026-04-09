from pydantic import BaseModel
from datetime import datetime
from typing import Optional


# ── Course ──────────────────────────────────────────────
class CourseCreate(BaseModel):
    name: str
    code: str
    professor: str = ""
    semester: str = ""
    color: str = "#5AF0FF"


class CourseResponse(BaseModel):
    id: int
    name: str
    code: str
    professor: str
    semester: str
    color: str
    created_at: datetime
    material_count: int = 0
    assignment_count: int = 0

    class Config:
        from_attributes = True


# ── Material ────────────────────────────────────────────
class MaterialResponse(BaseModel):
    id: int
    course_id: int
    filename: str
    material_type: str
    uploaded_at: datetime

    class Config:
        from_attributes = True


# ── Assignment ──────────────────────────────────────────
class AssignmentCreate(BaseModel):
    title: str
    description: str = ""
    due_date: Optional[datetime] = None
    weight: float = 0.0


class AssignmentResponse(BaseModel):
    id: int
    course_id: int
    title: str
    description: str
    due_date: Optional[datetime]
    weight: float
    status: str
    ai_summary: str
    context_notes: str = ""
    step_count: int = 0
    steps_done: int = 0

    class Config:
        from_attributes = True


# ── Task Steps ──────────────────────────────────────────
class TaskStepResponse(BaseModel):
    id: int
    order: int
    text: str
    is_done: bool
    estimated_minutes: int

    class Config:
        from_attributes = True


class TaskStepToggle(BaseModel):
    is_done: bool


# ── Study Guide ─────────────────────────────────────────
class StudyGuideResponse(BaseModel):
    id: int
    course_id: int
    title: str
    content: str
    topics_covered: str
    created_at: datetime

    class Config:
        from_attributes = True


# ── Weekly Plan ─────────────────────────────────────────
class WeeklyPlanResponse(BaseModel):
    id: int
    week_start: datetime
    plan_json: str
    created_at: datetime

    class Config:
        from_attributes = True


# ── AI Responses ────────────────────────────────────────
class ParsedSyllabus(BaseModel):
    assignments: list[AssignmentCreate]
    grading_breakdown: dict = {}
    course_policies: str = ""


class GeneratedSteps(BaseModel):
    steps: list[dict]  # [{text, estimated_minutes}]


class DraftResponse(BaseModel):
    draft: str
    notes: str = ""
