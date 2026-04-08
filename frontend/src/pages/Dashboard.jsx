import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Sparkles, Loader2, BookOpen, Upload, Clock } from "lucide-react";
import { getCourses, getAssignments, generateWeeklyPlan, getWeeklyPlan } from "../api/client";

function StatusBadge({ status }) {
  const map = {
    not_started: { label: "TODO", bg: "var(--bg-hover)", color: "var(--text-dim)", border: "var(--border)" },
    in_progress: { label: "ACTIVE", bg: `rgba(var(--accent-rgb), 0.1)`, color: "var(--accent)", border: "var(--accent)" },
    done: { label: "DONE", bg: "rgba(90,255,140,0.1)", color: "var(--accent-green)", border: "var(--accent-green)" },
  };
  const s = map[status] || map.not_started;
  return (
    <span className="font-mono text-[9px] font-bold tracking-[1.5px] px-2 py-0.5 rounded"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {s.label}
    </span>
  );
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
}

export default function Dashboard() {
  const [courses, setCourses] = useState([]);
  const [allAssignments, setAllAssignments] = useState([]);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [planLoading, setPlanLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const c = await getCourses();
        setCourses(c);
        const all = [];
        for (const course of c) {
          const assignments = await getAssignments(course.id);
          all.push(...assignments.map((a) => ({ ...a, course })));
        }
        all.sort((a, b) => new Date(a.due_date || "9999") - new Date(b.due_date || "9999"));
        setAllAssignments(all);
        try { const p = await getWeeklyPlan(); setPlan(JSON.parse(p.plan_json)); } catch {}
      } catch (err) { console.error(err); }
      setLoading(false);
    })();
  }, []);

  const handleGeneratePlan = async () => {
    setPlanLoading(true);
    try {
      const p = await generateWeeklyPlan();
      setPlan(JSON.parse(p.plan_json));
    } catch (err) { console.error(err); }
    setPlanLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" style={{ color: "var(--text-muted)" }}>
        <Loader2 className="animate-spin mr-2" size={18} /> Loading...
      </div>
    );
  }

  const upcoming = allAssignments.filter((a) => a.status !== "done").slice(0, 6);

  return (
    <div className="animate-fade-up">
      <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text)" }}>Dashboard</h1>
      <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
        {courses.length} course{courses.length !== 1 ? "s" : ""} · {allAssignments.filter(a => a.status !== "done").length} active tasks
      </p>

      {/* Empty state */}
      {courses.length === 0 && (
        <div className="rounded-2xl p-10 text-center animate-fade-up" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: `rgba(var(--accent-rgb), 0.1)` }}>
            <BookOpen size={24} style={{ color: "var(--accent)" }} />
          </div>
          <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--text)" }}>Welcome to Campus OS</h2>
          <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: "var(--text-muted)" }}>
            Add your first course, upload a syllabus, and let AI break it all down into a plan.
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/courses"
              className="font-mono text-xs font-bold tracking-wider px-5 py-2.5 rounded-lg transition"
              style={{ background: "var(--accent)", color: "var(--bg)" }}>
              ADD COURSE
            </Link>
            <Link to="/upload"
              className="flex items-center gap-2 font-mono text-xs font-bold tracking-wider px-5 py-2.5 rounded-lg transition"
              style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}>
              <Upload size={12} /> UPLOAD FILES
            </Link>
          </div>
        </div>
      )}

      {/* Deadline strip */}
      {upcoming.length > 0 && (
        <div className="mb-6">
          <h2 className="font-mono text-[10px] tracking-[2px] font-bold mb-3" style={{ color: "var(--text-dim)" }}>UPCOMING DEADLINES</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {upcoming.map((a, i) => {
              const d = daysUntil(a.due_date);
              const urgent = d !== null && d <= 7;
              return (
                <div key={a.id} className="animate-slide-in min-w-[200px] p-3.5 rounded-xl"
                  style={{
                    animationDelay: `${i * 50}ms`,
                    background: urgent ? "rgba(var(--accent-rgb), 0.04)" : "var(--bg-card)",
                    border: `1px solid ${urgent ? "var(--accent-red)" : "var(--border)"}`,
                  }}>
                  <div className="font-mono text-[10px] font-bold tracking-wider mb-1.5" style={{ color: a.course?.color || "var(--accent)" }}>
                    {a.course?.code}
                  </div>
                  <div className="text-[13px] font-medium leading-snug mb-2" style={{ color: "var(--text)" }}>{a.title}</div>
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[11px]" style={{ color: urgent ? "var(--accent-red)" : "var(--text-dim)" }}>
                      {d !== null ? `${d}d left` : "No date"}
                    </span>
                    <StatusBadge status={a.status} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Weekly plan + Course cards */}
      {courses.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-mono text-[10px] tracking-[2px] font-bold" style={{ color: "var(--text-dim)" }}>WEEKLY PLAN</h2>
              <button onClick={handleGeneratePlan} disabled={planLoading || allAssignments.length === 0}
                className="flex items-center gap-1.5 font-mono text-[10px] font-bold tracking-wider transition disabled:opacity-30"
                style={{ color: "var(--accent)" }}>
                {planLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                {planLoading ? "..." : "GENERATE"}
              </button>
            </div>
            {plan?.days ? (
              plan.days.map((day, i) => (
                <div key={i} className="mb-3 pl-3 border-l-2 animate-slide-in"
                  style={{ borderColor: i === 0 ? "var(--accent)" : "var(--border)", animationDelay: `${i * 40}ms` }}>
                  <div className="font-mono text-[11px] font-bold tracking-wider mb-1"
                    style={{ color: i === 0 ? "var(--accent)" : "var(--text-dim)" }}>
                    {day.day || day.date} {i === 0 ? " ← TODAY" : ""}
                  </div>
                  {(day.tasks || []).map((t, j) => (
                    <div key={j} className="text-[13px] leading-relaxed"
                      style={{ color: i === 0 ? "var(--text)" : "var(--text-dim)" }}>
                      {typeof t === "string" ? t : t.text}
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <div className="text-sm py-8 text-center" style={{ color: "var(--text-dim)" }}>
                <Clock size={20} className="mx-auto mb-2" style={{ color: "var(--text-dim)" }} />
                {allAssignments.length > 0 ? "Click Generate to create your plan" : "Add assignments first"}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h2 className="font-mono text-[10px] tracking-[2px] font-bold mb-1" style={{ color: "var(--text-dim)" }}>COURSES</h2>
            {courses.map((c, i) => (
              <Link key={c.id} to={`/courses/${c.id}`}
                className="block rounded-xl p-4 transition group animate-fade-up"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)", animationDelay: `${i * 60}ms` }}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: c.color }} />
                      <span className="font-mono text-[10px] font-bold tracking-wider" style={{ color: c.color }}>{c.code}</span>
                    </div>
                    <div className="text-sm font-medium" style={{ color: "var(--text)" }}>{c.name}</div>
                    <div className="text-xs mt-1" style={{ color: "var(--text-dim)" }}>{c.professor}</div>
                  </div>
                  <ChevronRight size={14} style={{ color: "var(--text-dim)" }} />
                </div>
                <div className="flex gap-3 mt-3 text-[11px] font-mono" style={{ color: "var(--text-dim)" }}>
                  <span>{c.assignment_count} tasks</span>
                  <span>{c.material_count} uploads</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
