import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, Sparkles, Loader2, FileText, Check, Circle,
  BookOpen, ChevronDown, ChevronUp, Pencil,
} from "lucide-react";
import {
  getCourse, getAssignments, getMaterials, getSteps,
  generateSteps, toggleStep, parseSyllabus, generateDraft,
  generateStudyGuide,
} from "../api/client";

export default function CoursePage() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [steps, setSteps] = useState({});
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(null); // "parse" | "steps-{id}" | "draft-{id}" | "study"
  const [draft, setDraft] = useState(null);
  const [studyGuide, setStudyGuide] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [c, a, m] = await Promise.all([
          getCourse(id),
          getAssignments(id),
          getMaterials(id),
        ]);
        setCourse(c);
        setAssignments(a);
        setMaterials(m);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    })();
  }, [id]);

  const loadSteps = async (assignmentId) => {
    if (steps[assignmentId]) return;
    try {
      const s = await getSteps(assignmentId);
      setSteps((prev) => ({ ...prev, [assignmentId]: s }));
    } catch {}
  };

  const handleExpand = (assignmentId) => {
    if (expanded === assignmentId) {
      setExpanded(null);
    } else {
      setExpanded(assignmentId);
      loadSteps(assignmentId);
    }
  };

  const handleGenerateSteps = async (assignmentId) => {
    setAiLoading(`steps-${assignmentId}`);
    try {
      const result = await generateSteps(assignmentId);
      const s = await getSteps(assignmentId);
      setSteps((prev) => ({ ...prev, [assignmentId]: s }));
    } catch (err) { console.error(err); }
    setAiLoading(null);
  };

  const handleToggleStep = async (stepId, currentDone, assignmentId) => {
    try {
      await toggleStep(stepId, !currentDone);
      setSteps((prev) => ({
        ...prev,
        [assignmentId]: prev[assignmentId].map((s) =>
          s.id === stepId ? { ...s, is_done: !currentDone } : s
        ),
      }));
    } catch {}
  };

  const handleParseSyllabus = async () => {
    setAiLoading("parse");
    try {
      const result = await parseSyllabus(id);
      // Refresh assignments
      const a = await getAssignments(id);
      setAssignments(a);
      alert(`Parsed ${result.assignments?.length || 0} assignments from syllabus!`);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to parse syllabus");
    }
    setAiLoading(null);
  };

  const handleGenerateDraft = async (assignmentId) => {
    setAiLoading(`draft-${assignmentId}`);
    try {
      const result = await generateDraft(assignmentId);
      setDraft(result);
    } catch (err) { console.error(err); }
    setAiLoading(null);
  };

  const handleStudyGuide = async () => {
    setAiLoading("study");
    try {
      const result = await generateStudyGuide(id, "Exam");
      setStudyGuide(result);
    } catch (err) { console.error(err); }
    setAiLoading(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-neutral-500"><Loader2 className="animate-spin mr-2" size={18} /> Loading...</div>;
  }

  if (!course) {
    return <div className="text-neutral-500">Course not found.</div>;
  }

  const hasSyllabus = materials.some((m) => m.material_type === "syllabus");

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <Link to="/courses" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-300 transition mb-4">
        <ArrowLeft size={14} /> Back to Courses
      </Link>
      <div className="flex items-center gap-3 mb-1">
        <div className="w-3 h-3 rounded-full" style={{ background: course.color }} />
        <span className="font-mono text-xs font-bold tracking-wider" style={{ color: course.color }}>{course.code}</span>
      </div>
      <h1 className="text-2xl font-bold mb-1">{course.name}</h1>
      <p className="text-sm text-neutral-500 mb-6">{course.professor} · {course.semester}</p>

      {/* AI Action Bar */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {hasSyllabus && (
          <button
            onClick={handleParseSyllabus}
            disabled={aiLoading === "parse"}
            className="flex items-center gap-2 font-mono text-[10px] font-bold tracking-wider px-4 py-2.5 rounded-lg border border-accent-yellow/30 bg-accent-yellow/10 text-accent-yellow hover:bg-accent-yellow/20 disabled:opacity-50 transition"
          >
            {aiLoading === "parse" ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            PARSE SYLLABUS
          </button>
        )}
        <button
          onClick={handleStudyGuide}
          disabled={aiLoading === "study" || materials.length === 0}
          className="flex items-center gap-2 font-mono text-[10px] font-bold tracking-wider px-4 py-2.5 rounded-lg border border-accent-cyan/30 bg-accent-cyan/10 text-accent-cyan hover:bg-accent-cyan/20 disabled:opacity-50 transition"
        >
          {aiLoading === "study" ? <Loader2 size={12} className="animate-spin" /> : <BookOpen size={12} />}
          GENERATE STUDY GUIDE
        </button>
      </div>

      {/* Materials */}
      <div className="mb-6">
        <h2 className="font-mono text-[10px] tracking-[2px] text-neutral-500 font-bold mb-3">
          UPLOADED MATERIALS ({materials.length})
        </h2>
        {materials.length === 0 ? (
          <div className="text-sm text-neutral-600">
            No materials uploaded yet. <Link to="/upload" className="text-accent-yellow hover:underline">Upload some →</Link>
          </div>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {materials.map((m) => (
              <div key={m.id} className="flex items-center gap-2 bg-white/[0.03] border border-border rounded-lg px-3 py-2">
                <FileText size={12} className="text-neutral-500" />
                <span className="text-xs text-neutral-400">{m.filename}</span>
                <span className="font-mono text-[9px] tracking-wider text-neutral-600 bg-white/[0.04] px-1.5 py-0.5 rounded">
                  {m.material_type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assignments */}
      <div>
        <h2 className="font-mono text-[10px] tracking-[2px] text-neutral-500 font-bold mb-3">
          ASSIGNMENTS ({assignments.length})
        </h2>
        {assignments.length === 0 ? (
          <div className="text-sm text-neutral-600">No assignments yet. Parse a syllabus or add manually.</div>
        ) : (
          <div className="space-y-2">
            {assignments.map((a) => {
              const isExpanded = expanded === a.id;
              const aSteps = steps[a.id] || [];
              const stepsDone = aSteps.filter((s) => s.is_done).length;
              return (
                <div key={a.id} className="bg-bg-card border border-border rounded-xl overflow-hidden">
                  {/* Assignment header */}
                  <button
                    onClick={() => handleExpand(a.id)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-neutral-200 truncate">{a.title}</div>
                      <div className="flex items-center gap-3 mt-1">
                        {a.due_date && (
                          <span className="font-mono text-[11px] text-neutral-600">
                            Due {new Date(a.due_date).toLocaleDateString()}
                          </span>
                        )}
                        {a.weight > 0 && (
                          <span className="font-mono text-[11px] text-neutral-600">{a.weight}%</span>
                        )}
                        {a.step_count > 0 && (
                          <span className="font-mono text-[11px] text-neutral-500">{a.steps_done}/{a.step_count} steps</span>
                        )}
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp size={14} className="text-neutral-500" /> : <ChevronDown size={14} className="text-neutral-500" />}
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="border-t border-border p-4">
                      {a.description && (
                        <p className="text-xs text-neutral-500 mb-3">{a.description}</p>
                      )}

                      {/* AI buttons */}
                      <div className="flex gap-2 mb-4">
                        <button
                          onClick={() => handleGenerateSteps(a.id)}
                          disabled={aiLoading === `steps-${a.id}`}
                          className="flex items-center gap-1.5 font-mono text-[9px] font-bold tracking-wider px-3 py-2 rounded-lg border border-accent-yellow/30 bg-accent-yellow/8 text-accent-yellow hover:bg-accent-yellow/15 disabled:opacity-50 transition"
                        >
                          {aiLoading === `steps-${a.id}` ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                          GENERATE STEPS
                        </button>
                        <button
                          onClick={() => handleGenerateDraft(a.id)}
                          disabled={aiLoading === `draft-${a.id}`}
                          className="flex items-center gap-1.5 font-mono text-[9px] font-bold tracking-wider px-3 py-2 rounded-lg border border-accent-pink/30 bg-accent-pink/8 text-accent-pink hover:bg-accent-pink/15 disabled:opacity-50 transition"
                        >
                          {aiLoading === `draft-${a.id}` ? <Loader2 size={10} className="animate-spin" /> : <Pencil size={10} />}
                          GENERATE DRAFT
                        </button>
                      </div>

                      {/* Steps list */}
                      {aSteps.length > 0 && (
                        <div className="space-y-1.5">
                          {aSteps.map((s) => (
                            <div
                              key={s.id}
                              onClick={() => handleToggleStep(s.id, s.is_done, a.id)}
                              className="flex items-start gap-3 py-2 px-2 rounded-lg cursor-pointer hover:bg-white/[0.02] transition"
                            >
                              <div className={`w-4 h-4 rounded flex-shrink-0 mt-0.5 flex items-center justify-center border transition
                                ${s.is_done ? "bg-accent-yellow border-accent-yellow" : "border-neutral-700"}`}
                              >
                                {s.is_done && <Check size={10} className="text-black" strokeWidth={3} />}
                              </div>
                              <span className={`text-[13px] leading-snug transition ${s.is_done ? "text-neutral-600 line-through" : "text-neutral-300"}`}>
                                {s.text}
                              </span>
                              <span className="font-mono text-[9px] text-neutral-700 ml-auto flex-shrink-0">{s.estimated_minutes}m</span>
                            </div>
                          ))}
                          <div className="text-xs text-neutral-600 font-mono mt-2 pt-2 border-t border-border">
                            {stepsDone}/{aSteps.length} complete · ~{aSteps.filter(s => !s.is_done).reduce((sum, s) => sum + s.estimated_minutes, 0)}m remaining
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Draft Modal */}
      {draft && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setDraft(null)}>
          <div className="bg-bg-card border border-border rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">Generated Draft</h2>
            <pre className="text-sm text-neutral-300 whitespace-pre-wrap font-sans leading-relaxed">{draft.draft}</pre>
            {draft.notes && (
              <div className="mt-4 p-3 bg-accent-yellow/5 border border-accent-yellow/20 rounded-lg text-xs text-neutral-400">
                <strong className="text-accent-yellow">Notes:</strong> {draft.notes}
              </div>
            )}
            <button onClick={() => setDraft(null)} className="mt-4 font-mono text-xs text-neutral-500 hover:text-neutral-300">Close</button>
          </div>
        </div>
      )}

      {/* Study Guide Modal */}
      {studyGuide && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setStudyGuide(null)}>
          <div className="bg-bg-card border border-border rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">{studyGuide.title}</h2>
            <pre className="text-sm text-neutral-300 whitespace-pre-wrap font-sans leading-relaxed">{studyGuide.content}</pre>
            <button onClick={() => setStudyGuide(null)} className="mt-4 font-mono text-xs text-neutral-500 hover:text-neutral-300">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
