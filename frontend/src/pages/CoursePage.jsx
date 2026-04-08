import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Sparkles, Loader2, FileText, Check, BookOpen, ChevronDown, ChevronUp, Pencil, X } from "lucide-react";
import { getCourse, getAssignments, getMaterials, getSteps, generateSteps, toggleStep, parseSyllabus, generateDraft, generateStudyGuide } from "../api/client";

export default function CoursePage() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [steps, setSteps] = useState({});
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(null);
  const [draft, setDraft] = useState(null);
  const [studyGuide, setStudyGuide] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [c, a, m] = await Promise.all([getCourse(id), getAssignments(id), getMaterials(id)]);
        setCourse(c); setAssignments(a); setMaterials(m);
      } catch (err) { console.error(err); }
      setLoading(false);
    })();
  }, [id]);

  const loadSteps = async (aid) => {
    if (steps[aid]) return;
    try { const s = await getSteps(aid); setSteps((p) => ({ ...p, [aid]: s })); } catch {}
  };

  const handleExpand = (aid) => {
    if (expanded === aid) { setExpanded(null); } else { setExpanded(aid); loadSteps(aid); }
  };

  const handleGenerateSteps = async (aid) => {
    setAiLoading(`steps-${aid}`);
    try { await generateSteps(aid); const s = await getSteps(aid); setSteps((p) => ({ ...p, [aid]: s })); } catch {}
    setAiLoading(null);
  };

  const handleToggleStep = async (sid, done, aid) => {
    try {
      await toggleStep(sid, !done);
      setSteps((p) => ({ ...p, [aid]: p[aid].map((s) => s.id === sid ? { ...s, is_done: !done } : s) }));
    } catch {}
  };

  const handleParseSyllabus = async () => {
    setAiLoading("parse");
    try {
      const r = await parseSyllabus(id);
      const a = await getAssignments(id); setAssignments(a);
      alert(`Parsed ${r.assignments?.length || 0} assignments!`);
    } catch (err) { alert(err.response?.data?.detail || "Failed"); }
    setAiLoading(null);
  };

  const handleDraft = async (aid) => {
    setAiLoading(`draft-${aid}`);
    try { const r = await generateDraft(aid); setDraft(r); } catch {}
    setAiLoading(null);
  };

  const handleStudy = async () => {
    setAiLoading("study");
    try { const r = await generateStudyGuide(id, "Exam"); setStudyGuide(r); } catch {}
    setAiLoading(null);
  };

  if (loading) return <div className="flex items-center justify-center h-64" style={{ color: "var(--text-muted)" }}><Loader2 className="animate-spin mr-2" size={18} /> Loading...</div>;
  if (!course) return <div style={{ color: "var(--text-muted)" }}>Course not found.</div>;

  const hasSyllabus = materials.some((m) => m.material_type === "syllabus");

  return (
    <div className="animate-fade-up">
      <Link to="/courses" className="inline-flex items-center gap-1.5 text-sm transition mb-4" style={{ color: "var(--text-muted)" }}>
        <ArrowLeft size={14} /> Back
      </Link>

      <div className="flex items-center gap-3 mb-1">
        <div className="w-3 h-3 rounded-full" style={{ background: course.color }} />
        <span className="font-mono text-xs font-bold tracking-wider" style={{ color: course.color }}>{course.code}</span>
      </div>
      <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text)" }}>{course.name}</h1>
      <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>{course.professor}</p>

      {/* AI Actions */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {hasSyllabus && (
          <button onClick={handleParseSyllabus} disabled={aiLoading === "parse"}
            className="flex items-center gap-2 font-mono text-[10px] font-bold tracking-wider px-4 py-2.5 rounded-lg transition disabled:opacity-50"
            style={{ background: `rgba(var(--accent-rgb), 0.1)`, color: "var(--accent)", border: `1px solid var(--accent)` }}>
            {aiLoading === "parse" ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} PARSE SYLLABUS
          </button>
        )}
        <button onClick={handleStudy} disabled={aiLoading === "study" || materials.length === 0}
          className="flex items-center gap-2 font-mono text-[10px] font-bold tracking-wider px-4 py-2.5 rounded-lg transition disabled:opacity-50"
          style={{ background: "rgba(90,240,255,0.1)", color: "var(--accent-secondary)", border: "1px solid var(--accent-secondary)" }}>
          {aiLoading === "study" ? <Loader2 size={12} className="animate-spin" /> : <BookOpen size={12} />} STUDY GUIDE
        </button>
      </div>

      {/* Materials */}
      <div className="mb-6">
        <h2 className="font-mono text-[10px] tracking-[2px] font-bold mb-3" style={{ color: "var(--text-dim)" }}>
          MATERIALS ({materials.length})
        </h2>
        {materials.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-dim)" }}>
            No materials yet. <Link to="/upload" style={{ color: "var(--accent)" }}>Upload some →</Link>
          </p>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {materials.map((m) => (
              <div key={m.id} className="flex items-center gap-2 rounded-lg px-3 py-2"
                style={{ background: "var(--bg-hover)", border: "1px solid var(--border)" }}>
                <FileText size={12} style={{ color: "var(--text-dim)" }} />
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{m.filename}</span>
                <span className="font-mono text-[9px] tracking-wider px-1.5 py-0.5 rounded"
                  style={{ background: "var(--bg-card)", color: "var(--text-dim)" }}>{m.material_type}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assignments */}
      <h2 className="font-mono text-[10px] tracking-[2px] font-bold mb-3" style={{ color: "var(--text-dim)" }}>
        ASSIGNMENTS ({assignments.length})
      </h2>
      {assignments.length === 0 ? (
        <div className="rounded-xl p-8 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <p className="text-sm" style={{ color: "var(--text-dim)" }}>No assignments yet. Parse a syllabus or add manually.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {assignments.map((a) => {
            const isExp = expanded === a.id;
            const aSteps = steps[a.id] || [];
            return (
              <div key={a.id} className="rounded-xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <button onClick={() => handleExpand(a.id)}
                  className="w-full flex items-center justify-between p-4 text-left transition"
                  style={{ color: "var(--text)" }}>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{a.title}</div>
                    <div className="flex items-center gap-3 mt-1">
                      {a.due_date && <span className="font-mono text-[11px]" style={{ color: "var(--text-dim)" }}>Due {new Date(a.due_date).toLocaleDateString()}</span>}
                      {a.weight > 0 && <span className="font-mono text-[11px]" style={{ color: "var(--text-dim)" }}>{a.weight}%</span>}
                    </div>
                  </div>
                  {isExp ? <ChevronUp size={14} style={{ color: "var(--text-dim)" }} /> : <ChevronDown size={14} style={{ color: "var(--text-dim)" }} />}
                </button>

                {isExp && (
                  <div className="p-4" style={{ borderTop: "1px solid var(--border)" }}>
                    {a.description && <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>{a.description}</p>}

                    <div className="flex gap-2 mb-4">
                      <button onClick={() => handleGenerateSteps(a.id)} disabled={aiLoading === `steps-${a.id}`}
                        className="flex items-center gap-1.5 font-mono text-[9px] font-bold tracking-wider px-3 py-2 rounded-lg transition disabled:opacity-50"
                        style={{ background: `rgba(var(--accent-rgb), 0.08)`, color: "var(--accent)", border: `1px solid var(--accent)` }}>
                        {aiLoading === `steps-${a.id}` ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />} GENERATE STEPS
                      </button>
                      <button onClick={() => handleDraft(a.id)} disabled={aiLoading === `draft-${a.id}`}
                        className="flex items-center gap-1.5 font-mono text-[9px] font-bold tracking-wider px-3 py-2 rounded-lg transition disabled:opacity-50"
                        style={{ background: "rgba(255,90,138,0.08)", color: "var(--accent-pink)", border: "1px solid var(--accent-pink)" }}>
                        {aiLoading === `draft-${a.id}` ? <Loader2 size={10} className="animate-spin" /> : <Pencil size={10} />} GENERATE DRAFT
                      </button>
                    </div>

                    {aSteps.length > 0 && (
                      <div className="space-y-1">
                        {aSteps.map((s) => (
                          <div key={s.id} onClick={() => handleToggleStep(s.id, s.is_done, a.id)}
                            className="flex items-start gap-3 py-2 px-2 rounded-lg cursor-pointer transition"
                            style={{ background: "transparent" }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                            <div className="w-4 h-4 rounded flex-shrink-0 mt-0.5 flex items-center justify-center transition"
                              style={{
                                background: s.is_done ? "var(--accent)" : "transparent",
                                border: s.is_done ? "none" : "1.5px solid var(--border-light)",
                              }}>
                              {s.is_done && <Check size={10} style={{ color: "var(--bg)" }} strokeWidth={3} />}
                            </div>
                            <span className="text-[13px] leading-snug flex-1"
                              style={{ color: s.is_done ? "var(--text-dim)" : "var(--text)", textDecoration: s.is_done ? "line-through" : "none" }}>
                              {s.text}
                            </span>
                            <span className="font-mono text-[9px] ml-auto flex-shrink-0" style={{ color: "var(--text-dim)" }}>{s.estimated_minutes}m</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Draft Modal */}
      {draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "var(--modal-overlay)" }} onClick={() => setDraft(null)}>
          <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl p-6 animate-fade-up"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>Generated Draft</h2>
              <button onClick={() => setDraft(null)} style={{ color: "var(--text-muted)" }}><X size={18} /></button>
            </div>
            <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed" style={{ color: "var(--text)" }}>{draft.draft}</pre>
            {draft.notes && (
              <div className="mt-4 p-3 rounded-lg text-xs"
                style={{ background: `rgba(var(--accent-rgb), 0.05)`, border: `1px solid var(--accent)`, color: "var(--text-muted)" }}>
                <strong style={{ color: "var(--accent)" }}>Notes:</strong> {draft.notes}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Study Guide Modal */}
      {studyGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "var(--modal-overlay)" }} onClick={() => setStudyGuide(null)}>
          <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl p-6 animate-fade-up"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>{studyGuide.title}</h2>
              <button onClick={() => setStudyGuide(null)} style={{ color: "var(--text-muted)" }}><X size={18} /></button>
            </div>
            <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed" style={{ color: "var(--text)" }}>{studyGuide.content}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
