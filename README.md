# 🎓 Campus OS

**An AI-native academic operating system that turns your coursework into an actionable dashboard.**

Campus OS ingests your course materials — syllabi, lecture slides, textbook chapters, announcements, Piazza posts — and uses AI to parse assignments, generate weekly action plans, break tasks into steps, create study guides, and track deadlines across all your courses.

> This is not a homework helper. It's a system that turns school into a dashboard.

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=black)
![Claude API](https://img.shields.io/badge/Claude_API-Anthropic-D4A574?logo=anthropic&logoColor=white)

---

## Features

- **Syllabus Parsing** — Upload a syllabus PDF and Campus OS extracts every assignment, exam, and deadline with grading weights
- **Smart Task Decomposition** — AI breaks professor instructions into exact, actionable steps
- **Weekly Action Plans** — Auto-generated prioritized plans based on deadlines, difficulty, and grade weight
- **Exam Prep Engine** — Converts lecture slides and textbook chapters into "what matters for the exam" study guides
- **Deadline Tracker** — Unified timeline across all courses with urgency indicators
- **Draft Generation** — AI-assisted first drafts grounded in your actual course materials
- **Group Project Manager** — Track team roles, responsibilities, and deliverables
- **Email Drafting** — Generate professional emails to professors and TAs with proper context

## Architecture

```
campus-os/
├── backend/                 # FastAPI + SQLite + Claude API
│   ├── app/
│   │   ├── api/             # Route handlers
│   │   ├── core/            # Config, Claude client, auth
│   │   ├── models/          # SQLAlchemy ORM models
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   └── services/        # Business logic + AI processing
│   ├── tests/
│   ├── requirements.txt
│   └── main.py
├── frontend/                # React + Vite
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── api/
│   └── package.json
└── docs/
```

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Backend | FastAPI | REST API server |
| Database | SQLite + SQLAlchemy | Persistent storage (Postgres-ready) |
| AI | Anthropic Claude API | Document parsing, task generation, study guides |
| File Processing | PyMuPDF + python-pptx | PDF and slide extraction |
| Frontend | React 18 + Vite | Dashboard UI |
| Styling | Tailwind CSS | Utility-first CSS |

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Anthropic API key ([get one here](https://console.anthropic.com))

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # Add your ANTHROPIC_API_KEY
uvicorn main:app --reload
```

API runs at `http://localhost:8000` — docs at `http://localhost:8000/docs`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/courses` | Create a new course |
| `POST` | `/api/courses/{id}/upload` | Upload course materials |
| `GET` | `/api/courses/{id}/assignments` | List parsed assignments |
| `POST` | `/api/courses/{id}/parse-syllabus` | AI-parse uploaded syllabus |
| `GET` | `/api/assignments/{id}/steps` | Get AI-generated task steps |
| `POST` | `/api/assignments/{id}/generate-steps` | Generate task breakdown |
| `GET` | `/api/plan/weekly` | Get weekly action plan |
| `POST` | `/api/courses/{id}/study-guide` | Generate exam study guide |
| `POST` | `/api/assignments/{id}/draft` | Generate first draft |

## Roadmap

- [x] Syllabus parsing and deadline extraction
- [x] AI task decomposition
- [x] Weekly plan generation
- [x] Exam prep study guides
- [ ] Group project role tracking
- [ ] Canvas/Blackboard LMS integration
- [ ] Calendar sync (Google Calendar, Apple Calendar)
- [ ] Mobile app (React Native)
- [ ] Multi-user support with Stripe billing

## License

MIT

---

Built by [Your Name](https://github.com/yourusername)
