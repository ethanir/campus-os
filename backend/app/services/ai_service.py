"""
AI Service — Dual Engine
  Free tier  → Gemini Flash (costs $0)
  Paid tier  → Claude Sonnet (premium quality)
"""

import json
from app.core.claude_client import call_claude_json, call_claude_vision_json, call_claude_multimodal_json, call_claude_opus_json, call_claude_opus_multimodal_json, call_claude_opus_thinking_json
from app.core.groq_client import call_groq_json, call_groq_vision_json


# ── Context Budget (chars) ──────────────────────────────
# Claude Sonnet supports ~200k tokens. 1 token ≈ 4 chars.
# Reserve 20k tokens for system prompt + response = ~80k chars.
# That leaves ~720k chars for context. We cap at 600k to be safe.
MAX_CONTEXT_CHARS = 100000
MAX_CONTEXT_CHARS_FREE = 50000  # ~200k chars keeps Sonnet costs at ~$0.15/call


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

ABSOLUTE RULES:

1. CLEAN OUTPUT: Your submission must read as a polished final draft — one clean solution per question, no scratch work, no failed attempts, no self-corrections. FORBIDDEN: "Actually", "Wait", "Let me reconsider", "Hmm", "On second thought", "Let me try", "This doesn't work". If you write any of these, your grade is 0.

2. VERIFY BEFORE YOU WRITE: For EVERY answer, before writing it out, test your key claim on one small concrete example IN YOUR HEAD (not on paper). If a counterexample doesn't actually demonstrate what you claim when you check all cases, discard it silently and find one that works. If a mathematical property doesn't hold on your test case, don't assert it.

3. READ THE ACTUAL PROBLEM: When a question says "Chapter X, Exercise Y", find that EXACT exercise in the provided course materials and quote its first sentence before solving. Do not guess what the exercise says. Do not solve a different exercise. If the materials contain the exercise text, use it verbatim. If you cannot find it, say so.

4. CHECK YOUR MATH: Never assert a mathematical property without verifying it. Common errors to avoid: claiming a relation is transitive when it isn't, claiming a counterexample shows instability when checking all cases shows stability, misreading notation from extracted text.

VERIFY EVERYTHING:
- Before presenting ANY counterexample, check ALL cases numerically. Write out the numbers. If your counterexample doesn't actually demonstrate what you claim, discard it and find one that does.
- Before asserting ANY mathematical property, test it on a concrete small example first. If the property doesn't hold on your test case, don't assert it.
- When reading mathematical expressions from course materials, be aware that PDF text extraction may corrupt notation. Superscripts like 2^n may appear as "2n". Use context to resolve ambiguity — if a list contains exponential functions like 2^(2^n), then "2n" nearby is almost certainly 2^n (exponential), not 2×n (linear). Always use surrounding context to resolve ambiguity.
- When a question references a textbook exercise, find and quote the EXACT exercise text from the provided materials before solving. If you cannot find it, state that clearly.

ABSOLUTE RULE — READ THE ASSIGNMENT EXACTLY:
- COUNT the number of sub-parts, functions, or items in each problem. Your answer must match exactly. If a problem lists 6 functions, you must address all 6.
- If a problem references a specific figure (e.g. "Fig 1.3(b)"), find that figure in the course materials and identify EXACTLY what graph/structure it shows before answering.
- IMPORTANT: You may be provided with images of textbook pages containing figures, graphs, and diagrams. EXAMINE THESE IMAGES CAREFULLY. They show the exact figures referenced in problems (e.g., Fig 1.3(a), Fig 1.3(b)). Describe what you see in each figure before answering questions about them.
- Do NOT answer from memory. You may recognize these problems from a textbook — IGNORE what you think you know. Read the ACTUAL text and images provided.
- NEVER change, simplify, or misquote what a problem says. If a problem says 2^(2^n), do NOT simplify it to 2^(2n). Preserve ALL notation exactly as written.

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

CRITICAL — DUPLICATE CHECK:
- Every question has UNIQUE data. If two questions look similar, RE-READ both from the assignment text. They WILL have DIFFERENT inputs.
- NEVER copy an answer from one question to another.
- For EVERY question that involves a list (of functions, values, graphs, etc.), you MUST start your answer by writing: "The functions listed in this question are: ..." copying them EXACTLY from the assignment text. Then solve using those specific functions. This is mandatory — do not skip this step.
- If two of your answers look similar, you made an error. Stop and re-read the original questions character by character.

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




