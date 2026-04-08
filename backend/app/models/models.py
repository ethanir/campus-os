import datetime
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class MaterialType(str, enum.Enum):
    SYLLABUS = "syllabus"
    SLIDES = "slides"
    TEXTBOOK = "textbook"
    ASSIGNMENT = "assignment"
    ANNOUNCEMENT = "announcement"
    OTHER = "other"


class AssignmentStatus(str, enum.Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    DONE = "done"


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    code = Column(String(20), nullable=False)
    professor = Column(String(100), default="")
    semester = Column(String(20), default="")
    color = Column(String(7), default="#5AF0FF")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    materials = relationship("Material", back_populates="course", cascade="all, delete-orphan")
    assignments = relationship("Assignment", back_populates="course", cascade="all, delete-orphan")


class Material(Base):
    __tablename__ = "materials"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    material_type = Column(Enum(MaterialType), default=MaterialType.OTHER)
    extracted_text = Column(Text, default="")
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)

    course = relationship("Course", back_populates="materials")


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    title = Column(String(300), nullable=False)
    description = Column(Text, default="")
    due_date = Column(DateTime, nullable=True)
    weight = Column(Float, default=0.0)  # percentage of final grade
    status = Column(Enum(AssignmentStatus), default=AssignmentStatus.NOT_STARTED)
    ai_summary = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    course = relationship("Course", back_populates="assignments")
    steps = relationship("TaskStep", back_populates="assignment", cascade="all, delete-orphan")


class TaskStep(Base):
    __tablename__ = "task_steps"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"), nullable=False)
    order = Column(Integer, nullable=False)
    text = Column(Text, nullable=False)
    is_done = Column(Boolean, default=False)
    estimated_minutes = Column(Integer, default=30)

    assignment = relationship("Assignment", back_populates="steps")


class StudyGuide(Base):
    __tablename__ = "study_guides"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    title = Column(String(300), nullable=False)
    content = Column(Text, nullable=False)
    topics_covered = Column(Text, default="")  # JSON array of topic strings
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class WeeklyPlan(Base):
    __tablename__ = "weekly_plans"

    id = Column(Integer, primary_key=True, index=True)
    week_start = Column(DateTime, nullable=False)
    plan_json = Column(Text, nullable=False)  # Full JSON plan
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
