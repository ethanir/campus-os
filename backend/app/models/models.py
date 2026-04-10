import datetime
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class MaterialType(str, enum.Enum):
    SYLLABUS = "syllabus"
    SLIDES = "slides"
    TEXTBOOK = "textbook"
    COMPLETED_WORK = "completed_work"
    ANNOUNCEMENT = "announcement"
    REFERENCE_IMAGE = "reference_image"
    OTHER = "other"


class AssignmentStatus(str, enum.Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    DONE = "done"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(100), default="")
    credits = Column(Integer, default=3)  # Free tier: 3 generations
    plan = Column(String(20), default="free")  # free, paid
    has_purchased = Column(Boolean, default=False)  # True once they buy credits
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    courses = relationship("Course", back_populates="user", cascade="all, delete-orphan")


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(200), nullable=False)
    code = Column(String(20), nullable=False)
    professor = Column(String(100), default="")
    semester = Column(String(20), default="")
    color = Column(String(7), default="#5AF0FF")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="courses")
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
    page_images_dir = Column(String(500), default="")  # DEPRECATED — kept for migration compat
    image_description = Column(Text, default="")  # User description for reference images
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)

    course = relationship("Course", back_populates="materials")


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    title = Column(String(300), nullable=False)
    description = Column(Text, default="")
    due_date = Column(DateTime, nullable=True)
    weight = Column(Float, default=0.0)
    status = Column(Enum(AssignmentStatus), default=AssignmentStatus.NOT_STARTED)
    ai_summary = Column(Text, default="")
    context_notes = Column(Text, default="")  # User-provided context about figures, images, etc.
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
    topics_covered = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Generation(Base):
    __tablename__ = "generations"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    assignment_id = Column(Integer, ForeignKey("assignments.id"), nullable=True)
    gen_type = Column(String(50), nullable=False)  # turnin, study, draft, steps, study_guide
    title = Column(String(300), default="")
    content = Column(Text, nullable=False)  # JSON string of full response
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    course = relationship("Course")
    assignment = relationship("Assignment")
