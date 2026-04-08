import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, Sparkles, Loader2, FileText, Check, BookOpen,
  ChevronDown, ChevronUp, X, GraduationCap, FileCheck, Eye, Plus, Upload,
} from "lucide-react";
import {
  getCourse, getAssignments, getMaterials, getSteps, createAssignment,
  generateSteps, toggleStep, generateStudyGuide,
  generateHomeworkTurnin, generateHomeworkStudy, uploadMaterial,
} from "../api/client";

function Modal({ onClose, wide, children }) {
  return createPortal(
    <div onClick={onClose} style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999,
      background: "var(--modal-overlay)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: "100%", maxWidth: wide ? "720px" : "480px", maxHeight: "85vh", overflowY: "auto",
        background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px",
      }}>
        {children}
      </div>
    </div>,
    document.body
  );
}

export default function CoursePage() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [steps, setSteps] = useState({});
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(null);

  // Modals
  const [resultModal, setResultModal] = useState(null);
  const [showStudyGuideSetup, setShowStudyGuideSetup] = useState(false);
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [studyExamTitle, setStudyExamTitle] = useState("Midterm");
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [assignmentForm, setAssignmentForm] = useState({ title: "", description: "" });
  const [showUpload, setShowUpload] = useState(false);
  const [uploadType, setUploadType] = useState("slides");
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const [c, a, m] = await Promise.all([getCourse(id), getAssignments(id), getMaterials(id)]);
        setCourse(c); setAssignments(a); setMaterials(m);
        setSelectedMaterials(m.map((mat) => mat.id));
      } catch (err) { console.error(err); }
      setLoading(false);
    })();
  }, [id]);

  const loadSteps = async (aid) => {
    if (steps[aid]) return;
    try { const s = await getSteps(aid); setSteps((p) => ({ ...p, [aid]: s })); } catch {}
  };

  const handleExpand = (aid) => {
    if (expanded === aid) setExpanded(null);
    else { setExpanded(aid); loadSteps(aid); }
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

  const handleHomeworkTurnin = async (aid) => {
    setAiLoading(`turnin-${aid}`);
    try {
      const r = await generateHomeworkTurnin(aid);
      setResultModal({ title: "Turn-in Ready Submission", content: r.submission, notes: r.notes });
    } catch { setResultModal({ title: "Error", content: "Failed to generate." }); }
    setAiLoading(null);
  };

  const handleHomeworkStudy = async (aid) => {
    setAiLoading(`study-${aid}`);
    try {
      const r = await generateHomeworkStudy(aid);
      setResultModal({
        title: "Study Version (Step-by-Step)",
        content: r.study_version,
        notes: r.key_concepts?.length ? "Key concepts: " + r.key_concepts.join(", ") : "",
      });
    } catch { setResultModal({ title: "Error", content: "Failed to generate." }); }
    setAiLoading(null);
  };

  const handleStudyGuide = async () => {
    setShowStudyGuideSetup(false);
    setAiLoading("study-guide");
    try {
      const r = await generateStudyGuide(id, studyExamTitle, selectedMaterials);
      setResultModal({ title: r.title || `Study Guide: ${studyExamTitle}`, content: r.content });
    } catch { setResultModal({ title: "Error", content: "Failed to generate study guide." }); }
    setAiLoading(null);
  };

  const handleAddAssignment = async () => {
    if (!assignmentForm.title) return;
    try {
      await createAssignment(id, assignmentForm);
      const a = await getAssignments(id);
      setAssignments(a);
      setShowAddAssignment(false);
      setAssignmentForm({ title: "", description: "" });
    } catch {}
  };

  const handleUploadFiles = async (files) => {
    setUploading(true);
    for (const file of files) {
      try { await uploadMaterial(id, file, uploadType); } catch {}
    }
    const m = await getMaterials(id);
    setMaterials(m);
    setSelectedMaterials(m.map((mat) => mat.id));
    setUploading(false);
    setShowUpload(false);
    if (fileInput.current) fileInput.current.value = "";
  };

  const toggleMaterial = (matId) => {
    setSelectedMaterials((prev) =>
      prev.includes(matId) ? prev.filter((x) => x !== matId) : [...prev, matId]
    );
  };

  if (loading) return <div className="flex items-center justify-center h-64" style={{ color: "var(--text-muted)" }}><Loader2 className="animate-spin mr-2" size={18} /> Loading...</div>;
  if (!course) return <div style={{ color: "var(--text-muted)" }}>Course not found.</div>;

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

      {/* Main action */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setShowStudyGuideSetup(true)} disabled={aiLoading === "study-guide" || materials.length === 0}
          className="flex items-center gap-2 font-mono text-[10px] font-bold tracking-wider px-4 py-2.5 rounded-lg transition disabled:opacity-50"
          style={{ background: `rgba(var(--accent-rgb), 0.1)`, color: "var(--accent)", border: `1px solid var(--accent)` }}>
          {aiLoading === "study-guide" ? <Loader2 size={12} className="animate-spin" /> : <GraduationCap size={12} />}
          {aiLoading === "study-guide" ? "GENERATING..." : "STUDY GUIDE"}
        </button>
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left: Materials */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-mono text-[10px] tracking-[2px] font-bold" style={{ color: "var(--text-dim)" }}>
              MATERIALS ({materials.length})
            </h2>
            <button onClick={() => setShowUpload(true)} className="font-mono text-[9px] tracking-wider font-bold" style={{ color: "var(--accent)" }}>
              + UPLOAD
            </button>
          </div>
          {materials.length === 0 ? (
            <div className="rounded-xl p-6 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <FileText size={20} className="mx-auto mb-2" style={{ color: "var(--text-dim)" }} />
              <p className="text-xs" style={{ color: "var(--text-dim)" }}>No materials yet</p>
              <button onClick={() => setShowUpload(true)} className="text-xs mt-1" style={{ color: "var(--accent)" }}>Upload files →</button>
            </div>
          ) : (
            <div className="space-y-2">
              {materials.map((m) => (
                <div key={m.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                  <FileText size={13} style={{ color: "var(--text-dim)" }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs truncate" style={{ color: "var(--text)" }}>{m.filename}</div>
                    <div className="font-mono text-[9px]" style={{ color: "var(--text-dim)" }}>{m.material_type}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Assignments */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-mono text-[10px] tracking-[2px] font-bold" style={{ color: "var(--text-dim)" }}>
              ASSIGNMENTS ({assignments.length})
            </h2>
            <button onClick={() => setShowAddAssignment(true)} className="font-mono text-[9px] tracking-wider font-bold" style={{ color: "var(--accent)" }}>
              + ADD
            </button>
          </div>
          {assignments.length === 0 ? (
            <div className="rounded-xl p-6 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <Sparkles size={20} className="mx-auto mb-2" style={{ color: "var(--text-dim)" }} />
              <p className="text-xs" style={{ color: "var(--text-dim)" }}>No assignments yet</p>
              <button onClick={() => setShowAddAssignment(true)} className="text-xs mt-1" style={{ color: "var(--accent)" }}>Add one →</button>
            </div>
          ) : (
            <div className="space-y-2">
              {assignments.map((a) => {
                const isExp = expanded === a.id;
                const aSteps = steps[a.id] || [];
                return (
                  <div key={a.id} className="rounded-xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                    <button onClick={() => handleExpand(a.id)}
                      className="w-full flex items-center justify-between p-3.5 text-left transition" style={{ color: "var(--text)" }}>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{a.title}</div>
                        {a.due_date && <div className="font-mono text-[10px] mt-0.5" style={{ color: "var(--text-dim)" }}>Due {new Date(a.due_date).toLocaleDateString()}</div>}
                      </div>
                      {isExp ? <ChevronUp size={13} style={{ color: "var(--text-dim)" }} /> : <ChevronDown size={13} style={{ color: "var(--text-dim)" }} />}
                    </button>

                    {isExp && (
                      <div className="px-3.5 pb-3.5" style={{ borderTop: "1px solid var(--border)" }}>
                        {a.description && <p className="text-xs my-2.5" style={{ color: "var(--text-muted)" }}>{a.description}</p>}

                        <div className="flex gap-1.5 mb-3 mt-2 flex-wrap">
                          <button onClick={() => handleGenerateSteps(a.id)} disabled={!!aiLoading}
                            className="flex items-center gap-1 font-mono text-[8px] font-bold tracking-wider px-2.5 py-1.5 rounded-md transition disabled:opacity-50"
                            style={{ background: `rgba(var(--accent-rgb), 0.08)`, color: "var(--accent)", border: `1px solid var(--accent)` }}>
                            {aiLoading === `steps-${a.id}` ? <Loader2 size={9} className="animate-spin" /> : <Sparkles size={9} />} STEPS
                          </button>
                          <button onClick={() => handleHomeworkTurnin(a.id)} disabled={!!aiLoading}
                            className="flex items-center gap-1 font-mono text-[8px] font-bold tracking-wider px-2.5 py-1.5 rounded-md transition disabled:opacity-50"
                            style={{ background: "rgba(90,255,140,0.08)", color: "var(--accent-green)", border: "1px solid var(--accent-green)" }}>
                            {aiLoading === `turnin-${a.id}` ? <Loader2 size={9} className="animate-spin" /> : <FileCheck size={9} />} TURN-IN READY
                          </button>
                          <button onClick={() => handleHomeworkStudy(a.id)} disabled={!!aiLoading}
                            className="flex items-center gap-1 font-mono text-[8px] font-bold tracking-wider px-2.5 py-1.5 rounded-md transition disabled:opacity-50"
                            style={{ background: "rgba(90,240,255,0.08)", color: "var(--accent-secondary)", border: "1px solid var(--accent-secondary)" }}>
                            {aiLoading === `study-${a.id}` ? <Loader2 size={9} className="animate-spin" /> : <Eye size={9} />} STUDY VERSION
                          </button>
                        </div>

                        {aSteps.length > 0 && (
                          <div className="space-y-1">
                            {aSteps.map((s) => (
                              <div key={s.id} onClick={() => handleToggleStep(s.id, s.is_done, a.id)}
                                className="flex items-start gap-2.5 py-1.5 px-2 rounded-lg cursor-pointer transition"
                                onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                                <div className="w-3.5 h-3.5 rounded flex-shrink-0 mt-0.5 flex items-center justify-center transition"
                                  style={{ background: s.is_done ? "var(--accent)" : "transparent", border: s.is_done ? "none" : "1.5px solid var(--border-light)" }}>
                                  {s.is_done && <Check size={8} style={{ color: "var(--bg)" }} strokeWidth={3} />}
                                </div>
                                <span className="text-xs leading-snug flex-1"
                                  style={{ color: s.is_done ? "var(--text-dim)" : "var(--text)", textDecoration: s.is_done ? "line-through" : "none" }}>
                                  {s.text}
                                </span>
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
        </div>
      </div>

      {/* Add Assignment Modal */}
      {showAddAssignment && (
        <Modal onClose={() => setShowAddAssignment(false)}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>Add Assignment</h2>
            <button onClick={() => setShowAddAssignment(false)} style={{ color: "var(--text-muted)" }}><X size={18} /></button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="font-mono text-[10px] tracking-wider font-bold block mb-1.5" style={{ color: "var(--text-dim)" }}>TITLE</label>
              <input value={assignmentForm.title} onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                placeholder="HW5: Dynamic Programming Proofs"
                className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text)" }} />
            </div>
            <div>
              <label className="font-mono text-[10px] tracking-wider font-bold block mb-1.5" style={{ color: "var(--text-dim)" }}>
                DESCRIPTION / INSTRUCTIONS
              </label>
              <textarea value={assignmentForm.description} onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                placeholder="Paste the full assignment instructions here..."
                rows={6}
                className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none resize-none"
                style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text)" }} />
            </div>
          </div>
          <button onClick={handleAddAssignment} disabled={!assignmentForm.title}
            className="w-full mt-4 font-mono text-xs font-bold tracking-wider py-3 rounded-lg transition disabled:opacity-30"
            style={{ background: "var(--accent)", color: "var(--bg)" }}>
            ADD ASSIGNMENT
          </button>
        </Modal>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <Modal onClose={() => setShowUpload(false)}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>Upload Materials</h2>
            <button onClick={() => setShowUpload(false)} style={{ color: "var(--text-muted)" }}><X size={18} /></button>
          </div>
          <div className="mb-4">
            <label className="font-mono text-[10px] tracking-wider font-bold block mb-1.5" style={{ color: "var(--text-dim)" }}>TYPE</label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { value: "slides", label: "Slides" },
                { value: "textbook", label: "Textbook" },
                { value: "assignment", label: "Assignment" },
                { value: "syllabus", label: "Syllabus" },
                { value: "announcement", label: "Announcement" },
                { value: "other", label: "Other" },
              ].map((t) => (
                <button key={t.value} onClick={() => setUploadType(t.value)}
                  className="font-mono text-[10px] font-bold tracking-wider px-3 py-1.5 rounded-lg transition"
                  style={{
                    background: uploadType === t.value ? `rgba(var(--accent-rgb), 0.1)` : "var(--bg-hover)",
                    color: uploadType === t.value ? "var(--accent)" : "var(--text-muted)",
                    border: `1px solid ${uploadType === t.value ? "var(--accent)" : "var(--border)"}`,
                  }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div
            onClick={() => fileInput.current?.click()}
            className="rounded-xl p-8 text-center cursor-pointer transition"
            style={{ border: "2px dashed var(--border)" }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length) handleUploadFiles(Array.from(e.dataTransfer.files)); }}>
            {uploading ? (
              <Loader2 size={24} className="animate-spin mx-auto mb-2" style={{ color: "var(--accent)" }} />
            ) : (
              <Upload size={24} className="mx-auto mb-2" style={{ color: "var(--text-dim)" }} />
            )}
            <p className="text-sm" style={{ color: uploading ? "var(--accent)" : "var(--text)" }}>
              {uploading ? "Uploading..." : "Drop files or click to browse"}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-dim)" }}>PDF, PPTX, TXT, MD</p>
          </div>
          <input ref={fileInput} type="file" multiple accept=".pdf,.pptx,.txt,.md,.doc,.docx" className="hidden"
            onChange={(e) => { if (e.target.files.length) handleUploadFiles(Array.from(e.target.files)); }} />
        </Modal>
      )}

      {/* Study Guide Setup Modal */}
      {showStudyGuideSetup && (
        <Modal onClose={() => setShowStudyGuideSetup(false)}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>Generate Study Guide</h2>
            <button onClick={() => setShowStudyGuideSetup(false)} style={{ color: "var(--text-muted)" }}><X size={18} /></button>
          </div>
          <div className="mb-4">
            <label className="font-mono text-[10px] tracking-wider font-bold block mb-1.5" style={{ color: "var(--text-dim)" }}>EXAM NAME</label>
            <input value={studyExamTitle} onChange={(e) => setStudyExamTitle(e.target.value)}
              placeholder="Midterm 1, Final Exam, etc."
              className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text)" }} />
          </div>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="font-mono text-[10px] tracking-wider font-bold" style={{ color: "var(--text-dim)" }}>
                MATERIALS ({selectedMaterials.length}/{materials.length})
              </label>
              <button onClick={() => setSelectedMaterials(
                selectedMaterials.length === materials.length ? [] : materials.map((m) => m.id)
              )} className="font-mono text-[9px] tracking-wider font-bold" style={{ color: "var(--accent)" }}>
                {selectedMaterials.length === materials.length ? "DESELECT ALL" : "SELECT ALL"}
              </button>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {materials.map((m) => {
                const sel = selectedMaterials.includes(m.id);
                return (
                  <div key={m.id} onClick={() => toggleMaterial(m.id)}
                    className="flex items-center gap-3 py-2 px-3 rounded-lg cursor-pointer transition"
                    style={{ background: sel ? `rgba(var(--accent-rgb), 0.06)` : "transparent", border: `1px solid ${sel ? "var(--accent)" : "var(--border)"}` }}>
                    <div className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center"
                      style={{ background: sel ? "var(--accent)" : "transparent", border: sel ? "none" : "1.5px solid var(--border-light)" }}>
                      {sel && <Check size={10} style={{ color: "var(--bg)" }} strokeWidth={3} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs truncate" style={{ color: "var(--text)" }}>{m.filename}</div>
                      <div className="font-mono text-[9px]" style={{ color: "var(--text-dim)" }}>{m.material_type}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <button onClick={handleStudyGuide} disabled={selectedMaterials.length === 0}
            className="w-full font-mono text-xs font-bold tracking-wider py-3 rounded-lg transition disabled:opacity-30"
            style={{ background: "var(--accent)", color: "var(--bg)" }}>
            GENERATE STUDY GUIDE
          </button>
        </Modal>
      )}

      {/* Result Modal */}
      {resultModal && (
        <Modal onClose={() => setResultModal(null)} wide>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>{resultModal.title}</h2>
            <button onClick={() => setResultModal(null)} style={{ color: "var(--text-muted)" }}><X size={18} /></button>
          </div>
          <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed" style={{ color: "var(--text)" }}>
            {resultModal.content}
          </pre>
          {resultModal.notes && (
            <div className="mt-4 p-3 rounded-lg text-xs"
              style={{ background: `rgba(var(--accent-rgb), 0.05)`, border: `1px solid var(--accent)`, color: "var(--text-muted)" }}>
              <strong style={{ color: "var(--accent)" }}>Notes:</strong> {resultModal.notes}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