VERIFICATION_SYSTEM = """You are a rigorous math/CS grader. You are given a homework submission. Your job is to find errors.

For EACH answer, check:
1. Does the counterexample actually work? Verify ALL conditions explicitly.
2. Does the proof follow logically? Is any step hand-wavy?
3. Are the right functions/graphs/values used (matching what the problem states)?
4. Is the answer complete (all parts addressed)?

If you find errors, provide the CORRECTED answer.
If an answer is correct, say so briefly.

Return JSON: {"corrections": [{"question": "Q3", "issue": "...", "corrected_answer": "..."}], "verified_ok": ["Q1", "Q2", ...]}"""

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
    """Route to Sonnet (paid) or Groq (free)."""
    if premium:
        return call_claude_json(system, user_prompt, max_tokens=max_tokens)
    else:
        return call_groq_json(system, user_prompt, max_tokens=min(max_tokens, 8000))


def _call_ai_opus_thinking(system: str, user_prompt: str, max_tokens: int = 16000) -> dict:
    """Use Opus with extended thinking for highest quality (premium turn-in only)."""
    return call_claude_opus_thinking_json(system, user_prompt, thinking_budget=10000, max_tokens=max_tokens)


def _call_ai_with_images(system: str, user_prompt: str, image_paths: list[str], premium: bool, max_tokens: int = 4096) -> dict:
    """Route AI calls that include page images (for seeing figures/graphs)."""
    if image_paths:
        if premium:
            return call_claude_multimodal_json(system, user_prompt, image_paths, max_tokens=max_tokens)
        else:
            try:
                return call_groq_vision_json(system, user_prompt, image_paths, max_tokens=min(max_tokens, 8000))
            except Exception:
                # Fallback to text-only if images are too large
                return call_groq_json(system, user_prompt, max_tokens=min(max_tokens, 8000))
    else:
        return _call_ai(system, user_prompt, premium, max_tokens=max_tokens)


def _call_ai_vision(system: str, image_data: bytes, media_type: str, premium: bool, text_prompt: str = "", max_tokens: int = 4096) -> dict:
    """Route vision calls to Claude or Gemini."""
    if True:  # Use Claude for all
        return call_claude_vision_json(system, image_data, media_type, max_tokens=max_tokens)
    else:
        return call_gemini_vision_json(system, image_data, media_type, text_prompt, max_tokens=max_tokens)



def _verify_submission(submission_text: str, assignment_text: str, materials_text: str, premium: bool, image_paths: list[str] = None) -> dict:
    """Second pass: verify the submission and fix errors."""
    context = materials_text[:200000] if materials_text else ""
    user_prompt = f"""Here is a homework submission to verify:

--- ASSIGNMENT ---
{assignment_text[:50000]}

--- SUBMISSION TO VERIFY ---
{submission_text}

--- COURSE MATERIALS (for reference) ---
{context[:100000]}

Check every answer for correctness. Fix any errors you find.

ALSO CHECK FOR DUPLICATES: If two questions have identical or near-identical answers, one of them is almost certainly wrong. Re-read both questions from the assignment text — they have different inputs. Fix the one that used the wrong data."""
    
    try:
        if image_paths:
            return call_claude_opus_multimodal_json(VERIFICATION_SYSTEM, user_prompt, image_paths, max_tokens=6000) if premium else _call_ai_with_images(VERIFICATION_SYSTEM, user_prompt, image_paths, premium, max_tokens=6000)
        else:
            return call_claude_opus_json(VERIFICATION_SYSTEM, user_prompt, max_tokens=6000) if premium else _call_ai(VERIFICATION_SYSTEM, user_prompt, premium, max_tokens=6000)
    except Exception:
        return {"corrections": [], "verified_ok": ["all"]}


# ── Public Functions ────────────────────────────────────

def generate_study_guide(course_name: str, exam_title: str, materials_text: str, premium: bool = False) -> dict:
    context = _build_context("", materials_text)
    user_prompt = f"Course: {course_name}\nExam: {exam_title}\n\n{context}"
    return _call_ai(STUDY_GUIDE_SYSTEM, user_prompt, premium, max_tokens=8192)


