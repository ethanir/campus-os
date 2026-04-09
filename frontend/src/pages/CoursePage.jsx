import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, Sparkles, Loader2, FileText, Check, BookOpen,
  ChevronDown, ChevronUp, X, GraduationCap, FileCheck, Eye, Upload, Trash2, Crown,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import {
  getCourse, getAssignments, getMaterials, getSteps, uploadAssignment,
  generateSteps, toggleStep, generateStudyGuide, getContextUsage, getGenerations, deleteGeneration,
  generateHomeworkTurnin, generateHomeworkStudy, uploadMaterial,
  deleteMaterial, deleteAssignment, updateAssignmentContext,
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
      }}>{children}</div>
    </div>, document.body
  );
}

export default function CoursePage() {
  const { id } = useParams();
  const { user, refreshUser } = useAuth();
  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [steps, setSteps] = useState({});
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(null);
  const [resultModal, setResultModal] = useState(null);
  const [showStudyGuideSetup, setShowStudyGuideSetup] = useState(false);
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [uploadingAssignment, setUploadingAssignment] = useState(false);
  const [studyExamTitle, setStudyExamTitle] = useState("Midterm");
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadType, setUploadType] = useState("slides");
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [contextUsage, setContextUsage] = useState(null);
  const [generations, setGenerations] = useState([]);
  const fileInput = useRef(null);
  const assignmentInput = useRef(null);
  const [editingContext, setEditingContext] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const [c, a, m] = await Promise.all([getCourse(id), getAssignments(id), getMaterials(id)]); try { const ctx = await getContextUsage(id); setContextUsage(ctx); } catch {} try { const g = await getGenerations(id); setGenerations(g); } catch {}
        setCourse(c); setAssignments(a); setMaterials(m);
        setSelectedMaterials(m.map((mat) => mat.id));
      } catch (err) { console.error(err); }
      setLoading(false);
    })();
  }, [id]);

  const loadSteps = async (aid) => { if (!steps[aid]) try { const s = await getSteps(aid); setSteps((p) => ({ ...p, [aid]: s })); } catch {} };
  const handleExpand = (aid) => { if (expanded === aid) setExpanded(null); else { setExpanded(aid); loadSteps(aid); } };
  const handleToggleStep = async (sid, done, aid) => { try { await toggleStep(sid, !done); setSteps((p) => ({ ...p, [aid]: p[aid].map((s) => s.id === sid ? { ...s, is_done: !done } : s) })); } catch {} };
  const toggleMaterial = (matId) => setSelectedMaterials((prev) => prev.includes(matId) ? prev.filter((x) => x !== matId) : [...prev, matId]);

  // AI calls with credit refresh
  const aiCall = async (key, fn) => {
    setAiLoading(key);
    try { const r = await fn(); refreshUser(); getGenerations(id).then(setGenerations).catch(() => {}); return r; }
    catch (err) {
      const detail = err.response?.data?.detail || "Failed";
      setResultModal({ title: "Error", content: detail });
      return null;
    }
    finally { setAiLoading(null); }
  };

  const handleGenerateSteps = async (aid) => {
    await aiCall(`steps-${aid}`, async () => { await generateSteps(aid); const s = await getSteps(aid); setSteps((p) => ({ ...p, [aid]: s })); });
  };
  const handleHomeworkTurnin = (aid) => aiCall(`turnin-${aid}`, () => generateHomeworkTurnin(aid)).then(r => r && setResultModal({ title: "Turn-in Ready Submission", content: r.submission, notes: r.notes }));
  const handleHomeworkStudy = (aid) => aiCall(`study-${aid}`, () => generateHomeworkStudy(aid)).then(r => r && setResultModal({ title: "Study Version (Step-by-Step)", content: r.study_version, notes: r.key_concepts?.length ? "Key concepts: " + r.key_concepts.join(", ") : "" }));
  const handleStudyGuide = async () => {
    setShowStudyGuideSetup(false);
    const r = await aiCall("study-guide", () => generateStudyGuide(id, studyExamTitle, selectedMaterials));
    if (r) setResultModal({ title: r.title || `Study Guide: ${studyExamTitle}`, content: r.content });
  };

  const handleUploadFiles = async (files) => {
    setUploading(true);
    for (const file of files) try { await uploadMaterial(id, file, uploadType); } catch {}
    const m = await getMaterials(id); setMaterials(m); setSelectedMaterials(m.map((mat) => mat.id)); getContextUsage(id).then(setContextUsage).catch(() => {});
    setUploading(false); setShowUpload(false);
    if (fileInput.current) fileInput.current.value = "";
  };
  const handleUploadAssignment = async (files) => {
    setUploadingAssignment(true);
    for (const file of files) try { await uploadAssignment(id, file); } catch {}
    const [a, m] = await Promise.all([getAssignments(id), getMaterials(id)]);
    setAssignments(a); setMaterials(m); setSelectedMaterials(m.map((mat) => mat.id));
    setUploadingAssignment(false); setShowAddAssignment(false); getContextUsage(id).then(setContextUsage).catch(() => {});
    if (assignmentInput.current) assignmentInput.current.value = "";
  };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "material") { await deleteMaterial(id, deleteTarget.id); const m = await getMaterials(id); setMaterials(m); setSelectedMaterials(m.map((mat) => mat.id)); getContextUsage(id).then(setContextUsage).catch(() => {}); }
      else { await deleteAssignment(deleteTarget.id); setAssignments(await getAssignments(id)); }
    } catch {}
    setDeleteTarget(null);
  };

  if (loading) return <div className="flex items-center justify-center h-64" style={{ color: "var(--text-muted)" }}><Loader2 className="animate-spin mr-2" size={18} /> Loading...</div>;
  if (!course) return <div style={{ color: "var(--text-muted)" }}>Course not found.</div>;

  return (
    <div className="animate-fade-up">
      <Link to="/courses" className="inline-flex items-center gap-1.5 text-sm transition mb-4" style={{ color: "var(--text-muted)", textDecoration: "none" }}><ArrowLeft size={14} /> Back</Link>
      <div className="flex items-center gap-3 mb-1">
        <div className="w-3 h-3 rounded-full" style={{ background: course.color }} />
        <span className="font-mono text-xs font-bold tracking-wider" style={{ color: course.color }}>{course.code}</span>
      </div>
      <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text)" }}>{course.name}</h1>
      <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>{course.professor}</p>

      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setShowStudyGuideSetup(true)} disabled={aiLoading === "study-guide" || materials.length === 0}
          className="flex items-center gap-2 font-mono text-[10px] font-bold tracking-wider px-4 py-2.5 rounded-lg transition disabled:opacity-50"
          style={{ background: `rgba(var(--accent-rgb), 0.1)`, color: "var(--accent)", border: `1px solid var(--accent)` }}>
          {aiLoading === "study-guide" ? <Loader2 size={12} className="animate-spin" /> : <GraduationCap size={12} />}
          {aiLoading === "study-guide" ? "GENERATING..." : "STUDY GUIDE"}
          <span className="opacity-60">1 credit</span>
        </button>
        <span className="font-mono text-[8px] font-bold tracking-wider px-2 py-1 rounded-md" style={{
          background: user?.has_purchased ? `rgba(var(--accent-rgb), 0.1)` : "var(--bg-hover)",
          color: user?.has_purchased ? "var(--accent)" : "var(--text-dim)",
          border: `1px solid ${user?.has_purchased ? "var(--accent)" : "var(--border)"}`,
        }}>
          {user?.has_purchased ? "⚡ PREMIUM AI" : "STANDARD AI"}
        </span>
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-2 gap-6">
        {/* Materials */}
        <div>
          <div className="flex justify-between items-center mb-3">
          {contextUsage && contextUsage.used_pct > 0 && (
            <div className="mb-4 rounded-xl p-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="flex justify-between items-center mb-1.5">
                <span className="font-mono text-[9px] tracking-wider font-bold" style={{ color: "var(--text-dim)" }}>AI CONTEXT USAGE</span>
                <span className="font-mono text-[9px]" style={{ color: contextUsage.used_pct > 80 ? "var(--accent-red)" : "var(--accent)" }}>{contextUsage.used_pct}% · {Math.round(contextUsage.used_chars / 1000)}k / {Math.round(contextUsage.max_chars / 1000)}k chars</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: "var(--border)", overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 2, width: `${Math.min(contextUsage.used_pct, 100)}%`, background: contextUsage.used_pct > 80 ? "var(--accent-red)" : "var(--accent)", transition: "width 0.3s" }} />
              </div>
            </div>
          )}
            <h2 className="font-mono text-[10px] tracking-[2px] font-bold" style={{ color: "var(--text-dim)" }}>MATERIALS ({materials.length})</h2>
            <button onClick={() => setShowUpload(true)} className="font-mono text-[9px] tracking-wider font-bold" style={{ color: "var(--accent)" }}>+ UPLOAD</button>
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
                <div key={m.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5 group" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                  <FileText size={13} style={{ color: "var(--text-dim)" }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs truncate" style={{ color: "var(--text)" }}>{m.filename}</div>
                    <div className="font-mono text-[9px]" style={{ color: "var(--text-dim)" }}>{m.material_type}</div>
                  </div>
                  <button onClick={() => setDeleteTarget({ type: "material", id: m.id, name: m.filename })} className="p-1 rounded opacity-0 group-hover:opacity-100 transition" style={{ color: "var(--accent-red)" }}><Trash2 size={12} /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assignments */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-mono text-[10px] tracking-[2px] font-bold" style={{ color: "var(--text-dim)" }}>ASSIGNMENTS ({assignments.length})</h2>
            <button onClick={() => setShowAddAssignment(true)} className="font-mono text-[9px] tracking-wider font-bold" style={{ color: "var(--accent)" }}>+ ADD</button>
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
                  <div key={a.id} className="rounded-xl overflow-hidden group" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                    <div className="flex items-center p-3.5">
                      <button onClick={() => handleExpand(a.id)} className="flex-1 flex items-center text-left min-w-0" style={{ color: "var(--text)" }}>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{a.title}</div>
                          {a.due_date && <div className="font-mono text-[10px] mt-0.5" style={{ color: "var(--text-dim)" }}>Due {new Date(a.due_date).toLocaleDateString()}</div>}
                        </div>
                      </button>
                      <button onClick={() => setDeleteTarget({ type: "assignment", id: a.id, name: a.title })} className="p-1 rounded opacity-0 group-hover:opacity-100 transition mr-1" style={{ color: "var(--accent-red)" }}><Trash2 size={12} /></button>
                      <button onClick={() => handleExpand(a.id)}>{isExp ? <ChevronUp size={13} style={{ color: "var(--text-dim)" }} /> : <ChevronDown size={13} style={{ color: "var(--text-dim)" }} />}</button>
                    </div>
                    {isExp && (
                      <div className="px-3.5 pb-3.5" style={{ borderTop: "1px solid var(--border)" }}>
                        <div className="flex gap-1.5 mb-3 mt-2 flex-wrap">
                          <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-mono text-[9px] tracking-wider font-bold" style={{ color: "var(--text-dim)" }}>ADDITIONAL CONTEXT</label>
                        <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>Describe figures, images, or special instructions</span>
                      </div>
                      <textarea
                        value={editingContext[a.id] !== undefined ? editingContext[a.id] : (a.context_notes || "")}
                        onChange={(e) => setEditingContext(p => ({...p, [a.id]: e.target.value}))}
                        onBlur={async () => {
                          const val = editingContext[a.id];
                          if (val !== undefined && val !== (a.context_notes || "")) {
                            await updateAssignmentContext(a.id, val);
                            setAssignments(prev => prev.map(x => x.id === a.id ? {...x, context_notes: val} : x));
                          }
                        }}
                        placeholder="e.g. Fig 1.3(a) is a 4-cycle graph (C₄). Fig 1.3(b) is a star graph K₁,₃ with center node connected to 3 leaves..."
                        className="w-full rounded-lg px-3 py-2 text-xs focus:outline-none resize-none"
                        rows={2}
                        style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text)", lineHeight: 1.5 }}
                      />
                    </div>
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
                                <span className="text-xs leading-snug flex-1" style={{ color: s.is_done ? "var(--text-dim)" : "var(--text)", textDecoration: s.is_done ? "line-through" : "none" }}>{s.text}</span>
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
              {[{ v: "slides", l: "Slides" }, { v: "textbook", l: "Textbook" }, { v: "assignment", l: "Assignment" }, { v: "syllabus", l: "Syllabus" }, { v: "announcement", l: "Announcement" }, { v: "other", l: "Other" }].map((t) => (
                <button key={t.v} onClick={() => setUploadType(t.v)} className="font-mono text-[10px] font-bold tracking-wider px-3 py-1.5 rounded-lg transition"
                  style={{ background: uploadType === t.v ? `rgba(var(--accent-rgb), 0.1)` : "var(--bg-hover)", color: uploadType === t.v ? "var(--accent)" : "var(--text-muted)", border: `1px solid ${uploadType === t.v ? "var(--accent)" : "var(--border)"}` }}>{t.l}</button>
              ))}
            </div>
          </div>
          <div onClick={() => fileInput.current?.click()} className="rounded-xl p-8 text-center cursor-pointer transition" style={{ border: "2px dashed var(--border)" }}
            onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length) handleUploadFiles(Array.from(e.dataTransfer.files)); }}>
            {uploading ? <Loader2 size={24} className="animate-spin mx-auto mb-2" style={{ color: "var(--accent)" }} /> : <Upload size={24} className="mx-auto mb-2" style={{ color: "var(--text-dim)" }} />}
            <p className="text-sm" style={{ color: uploading ? "var(--accent)" : "var(--text)" }}>{uploading ? "Uploading..." : "Drop files or click to browse"}</p>
          </div>
          <input ref={fileInput} type="file" multiple accept=".pdf,.pptx,.txt,.md,.doc,.docx" className="hidden" onChange={(e) => { if (e.target.files.length) handleUploadFiles(Array.from(e.target.files)); }} />
        </Modal>
      )}

      {/* Upload Assignment Modal */}
      {showAddAssignment && (
        <Modal onClose={() => setShowAddAssignment(false)}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>Upload Assignment</h2>
            <button onClick={() => setShowAddAssignment(false)} style={{ color: "var(--text-muted)" }}><X size={18} /></button>
          </div>
          <div onClick={() => assignmentInput.current?.click()} className="rounded-xl p-8 text-center cursor-pointer transition" style={{ border: "2px dashed var(--border)" }}
            onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length) handleUploadAssignment(Array.from(e.dataTransfer.files)); }}>
            {uploadingAssignment ? <Loader2 size={24} className="animate-spin mx-auto mb-2" style={{ color: "var(--accent)" }} /> : <Upload size={24} className="mx-auto mb-2" style={{ color: "var(--text-dim)" }} />}
            <p className="text-sm" style={{ color: uploadingAssignment ? "var(--accent)" : "var(--text)" }}>{uploadingAssignment ? "Uploading..." : "Drop assignment file or click"}</p>
          </div>
          <input ref={assignmentInput} type="file" multiple accept=".pdf,.pptx,.txt,.md,.doc,.docx" className="hidden" onChange={(e) => { if (e.target.files.length) handleUploadAssignment(Array.from(e.target.files)); }} />
        </Modal>
      )}

      {/* Study Guide Setup */}
      {showStudyGuideSetup && (
        <Modal onClose={() => setShowStudyGuideSetup(false)}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>Generate Study Guide</h2>
            <button onClick={() => setShowStudyGuideSetup(false)} style={{ color: "var(--text-muted)" }}><X size={18} /></button>
          </div>
          <div className="mb-4">
            <label className="font-mono text-[10px] tracking-wider font-bold block mb-1.5" style={{ color: "var(--text-dim)" }}>EXAM NAME</label>
            <input value={studyExamTitle} onChange={(e) => setStudyExamTitle(e.target.value)} placeholder="Midterm 1, Final Exam..."
              className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text)" }} />
          </div>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="font-mono text-[10px] tracking-wider font-bold" style={{ color: "var(--text-dim)" }}>MATERIALS ({selectedMaterials.length}/{materials.length})</label>
              <button onClick={() => setSelectedMaterials(selectedMaterials.length === materials.length ? [] : materials.map((m) => m.id))} className="font-mono text-[9px] tracking-wider font-bold" style={{ color: "var(--accent)" }}>
                {selectedMaterials.length === materials.length ? "DESELECT ALL" : "SELECT ALL"}
              </button>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {materials.map((m) => {
                const sel = selectedMaterials.includes(m.id);
                return (
                  <div key={m.id} onClick={() => toggleMaterial(m.id)} className="flex items-center gap-3 py-2 px-3 rounded-lg cursor-pointer transition"
                    style={{ background: sel ? `rgba(var(--accent-rgb), 0.06)` : "transparent", border: `1px solid ${sel ? "var(--accent)" : "var(--border)"}` }}>
                    <div className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center" style={{ background: sel ? "var(--accent)" : "transparent", border: sel ? "none" : "1.5px solid var(--border-light)" }}>
                      {sel && <Check size={10} style={{ color: "var(--bg)" }} strokeWidth={3} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs truncate" style={{ color: "var(--text)" }}>{m.filename}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <button onClick={handleStudyGuide} disabled={selectedMaterials.length === 0}
            className="w-full font-mono text-xs font-bold tracking-wider py-3 rounded-lg transition disabled:opacity-30"
            style={{ background: "var(--accent)", color: "var(--bg)" }}>GENERATE (1 credit)</button>
        </Modal>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <Modal onClose={() => setDeleteTarget(null)}>
          <h2 className="text-lg font-bold mb-2" style={{ color: "var(--text)" }}>Delete {deleteTarget.type === "material" ? "Material" : "Assignment"}</h2>
          <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>Delete <strong style={{ color: "var(--text)" }}>{deleteTarget.name}</strong>?</p>
          <div className="flex gap-2">
            <button onClick={() => setDeleteTarget(null)} className="flex-1 font-mono text-xs font-bold py-2.5 rounded-lg" style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}>CANCEL</button>
            <button onClick={handleDelete} className="flex-1 font-mono text-xs font-bold py-2.5 rounded-lg" style={{ background: "var(--accent-red)", color: "#fff" }}>DELETE</button>
          </div>
        </Modal>
      )}

      {/* Result Modal */}
      {resultModal && (
        <Modal onClose={() => setResultModal(null)} wide>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>{resultModal.title}</h2>
            <button onClick={() => setResultModal(null)} style={{ color: "var(--text-muted)" }}><X size={18} /></button>
          </div>
          <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed" style={{ color: "var(--text)" }}>{resultModal.content}</pre>
          {resultModal.notes && (
            <div className="mt-4 p-3 rounded-lg text-xs" style={{ background: `rgba(var(--accent-rgb), 0.05)`, border: `1px solid var(--accent)`, color: "var(--text-muted)" }}>
              <strong style={{ color: "var(--accent)" }}>Notes:</strong> {resultModal.notes}
            </div>
          )}
        </Modal>
      )}

      {/* Saved AI Results */}
      {generations.length > 0 && (
        <div className="mt-6">
          <h2 className="font-mono text-[10px] tracking-[2px] font-bold mb-3" style={{ color: "var(--text-dim)" }}>AI GENERATIONS ({generations.length})</h2>
          <div className="space-y-2">
            {generations.map((g) => (
              <div key={g.id} className="rounded-xl p-4 cursor-pointer transition" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                onClick={() => { try { const parsed = JSON.parse(g.content); setResultModal({ title: g.title, content: parsed.submission || parsed.study_version || parsed.draft || parsed.content || JSON.stringify(parsed, null, 2), notes: typeof g.notes === "string" ? g.notes : "" }); } catch { setResultModal({ title: g.title, content: g.content, notes: g.notes || "" }); } }}>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-mono text-[9px] tracking-wider font-bold px-2 py-0.5 rounded mr-2" style={{ background: `rgba(var(--accent-rgb), 0.1)`, color: "var(--accent)" }}>{g.gen_type.toUpperCase()}</span>
                    <span className="text-sm font-medium" style={{ color: "var(--text)" }}>{g.title}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs" style={{ color: "var(--text-dim)" }}>{new Date(g.created_at).toLocaleDateString()}</span>
                    <button onClick={(e) => { e.stopPropagation(); deleteGeneration(g.id).then(() => setGenerations((prev) => prev.filter((x) => x.id !== g.id))); }} className="text-xs" style={{ color: "var(--text-dim)" }}>✕</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
