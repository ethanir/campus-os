import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { Plus, ChevronRight, X, BookOpen, Upload, Sparkles, Calendar } from "lucide-react";
import { getCourses, createCourse } from "../api/client";

const COLORS = ["#E8FF5A", "#5AF0FF", "#FF5A8A", "#5AFF8C", "#C49AFF", "#FFA35A"];

function Modal({ onClose, children }) {
  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 99999,
        background: "var(--modal-overlay)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "420px",
          maxHeight: "85vh",
          overflowY: "auto",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          padding: "24px",
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
  const [form, setForm] = useState({ name: "", code: "", professor: "", semester: "Spring 2026", color: COLORS[0] });
  const [saving, setSaving] = useState(false);

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

  return (
    <div className="animate-fade-up">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Courses</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>{courses.length} course{courses.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 font-mono text-xs font-bold tracking-wider px-4 py-2.5 rounded-lg transition"
          style={{ background: "var(--accent)", color: "var(--bg)" }}>
          <Plus size={14} /> ADD COURSE
        </button>
      </div>

      {/* Modal via Portal */}
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
                <input
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder}
                  className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none transition"
                  style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text)" }}
                  onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
                  onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                />
              </div>
            ))}
            <div>
              <label className="font-mono text-[10px] tracking-wider font-bold block mb-1.5" style={{ color: "var(--text-dim)" }}>COLOR</label>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button key={c} onClick={() => setForm({ ...form, color: c })}
                    className="w-8 h-8 rounded-lg transition"
                    style={{
                      background: c,
                      border: form.color === c ? "2px solid var(--text)" : "2px solid transparent",
                      opacity: form.color === c ? 1 : 0.4,
                    }} />
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

      {/* Empty State - Full Width */}
      {courses.length === 0 ? (
        <div className="rounded-2xl p-10" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: `rgba(var(--accent-rgb), 0.1)` }}>
              <BookOpen size={24} style={{ color: "var(--accent)" }} />
            </div>
            <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--text)" }}>No courses yet</h2>
            <p className="text-sm max-w-sm mx-auto" style={{ color: "var(--text-muted)" }}>
              Add a course to start uploading materials and tracking assignments.
            </p>
          </div>

          {/* How it works */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Plus, title: "1. Add Course", desc: "Enter your course code, name, and professor" },
              { icon: Upload, title: "2. Upload Materials", desc: "Syllabus, slides, textbooks, announcements" },
              { icon: Sparkles, title: "3. AI Does the Rest", desc: "Parses deadlines, generates plans, creates study guides" },
            ].map(({ icon: Icon, title, desc }, i) => (
              <div key={i} className="rounded-xl p-4 text-center"
                style={{ background: "var(--bg-hover)", border: "1px solid var(--border)" }}>
                <div className="w-9 h-9 rounded-lg mx-auto mb-3 flex items-center justify-center"
                  style={{ background: `rgba(var(--accent-rgb), 0.08)` }}>
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
            <Link key={c.id} to={`/courses/${c.id}`}
              className="flex items-center justify-between rounded-xl p-5 transition group animate-fade-up"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", animationDelay: `${i * 50}ms` }}>
              <div className="flex items-center gap-4">
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
              </div>
              <ChevronRight size={16} style={{ color: "var(--text-dim)" }} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
