"""
AI Service — the brain of Campus OS.

Contains all Claude API prompt chains for:
- Syllabus parsing → deadlines + assignments
- Assignment → actionable task steps
- Lecture slides → exam study guide
- Assignment + context → first draft
- All assignments → weekly action plan
"""

import json
from datetime import datetime

from app.core.claude_client import call_claude_json, call_claude


# ── Syllabus Parsing ────────────────────────────────────

SYLLABUS_SYSTEM = """You are an expert academic assistant that parses course syllabi.
Extract ALL assignments, exams, quizzes, and deadlines from the syllabus text.
For each item, determine:
- title: exact name as listed
- description: brief summary of what's required
- due_date: ISO format (YYYY-MM-DDTHH:MM:SS) or null if not specified
- weight: percentage of final grade as a decimal (e.g., 10% = 10.0), 0 if not listed

Also extract:
- grading_breakdown: object mapping category names to percentages
- course_policies: brief summary of important policies (late work, attendance, etc.)

Return JSON with this exact structure:
{
  "assignments": [
    {"title": "...", "description": "...", "due_date": "...", "weight": 0.0}
  ],
  "grading_breakdown": {"Homework": 30, "Midterm": 20, ...},
  "course_policies": "..."
}"""


def parse_syllabus(syllabus_text: str, course_name: str) -> dict:
    """Parse a syllabus and extract all assignments and deadlines."""
    prompt = f"""Parse this syllabus for {course_name}. Extract every assignment, exam, quiz, project, and deadline.

SYLLABUS TEXT:
{syllabus_text[:15000]}"""

    return call_claude_json(SYLLABUS_SYSTEM, prompt)


# ── Task Step Generation ────────────────────────────────

STEPS_SYSTEM = """You are an expert at breaking down academic assignments into clear, actionable steps.
Given an assignment description and any relevant course materials, generate a step-by-step
plan that a student can follow to complete the assignment.

Each step should be:
- Specific and actionable (not vague like "work on the assignment")
- Ordered logically (read first, then plan, then execute, then review)
- Include time estimates in minutes

For proof-based assignments: include steps for understanding the problem, identifying the proof
technique, writing the formal proof, and verifying correctness.

For coding assignments: include setup, implementation phases, testing, and documentation.

For essays/reports: include research, outlining, drafting sections, revision, and formatting.

Return JSON:
{
  "steps": [
    {"text": "...", "estimated_minutes": 30}
  ]
}"""


def generate_task_steps(
    assignment_title: str,
    assignment_description: str,
    course_materials_context: str = "",
) -> dict:
    """Generate actionable task steps for an assignment."""
    prompt = f"""Break down this assignment into actionable steps:

ASSIGNMENT: {assignment_title}
DESCRIPTION: {assignment_description}

RELEVANT COURSE MATERIALS:
{course_materials_context[:10000] if course_materials_context else "No additional context provided."}"""

    return call_claude_json(STEPS_SYSTEM, prompt)


# ── Study Guide Generation ──────────────────────────────

STUDY_GUIDE_SYSTEM = """You are an expert tutor creating an exam study guide.
Given lecture slides, textbook content, and assignment context, create a focused study guide
that tells the student EXACTLY what matters for the exam.

Structure the guide as:
1. Key Topics (ranked by likely exam importance)
2. Must-Know Definitions & Theorems
3. Common Problem Types & How to Solve Them
4. Practice Problems (with solutions)
5. Common Mistakes to Avoid

Be specific. Reference actual content from the materials. Don't be generic.

Return JSON:
{
  "title": "Study Guide: ...",
  "topics": ["topic1", "topic2", ...],
  "content": "Full markdown study guide content here"
}"""


def generate_study_guide(
    course_name: str,
    exam_title: str,
    materials_text: str,
) -> dict:
    """Generate an exam study guide from course materials."""
    prompt = f"""Create an exam study guide for:

COURSE: {course_name}
EXAM: {exam_title}

COURSE MATERIALS (lecture slides, textbook excerpts, past assignments):
{materials_text[:20000]}"""

    return call_claude_json(STUDY_GUIDE_SYSTEM, prompt)


# ── Draft Generation ────────────────────────────────────

DRAFT_SYSTEM = """You are an expert academic writing assistant.
Given an assignment specification and relevant course materials, generate a high-quality
first draft that follows the professor's exact instructions.

For proof-based work: use proper mathematical notation, state assumptions clearly,
and structure proofs formally.

For coding: write clean, commented code with proper structure.

For essays: use academic tone, cite relevant course concepts, and follow any formatting requirements.

The draft should be substantive and ready for the student to review and refine — not a skeleton.

Return JSON:
{
  "draft": "Full draft content in markdown",
  "notes": "Notes about assumptions made, areas the student should verify, etc."
}"""


def generate_draft(
    assignment_title: str,
    assignment_description: str,
    course_materials_context: str = "",
) -> dict:
    """Generate a first draft for an assignment."""
    prompt = f"""Generate a first draft for this assignment:

ASSIGNMENT: {assignment_title}
INSTRUCTIONS: {assignment_description}

COURSE MATERIALS FOR CONTEXT:
{course_materials_context[:15000] if course_materials_context else "No additional context."}"""

    return call_claude_json(DRAFT_SYSTEM, prompt)


# ── Weekly Plan Generation ──────────────────────────────

WEEKLY_PLAN_SYSTEM = """You are an expert academic planner.
Given a list of upcoming assignments with deadlines and weights, create an optimal weekly plan.

Prioritization rules:
1. Urgent + high weight → do first
2. Break large tasks across multiple days
3. Leave buffer day (usually Sunday)
4. Assign 3-5 hours of work per day max
5. Front-load the week for high-priority items

Return JSON:
{
  "days": [
    {
      "day": "Mon",
      "date": "2026-04-08",
      "tasks": [
        {"text": "CS 401 HW5 — finish recurrence relation", "course_code": "CS 401", "minutes": 90}
      ]
    }
  ]
}"""


def generate_weekly_plan(
    assignments_json: list[dict],
    week_start: str,
) -> dict:
    """Generate an optimized weekly plan from upcoming assignments."""
    prompt = f"""Create an optimal weekly plan starting {week_start}.

UPCOMING ASSIGNMENTS:
{json.dumps(assignments_json, indent=2)}

Today is {datetime.now().strftime('%A, %B %d, %Y')}. Prioritize by urgency and grade weight."""

    return call_claude_json(WEEKLY_PLAN_SYSTEM, prompt)
