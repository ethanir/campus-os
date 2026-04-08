import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, ChevronRight, X } from "lucide-react";
import { getCourses, createCourse } from "../api/client";

const COLORS = ["#E8FF5A", "#5AF0FF", "#FF5A8A", "#5AFF8C", "#C49AFF", "#FFA35A"];

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
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  return (
    <div className="animate-fade-up">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Courses</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{courses.length} course{courses.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 font-mono text-xs font-bold tracking-wider bg-accent-yellow/10 text-accent-yellow border border-accent-yellow/30 px-4 py-2.5 rounded-lg hover:bg-accent-yellow/20 transition"
        >
          <Plus size={14} /> ADD COURSE
        </button>
      </div>

      {/* Create form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-bg-card border border-border rounded-2xl p-6 w-full max-w-md animate-fade-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold">New Course</h2>
              <button onClick={() => setShowForm(false)} className="text-neutral-500 hover:text-neutral-300"><X size={18} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="font-mono text-[10px] tracking-wider text-neutral-500 font-bold block mb-1.5">COURSE CODE</label>
                <input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="CS 401"
                  className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-sm text-neutral-200 placeholder:text-neutral-700 focus:outline-none focus:border-accent-yellow/40"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] tracking-wider text-neutral-500 font-bold block mb-1.5">COURSE NAME</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Computer Algorithms"
                  className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-sm text-neutral-200 placeholder:text-neutral-700 focus:outline-none focus:border-accent-yellow/40"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] tracking-wider text-neutral-500 font-bold block mb-1.5">PROFESSOR</label>
                <input
                  value={form.professor}
                  onChange={(e) => setForm({ ...form, professor: e.target.value })}
                  placeholder="Dr. Chen"
                  className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-sm text-neutral-200 placeholder:text-neutral-700 focus:outline-none focus:border-accent-yellow/40"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] tracking-wider text-neutral-500 font-bold block mb-1.5">COLOR</label>
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setForm({ ...form, color: c })}
                      className="w-8 h-8 rounded-lg border-2 transition"
                      style={{ background: c, borderColor: form.color === c ? "#fff" : "transparent", opacity: form.color === c ? 1 : 0.4 }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleCreate}
              disabled={!form.name || !form.code || saving}
              className="w-full mt-6 font-mono text-xs font-bold tracking-wider bg-accent-yellow text-black py-3 rounded-lg hover:bg-accent-yellow/90 disabled:opacity-30 transition"
            >
              {saving ? "CREATING..." : "CREATE COURSE"}
            </button>
          </div>
        </div>
      )}

      {/* Course list */}
      {courses.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-12 text-center">
          <p className="text-neutral-400">No courses yet. Click "Add Course" to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map((c, i) => (
            <Link
              key={c.id}
              to={`/courses/${c.id}`}
              className="flex items-center justify-between bg-bg-card border border-border rounded-xl p-5 hover:border-border-light transition group animate-fade-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold font-mono" style={{ background: c.color + "18", color: c.color }}>
                  {c.code.replace(/[^A-Z0-9]/g, "").slice(0, 3)}
                </div>
                <div>
                  <div className="text-sm font-medium text-neutral-200">{c.code} — {c.name}</div>
                  <div className="text-xs text-neutral-600 mt-0.5">
                    {c.professor || "No professor"} · {c.assignment_count} tasks · {c.material_count} uploads
                  </div>
                </div>
              </div>
              <ChevronRight size={16} className="text-neutral-700 group-hover:text-neutral-400 transition" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
