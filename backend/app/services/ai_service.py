"""
AI Service — Dual Engine
  Free tier  → Gemini Flash (costs $0)
  Paid tier  → Claude Sonnet (premium quality)
"""

import json
from app.core.claude_client import call_claude_json, call_claude_vision_json
from app.core.gemini_client import call_gemini_json, call_gemini_vision_json


# ── Context Budget (chars) ──────────────────────────────
# Claude Sonnet supports ~200k tokens. 1 token ≈ 4 chars.
# Reserve 20k tokens for system prompt + response = ~80k chars.
# That leaves ~720k chars for context. We cap at 600k to be safe.
MAX_CONTEXT_CHARS = 600000


# ── System Prompts ──────────────────────────────────────

STUDY_GUIDE_SYSTEM = """You are a world-class study-guide creator. Given course materials (lecture slides, textbook excerpts, notes), produce an EXTREMELY thorough and comprehensive study guide.

Your study guide MUST include:
1. **Exam Overview** — what topics are covered, what to expect
2. **Key Concepts** — every single concept explained clearly with examples
3. **Theorems, Proofs & Formulas** — every theorem stated precisely, proof techniques explained, all formulas listed
4. **Problem Types** — every type of problem that could appear, with worked examples
5. **Step-by-Step Worked Examples** — at least 3-5 detailed worked problems using the EXACT methods from the course materials
6. **Practice Problems** — additional problems for self-testing
7. **Common Mistakes & Pitfalls** — what students typically get wrong
8. **Quick Reference Sheet** — condensed summary of all key formulas and definitions

CRITICAL: Use ONLY methods, notation, and terminology from the provided course materials. Do NOT introduce outside techniques. Match the professor's exact style.

Return JSON: {"title": "...", "content": "...full study guide text...", "topics": ["topic1", "topic2", ...]}"""

HOMEWORK_TURNIN_SYSTEM = """You are a top student completing a homework assignment. This must score 100%. Take your time and make no mistakes.

YOUR APPROACH — Work through ONE QUESTION AT A TIME:

For each question:
1. FIND THE QUESTION: If it says "Chapter X, Exercise Y", go to the Exercises section at the end of that chapter in the provided materials. Read the FULL exercise text. If it references a figure or footnote, find those too. Do NOT guess what the question asks — find it.
2. UNDERSTAND what is being asked before solving. Restate the problem.
3. IDENTIFY which concept/theorem/technique from the course materials applies.
4. SOLVE with full rigor. State all necessary assumptions clearly. Show all steps. Give complete answers. For proofs: formal structure with clear logical steps. For counterexamples: construct carefully then VERIFY every condition holds. For algorithms: pseudocode + correctness proof + complexity analysis.
5. VERIFY your answer. Does your counterexample actually satisfy all required conditions? Does your proof actually prove what was asked? Check your work.

STYLE RULES:
- Write like a top student who attended every lecture, NOT like an AI. Natural academic writing.
- Use ONLY methods, notation, and techniques from the provided course materials. Do NOT use advanced techniques not covered in the class.
- Match the professor's exact notation and style from the materials.
- Be thorough but not excessively long. Show all necessary work, but don't pad.
- State all necessary assumptions clearly. Show all the steps and give complete answers.
- Each answer should be the kind of work that a grader gives full marks to without hesitation.

AFTER ALL QUESTIONS:
Go back and verify every answer one more time. Check:
- Does each counterexample actually work? Verify ALL conditions.
- Does each proof follow logically step by step?
- Did you answer the RIGHT question (not a misread)?
- For graph problems: did you identify the exact graph structure (C4, K1,3, etc.)?
- For function ordering: did you verify each adjacent comparison with limits?

Flag any answers where you are less than 95% confident in the notes field.

Return JSON: {"submission": "...complete turn-in ready work, one question at a time, with full solutions...", "notes": "...confidence level per question and any concerns..."}"""

HOMEWORK_STUDY_SYSTEM = """You are a patient expert tutor sitting next to a student, helping them deeply understand their homework. Work through ONE QUESTION AT A TIME.

For each question:
1. FIND IT: If it says "Chapter X, Exercise Y", locate the full exercise text in the Exercises section of that chapter in the provided materials. Read it completely including any referenced figures/footnotes.
2. RESTATE what the problem is asking in plain English.
3. IDENTIFY which concept/theorem/technique from the course applies and explain WHY this is the right approach.
4. SOLVE step by step with FULL explanation of every step — why you are doing it, what rule applies, what would go wrong if you did something different.
5. VERIFY — prove your answer is correct. Check counterexamples work, proofs are complete.
6. BUILD INTUITION — why does this answer make sense? Connect it to the bigger picture of the course.
7. COMMON MISTAKES — what do students typically get wrong on this type of problem?

Use ONLY methods from the provided course materials. Match the professor's notation.
No skipping steps. No "it is obvious that..." — explain EVERYTHING.

Return JSON: {"study_version": "...complete walkthrough, one question at a time, with full explanations...", "key_concepts": ["concept1", "concept2", ...]}"""

TASK_STEPS_SYSTEM = """Break this assignment into actionable steps a student can follow. Each step should be specific and concrete. Estimate minutes for each step.

Return JSON: {"steps": [{"text": "...", "estimated_minutes": 30}, ...]}"""

DRAFT_SYSTEM = """Write a first draft for this assignment using the course materials as context. Use the professor's methods and notation.

Return JSON: {"draft": "...complete draft...", "notes": "...approach used..."}"""