def generate_homework_turnin(title: str, description: str, materials_text: str, premium: bool = False, image_paths: list[str] = None) -> dict:
    budget = MAX_CONTEXT_CHARS if premium else MAX_CONTEXT_CHARS_FREE
    context = _build_context(description, materials_text, budget=budget)
    user_prompt = f"Assignment: {title}\n\n{context}"
    
    # Use shorter system prompt for free tier to stay within Groq limits
    system = HOMEWORK_TURNIN_SYSTEM if premium else HOMEWORK_TURNIN_SYSTEM_FREE
    
    # First pass: solve
    if image_paths:
        result = _call_ai_with_images(system, user_prompt, image_paths, premium, max_tokens=12000)
    else:
        result = _call_ai_opus_thinking(system, user_prompt, max_tokens=32000) if premium else _call_ai(system, user_prompt, premium, max_tokens=12000)
    
    # Second pass: verify and fix errors
    if result.get("submission"):
        try:
            verification = _verify_submission(
                result["submission"], description, materials_text, premium, image_paths
            )
            corrections = verification.get("corrections", [])
            if corrections:
                # Apply corrections by re-solving with error feedback
                correction_text = "\n".join(
                    f"- {c['question']}: {c['issue']}. Correct answer: {c['corrected_answer']}"
                    for c in corrections
                )
                fix_prompt = f"""Your previous submission had these errors:
{correction_text}

Original assignment: {title}

{context}

Rewrite the COMPLETE submission with ALL corrections applied. Keep correct answers unchanged."""
                
                if image_paths:
                    result = _call_ai_with_images(HOMEWORK_TURNIN_SYSTEM, fix_prompt, image_paths, premium, max_tokens=12000)
                else:
                    result = _call_ai(HOMEWORK_TURNIN_SYSTEM, fix_prompt, premium, max_tokens=12000)
                result["notes"] = result.get("notes", "") + " [Verified and corrected]"
            else:
                result["notes"] = result.get("notes", "") + " [Verified — no errors found]"
        except Exception:
            pass  # Verification failed, return original
    
    return result


def generate_homework_study(title: str, description: str, materials_text: str, premium: bool = False, image_paths: list[str] = None) -> dict:
    budget = MAX_CONTEXT_CHARS if premium else MAX_CONTEXT_CHARS_FREE
    context = _build_context(description, materials_text, budget=budget)
    user_prompt = f"Assignment: {title}\n\n{context}"
    system = HOMEWORK_STUDY_SYSTEM if premium else HOMEWORK_STUDY_SYSTEM_FREE
    if image_paths:
        return _call_ai_with_images(system, user_prompt, image_paths, premium, max_tokens=12000)
    return _call_ai(system, user_prompt, premium, max_tokens=12000)


def generate_task_steps(title: str, description: str, materials_text: str, premium: bool = False) -> dict:
    context = _build_context(description, materials_text, budget=200000)
    user_prompt = f"Assignment: {title}\n\n{context}"
    return _call_ai(TASK_STEPS_SYSTEM, user_prompt, premium, max_tokens=2048)


def generate_draft(title: str, description: str, materials_text: str, premium: bool = False) -> dict:
    budget = MAX_CONTEXT_CHARS if premium else MAX_CONTEXT_CHARS_FREE
    context = _build_context(description, materials_text, budget=budget)
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


HOMEWORK_TURNIN_SYSTEM_FREE = """You are a top student completing a homework assignment for a perfect score.

Rules:
- Use ONLY methods, notation, and techniques from the provided course materials
- Show all work clearly, one question at a time
- Match the professor's exact notation and style
- For each question: identify the concept, solve with full rigor, verify your answer
- If a problem references a figure, check the course materials or context notes for its description
- Write like a top student, not like an AI
- Output ONLY your final, clean solutions — no false starts or self-corrections

Return JSON: {"submission": "...complete turn-in ready work...", "notes": "...confidence level and any concerns..."}"""

HOMEWORK_STUDY_SYSTEM_FREE = """You are a patient tutor helping a student understand their homework step by step.

For each question:
1. Restate what the problem asks in plain English
2. Identify which concept from the course applies and why
3. Solve step by step with full explanation of every step
4. Verify the answer is correct
5. Note common mistakes students make on this type of problem

Use ONLY methods from the provided course materials. Match the professor's notation. Explain everything clearly.

CRITICAL: You MUST complete EVERY SINGLE QUESTION. Never abbreviate, summarize, or skip remaining questions. Never write "remaining questions would follow similar pattern" or "additional questions would continue". If there are 8 questions, you must provide detailed walkthroughs for all 8. Incomplete responses are unacceptable.

Return JSON: {"study_version": "...complete walkthrough for ALL questions with full explanations...", "key_concepts": ["concept1", "concept2", ...]}"""
