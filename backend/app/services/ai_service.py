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

STUDY_GUIDE_SYSTEM = """You are the most thorough, detail-obsessed tutor alive. A student is about to take an exam and has uploaded ALL their course materials to you — lecture slides, textbook chapters, past assignments, announcements, everything.

Your job is to create the ULTIMATE study guide. This is not a summary. This is a comprehensive, detailed guide that covers EVERYTHING the student needs to know.

Rules:
- Go through EVERY SINGLE piece of material provided. Do not skip anything.
- For every theorem, definition, algorithm, or concept mentioned: explain it, give the formal definition, show when/how it's used, and provide an example.
- For every proof technique used in lectures or assignments: explain the technique, show the pattern, and give a template the student can follow.
- For every type of problem that appeared in homework or slides: show how to solve it step by step.
- Include ALL formulas, ALL definitions, ALL key terms.
- If announcements mention "focus on X" or "this will be on the exam" — highlight those prominently.
- Create practice problems that mirror what the professor has assigned.
- Include common mistakes and how to avoid them.
- Organize by topic, not by lecture number.

Structure:
1. EXAM OVERVIEW — What topics are covered, format expectations
2. KEY CONCEPTS & DEFINITIONS — Every single one, with explanations
3. THEOREMS & PROOFS — Full statements, proof techniques used, when to apply them
4. PROBLEM TYPES & HOW TO SOLVE THEM — Step-by-step for each type
5. WORKED EXAMPLES — Detailed solutions to representative problems
6. PRACTICE PROBLEMS — With full solutions
7. COMMON MISTAKES & PITFALLS
8. QUICK REFERENCE — Formulas, definitions, key facts in condensed form

Return JSON:
{
  "title": "Study Guide: ...",
  "topics": ["topic1", "topic2", ...],
  "content": "Full markdown study guide content — be EXTREMELY thorough and detailed"
}"""


def generate_study_guide(
    course_name: str,
    exam_title: str,
    materials_text: str,
) -> dict:
    """Generate a comprehensive exam study guide from course materials."""
    prompt = f"""Create the most thorough, comprehensive study guide possible for:

COURSE: {course_name}
EXAM: {exam_title}

Go through EVERY piece of material below. Do not skip or summarize — cover everything in detail. The student is counting on this to be complete.

COURSE MATERIALS:
{materials_text[:100000]}"""

    return call_claude_json(STUDY_GUIDE_SYSTEM, prompt, max_tokens=8192)


# ── Homework Completion ─────────────────────────────────

HOMEWORK_TURNIN_SYSTEM = """You are an expert student completing a homework assignment. You have access to all the course materials — lecture slides, textbook chapters, and past work.

Your job is to produce a TURN-IN READY submission that would earn 100%. This means:
- Follow the professor's instructions EXACTLY.
- Use the notation, terminology, and methods taught in class (from the provided materials).
- For proofs: use the proof techniques from lectures. Structure them formally with clear statements, assumptions, and conclusions. Use the exact format the professor expects.
- For coding: write clean, well-documented code that follows class conventions.
- For written answers: be precise, thorough, and match the academic tone expected.
- For math: show all work, use proper notation as taught in the course.
- This should look like it was written by a top student in the class who attended every lecture.

Do NOT use techniques or knowledge not covered in the provided course materials unless absolutely necessary.

Return JSON:
{
  "submission": "The complete, ready-to-submit homework in markdown. Every problem answered completely.",
  "notes": "Brief notes about any assumptions or areas where the student should double-check."
}"""


HOMEWORK_STUDY_SYSTEM = """You are an expert tutor helping a student LEARN by working through their homework. You have access to all the course materials — lecture slides, textbook chapters, and past work.

Your job is to produce a DETAILED LEARNING VERSION of the homework. For every single problem:
1. Start by explaining what the problem is asking in plain English.
2. Identify which concept/theorem/technique from the course applies and WHY.
3. Show the complete solution step by step, explaining every single step — why you're doing it, what rule you're applying, what would happen if you did something different.
4. After solving, explain the intuition — why does this answer make sense?
5. Point out common mistakes students make on this type of problem.
6. If relevant, connect it to other topics in the course.

This should read like a patient tutor sitting next to the student, walking them through everything. No skipping steps. No "it's obvious that..." — explain EVERYTHING.

Return JSON:
{
  "study_version": "The complete homework with detailed explanations for every problem in markdown.",
  "key_concepts": ["List of key concepts the student should make sure they understand"]
}"""


def generate_homework_turnin(
    assignment_title: str,
    assignment_description: str,
    course_materials_context: str = "",
) -> dict:
    """Generate a turn-in ready homework submission."""
    prompt = f"""Complete this homework assignment as a top student would. Use ONLY the methods and notation from the course materials provided.

ASSIGNMENT: {assignment_title}
INSTRUCTIONS: {assignment_description}

COURSE MATERIALS (lectures, textbook, past work):
{course_materials_context[:100000] if course_materials_context else "No additional context."}"""

    return call_claude_json(HOMEWORK_TURNIN_SYSTEM, prompt, max_tokens=8192)


def generate_homework_study(
    assignment_title: str,
    assignment_description: str,
    course_materials_context: str = "",
) -> dict:
    """Generate a detailed learning version of the homework."""
    prompt = f"""Work through this homework assignment step by step, explaining EVERYTHING in detail so the student can learn from it.

ASSIGNMENT: {assignment_title}
INSTRUCTIONS: {assignment_description}

COURSE MATERIALS (lectures, textbook, past work):
{course_materials_context[:100000] if course_materials_context else "No additional context."}"""

    return call_claude_json(HOMEWORK_STUDY_SYSTEM, prompt, max_tokens=8192)


# ── Draft Generation (legacy, kept for compatibility) ───

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
{course_materials_context[:100000] if course_materials_context else "No additional context."}"""

    return call_claude_json(DRAFT_SYSTEM, prompt, max_tokens=8192)


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


# ── Schedule Screenshot Parsing ─────────────────────────

SCHEDULE_SCREENSHOT_SYSTEM = """You are an expert at reading university course schedules from screenshots.
You will be shown a screenshot of a student's course list, registration page, or schedule.

Your job is to extract ONLY the CURRENT/ACTIVE semester courses. Rules:
- The current semester is Spring 2026.
- IGNORE any courses marked "Closed" or from past semesters (Fall 2025, Spring 2025, etc.)
- ONLY extract courses with status "Open", "Registered", or that are clearly active.
- If a course has a lab section (like "CS 401, 0" lecture + "CS 401, 1" lab), treat it as ONE course. Add a note like "Has lab section" but do NOT create a duplicate entry.
- If a course is a seminar with 0 credit hours (like CS 499 Professional Development Seminar), still include it but note it's 0 credits.
- Extract the course code (e.g., "CS 401"), the full course title, and the professor name if visible.
- If professor name is not visible, leave it as empty string.

Return JSON:
{
  "semester": "Spring 2026",
  "courses": [
    {
      "code": "CS 401",
      "name": "Computer Algorithms I",
      "professor": "Ajay Kshemkalyani",
      "notes": "3 credit hours, Lecture-Discussion"
    }
  ]
}"""


def parse_schedule_screenshot(image_data: bytes, media_type: str) -> dict:
    """Parse a screenshot of a course schedule and extract active courses."""
    from app.core.claude_client import call_claude_vision_json

    return call_claude_vision_json(
        SCHEDULE_SCREENSHOT_SYSTEM,
        image_data,
        media_type,
        "Extract all ACTIVE courses from this screenshot. Only include current semester courses.",
    )