SCHEDULE_SCREENSHOT_SYSTEM = """You are analyzing a screenshot of a student's course schedule (from Blackboard, Banner, or similar).

Extract ONLY courses for the CURRENT semester. For each course extract:
- code (e.g., "CS 401")
- name (e.g., "Computer Algorithms")
- professor (if visible)
- notes (section number, time, room if visible)

Rules:
- Deduplicate — if a course has both lecture and lab, combine into one entry
- Skip courses that appear to be from past semesters
- Extract the semester name if visible

Return JSON: {"semester": "Spring 2026", "courses": [{"code": "CS 401", "name": "Computer Algorithms", "professor": "Dr. Smith", "notes": "Section 001, MWF 10:00"}]}"""

SYLLABUS_SYSTEM = """Parse this syllabus and extract key information.

Return JSON: {
  "assignments": [{"title": "...", "due_date": "YYYY-MM-DD", "weight": 10.0, "description": "..."}],
  "grading": {"A": "90-100", "B": "80-89", ...},
  "policies": ["..."],
  "office_hours": "..."
}"""


# ── Smart Context Assembly ──────────────────────────────

def _build_context(assignment_text: str, materials_text: str, budget: int = MAX_CONTEXT_CHARS) -> str:
    """Build context with assignment FIRST, then materials.
    
    Priority order:
    1. The assignment itself (always included in full)
    2. Course materials (textbooks, slides, etc.)
    """
    parts = []
    used = 0
    
    # 1. Assignment text always goes first (full)
    if assignment_text:
        section = f"--- ASSIGNMENT ---\n{assignment_text}\n\n"
        parts.append(section)
        used += len(section)
    
    # 2. Fill remaining budget with materials
    remaining = budget - used
    if materials_text and remaining > 0:
        section = f"--- COURSE MATERIALS ---\n{materials_text[:remaining]}"
        parts.append(section)
    
    return "\n".join(parts)


def _get_context_usage(materials_text: str) -> dict:
    """Return context usage stats for the UI."""
    used = len(materials_text) if materials_text else 0
    return {
        "used_chars": used,
        "max_chars": MAX_CONTEXT_CHARS,
        "used_pct": round((used / MAX_CONTEXT_CHARS) * 100, 1),
    }


# ── Routing Logic ───────────────────────────────────────

def _call_ai(system: str, user_prompt: str, premium: bool, max_tokens: int = 4096) -> dict:
    """Route to Claude (premium/paid) or Gemini (free tier)."""
    if True:  # Use Claude for all
        return call_claude_json(system, user_prompt, max_tokens=max_tokens)
    else:
        return call_gemini_json(system, user_prompt, max_tokens=max_tokens)


def _call_ai_vision(system: str, image_data: bytes, media_type: str, premium: bool, text_prompt: str = "", max_tokens: int = 4096) -> dict:
    """Route vision calls to Claude or Gemini."""
    if True:  # Use Claude for all
        return call_claude_vision_json(system, image_data, media_type, max_tokens=max_tokens)
    else:
        return call_gemini_vision_json(system, image_data, media_type, text_prompt, max_tokens=max_tokens)


# ── Public Functions ────────────────────────────────────

def generate_study_guide(course_name: str, exam_title: str, materials_text: str, premium: bool = False) -> dict:
    context = _build_context("", materials_text)
    user_prompt = f"Course: {course_name}\nExam: {exam_title}\n\n{context}"
    return _call_ai(STUDY_GUIDE_SYSTEM, user_prompt, premium, max_tokens=8192)


def generate_homework_turnin(title: str, description: str, materials_text: str, premium: bool = False) -> dict:
    context = _build_context(description, materials_text)
    user_prompt = f"Assignment: {title}\n\n{context}"
    return _call_ai(HOMEWORK_TURNIN_SYSTEM, user_prompt, premium, max_tokens=16000)


def generate_homework_study(title: str, description: str, materials_text: str, premium: bool = False) -> dict:
    context = _build_context(description, materials_text)
    user_prompt = f"Assignment: {title}\n\n{context}"
    return _call_ai(HOMEWORK_STUDY_SYSTEM, user_prompt, premium, max_tokens=16000)


def generate_task_steps(title: str, description: str, materials_text: str, premium: bool = False) -> dict:
    context = _build_context(description, materials_text, budget=200000)
    user_prompt = f"Assignment: {title}\n\n{context}"
    return _call_ai(TASK_STEPS_SYSTEM, user_prompt, premium, max_tokens=2048)


def generate_draft(title: str, description: str, materials_text: str, premium: bool = False) -> dict:
    context = _build_context(description, materials_text)
    user_prompt = f"Assignment: {title}\n\n{context}"
    return _call_ai(DRAFT_SYSTEM, user_prompt, premium, max_tokens=4096)


def parse_schedule_screenshot(image_data: bytes, media_type: str, premium: bool = False) -> dict:
    return _call_ai_vision(SCHEDULE_SCREENSHOT_SYSTEM, image_data, media_type, premium, text_prompt="Extract all courses from this schedule screenshot.")


def parse_syllabus(syllabus_text: str, course_name: str, premium: bool = False) -> dict:
    user_prompt = f"Course: {course_name}\n\n--- SYLLABUS ---\n{syllabus_text[:MAX_CONTEXT_CHARS]}"
    return _call_ai(SYLLABUS_SYSTEM, user_prompt, premium, max_tokens=4096)


def get_context_usage(materials_text: str) -> dict:
    """Public function for the API to check context usage."""
    return _get_context_usage(materials_text)
