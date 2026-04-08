import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { Plus, ChevronRight, X, BookOpen, Upload, Sparkles, Camera, Loader2, Check, Trash2 } from "lucide-react";
import { getCourses, createCourse, importFromScreenshot, deleteCourse } from "../api/client";

const COLORS = ["#E8FF5A", "#5AF0FF", "#FF5A8A", "#5AFF8C", "#C49AFF", "#FFA35A"];

function Modal({ onClose, children }) {
  return createPortal(
    <div onClick={onClose} style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999,
      background: "var(--modal-overlay)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: "100%", maxWidth: "480px", maxHeight: "85vh", overflowY: "auto",
        background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px",
      }}>
        {children}
      </div>
    </div>,
    document.body
  );
}

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", professor: "", semester: "Spring 2026", color: COLORS[0] });
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const importInput = useRef(null);

  useEffect(() => { getCourses().then(setCourses).catch(console.error); }, []);

  const handleCreate = async () => {
    if (!form.name || !form.code) return;
    setSaving(true);
    try {
      const c = await createCourse(form);
      setCourses((prev) => [...prev, c]);
      setShowForm(false);
      setForm({ name: "", code: "", professor: "", semester: "Spring 2026", color: COLORS[(courses.length + 1) % COLORS.length] });
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setShowImport(true);
    setImporting(true);
    setImportResult(null);
    try {
      const result = await importFromScreenshot(file);
      setImportResult(result);
      // Refresh courses list
      const updated = await getCourses();
      setCourses(updated);
    } catch (err) {
      setImportResult({ error: err.response?.data?.detail || "Failed to parse screenshot" });
    }
    setImporting(false);
    // Reset file input
    if (importInput.current) importInput.current.value = "";
  };

  return (
    <div className="animate-fade-up">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Courses</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>{courses.length} course{courses.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => importInput.current?.click()}
            className="flex items-center gap-2 font-mono text-xs font-bold tracking-wider px-4 py-2.5 rounded-lg transition"
            style={{ border: "1px solid var(--border)", color: "var(--text-muted)", background: "var(--bg-hover)" }}>
            <Camera size={14} /> IMPORT SCREENSHOT
          </button>
          <input ref={importInput} type="file" accept="image/*" className="hidden" onChange={handleImport} />
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 font-mono text-xs font-bold tracking-wider px-4 py-2.5 rounded-lg transition"
            style={{ background: "var(--accent)", color: "var(--bg)" }}>
            <Plus size={14} /> ADD COURSE
          </button>
        </div>
      </div>

      {/* Import Modal */}
      {showImport && (
        <Modal onClose={() => { if (!importing) { setShowImport(false); setImportResult(null); } }}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>Import from Screenshot</h2>
            {!importing && <button onClick={() => { setShowImport(false); setImportResult(null); }} style={{ color: "var(--text-muted)" }}><X size={18} /></button>}
          </div>

          {importing && (
            <div className="py-10 text-center">
              <Loader2 size={28} className="animate-spin mx-auto mb-3" style={{ color: "var(--accent)" }} />
              <p className="text-sm font-medium" style={{ color: "var(--text)" }}>AI is reading your schedule...</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-dim)" }}>Detecting courses, filtering active semester, deduplicating labs</p>
            </div>
          )}

          {importResult && !importResult.error && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Check size={16} style={{ color: "var(--accent-green)" }} />
                <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
                  {importResult.created?.length || 0} course{importResult.created?.length !== 1 ? "s" : ""} imported
                </span>
              </div>

              {importResult.created?.length > 0 && (
                <div className="space-y-2 mb-4">
                  {importResult.created.map((c, i) => (
                    <div key={i} className="rounded-lg p-3" style={{ background: "var(--bg-hover)", border: "1px solid var(--border)" }}>
                      <div className="text-sm font-medium" style={{ color: "var(--text)" }}>{c.code} — {c.name}</div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>
                        {c.professor || "No professor"}{c.notes ? ` · ${c.notes}` : ""}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {importResult.skipped?.length > 0 && (
                <p className="text-xs" style={{ color: "var(--text-dim)" }}>
                  Skipped (already exist): {importResult.skipped.join(", ")}
                </p>
              )}

              <button onClick={() => { setShowImport(false); setImportResult(null); }}
                className="w-full mt-4 font-mono text-xs font-bold tracking-wider py-2.5 rounded-lg transition"
                style={{ background: "var(--accent)", color: "var(--bg)" }}>
                DONE
              </button>
            </div>
          )}

          {importResult?.error && (
            <div>
              <p className="text-sm" style={{ color: "var(--accent-red)" }}>{importResult.error}</p>
              <button onClick={() => { setShowImport(false); setImportResult(null); }}
                className="w-full mt-4 font-mono text-xs font-bold tracking-wider py-2.5 rounded-lg transition"
                style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                CLOSE
              </button>
            </div>
          )}
        </Modal>
      )}

      {/* Create Course Modal */}
      {showForm && (
        <Modal onClose={() => setShowForm(false)}>
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>New Course</h2>
            <button onClick={() => setShowForm(false)} style={{ color: "var(--text-muted)" }}><X size={18} /></button>
          </div>
          <div className="space-y-4">
            {[
              { key: "code", label: "COURSE CODE", placeholder: "CS 401" },
              { key: "name", label: "COURSE NAME", placeholder: "Computer Algorithms" },
              { key: "professor", label: "PROFESSOR", placeholder: "Dr. Chen" },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="font-mono text-[10px] tracking-wider font-bold block mb-1.5" style={{ color: "var(--text-dim)" }}>{label}</label>
                <input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder}
                  className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none transition"
                  style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text)" }}
                  onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
                  onBlur={(e) => e.target.style.borderColor = "var(--border)"} />
              </div>
            ))}
            <div>
              <label className="font-mono text-[10px] tracking-wider font-bold block mb-1.5" style={{ color: "var(--text-dim)" }}>COLOR</label>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button key={c} onClick={() => setForm({ ...form, color: c })} className="w-8 h-8 rounded-lg transition"
                    style={{ background: c, border: form.color === c ? "2px solid var(--text)" : "2px solid transparent", opacity: form.color === c ? 1 : 0.4 }} />
                ))}
              </div>
            </div>
          </div>
          <button onClick={handleCreate} disabled={!form.name || !form.code || saving}
            className="w-full mt-6 font-mono text-xs font-bold tracking-wider py-3 rounded-lg transition disabled:opacity-30"
            style={{ background: "var(--accent)", color: "var(--bg)" }}>
            {saving ? "CREATING..." : "CREATE COURSE"}
          </button>
        </Modal>
      )}

      {/* Empty State */}
      {courses.length === 0 ? (
        <div className="rounded-2xl p-10" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: `rgba(var(--accent-rgb), 0.1)` }}>
              <BookOpen size={24} style={{ color: "var(--accent)" }} />
            </div>
            <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--text)" }}>No courses yet</h2>
            <p className="text-sm max-w-sm mx-auto" style={{ color: "var(--text-muted)" }}>
              Add courses manually or import them from a screenshot of your schedule.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Camera, title: "Screenshot Import", desc: "Upload a screenshot of Blackboard, Banner, or any schedule" },
              { icon: Upload, title: "Upload Materials", desc: "Syllabus, slides, textbooks, announcements" },
              { icon: Sparkles, title: "AI Does the Rest", desc: "Parses deadlines, generates plans, creates study guides" },
            ].map(({ icon: Icon, title, desc }, i) => (
              <div key={i} className="rounded-xl p-4 text-center" style={{ background: "var(--bg-hover)", border: "1px solid var(--border)" }}>
                <div className="w-9 h-9 rounded-lg mx-auto mb-3 flex items-center justify-center" style={{ background: `rgba(var(--accent-rgb), 0.08)` }}>
                  <Icon size={16} style={{ color: "var(--accent)" }} />
                </div>
                <div className="text-sm font-medium mb-1" style={{ color: "var(--text)" }}>{title}</div>
                <div className="text-xs leading-relaxed" style={{ color: "var(--text-dim)" }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map((c, i) => (
            <div key={c.id}
              className="flex items-center justify-between rounded-xl p-5 transition group animate-fade-up"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", animationDelay: `${i * 50}ms` }}>
              <Link to={`/courses/${c.id}`} className="flex items-center gap-4 flex-1 min-w-0" style={{ textDecoration: "none" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold font-mono"
                  style={{ background: c.color + "18", color: c.color }}>
                  {c.code.replace(/[^A-Z0-9]/g, "").slice(0, 3)}
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: "var(--text)" }}>{c.code} — {c.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>
                    {c.professor || "No professor"} · {c.assignment_count} tasks · {c.material_count} uploads
                  </div>
                </div>
              </Link>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(c);
                  }}
                  className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition"
                  style={{ color: "var(--accent-red)" }}
                  title="Delete course">
                  <Trash2 size={14} />
                </button>
                <ChevronRight size={16} style={{ color: "var(--text-dim)" }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <Modal onClose={() => setDeleteTarget(null)}>
          <h2 className="text-lg font-bold mb-2" style={{ color: "var(--text)" }}>Delete Course</h2>
          <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
            Are you sure you want to delete <strong style={{ color: "var(--text)" }}>{deleteTarget.code}</strong>? This will remove all its assignments and materials.
          </p>
          <div className="flex gap-2">
            <button onClick={() => setDeleteTarget(null)}
              className="flex-1 font-mono text-xs font-bold tracking-wider py-2.5 rounded-lg transition"
              style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}>
              CANCEL
            </button>
            <button onClick={async () => {
              try { await deleteCourse(deleteTarget.id); setCourses((prev) => prev.filter((x) => x.id !== deleteTarget.id)); } catch {}
              setDeleteTarget(null);
            }}
              className="flex-1 font-mono text-xs font-bold tracking-wider py-2.5 rounded-lg transition"
              style={{ background: "var(--accent-red)", color: "#fff" }}>
              DELETE
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
