import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Clock, AlertTriangle, ChevronRight, Sparkles, Loader2 } from "lucide-react";
import { getCourses, getAssignments, generateWeeklyPlan, getWeeklyPlan } from "../api/client";

function StatusBadge({ status }) {
  const styles = {
    not_started: "bg-white/5 text-neutral-500 border-neutral-700",
    in_progress: "bg-accent-yellow/10 text-accent-yellow border-accent-yellow/40",
    done: "bg-accent-green/10 text-accent-green border-accent-green/40",
  };
  const labels = { not_started: "NOT STARTED", in_progress: "IN PROGRESS", done: "DONE" };
  return (
    <span className={`font-mono text-[9px] font-bold tracking-[1.5px] px-2.5 py-1 rounded border ${styles[status] || styles.not_started}`}>
      {labels[status] || "UNKNOWN"}
    </span>
  );
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const now = new Date();
  return Math.ceil((d - now) / 86400000);
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
        // Fetch assignments for each course
        const all = [];
        for (const course of c) {
          const assignments = await getAssignments(course.id);
          all.push(...assignments.map((a) => ({ ...a, course })));
        }
        all.sort((a, b) => new Date(a.due_date || "9999") - new Date(b.due_date || "9999"));
        setAllAssignments(all);
        // Try to load existing plan
        try { const p = await getWeeklyPlan(); setPlan(JSON.parse(p.plan_json)); } catch {}
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    })();
  }, []);

  const handleGeneratePlan = async () => {
    setPlanLoading(true);
    try {
      const p = await generateWeeklyPlan();
      setPlan(JSON.parse(p.plan_json));
    } catch (err) {
      console.error(err);
    }
    setPlanLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-neutral-500">
        <Loader2 className="animate-spin mr-2" size={18} /> Loading...
      </div>
    );
  }

  const upcoming = allAssignments.filter((a) => a.status !== "done").slice(0, 6);

  return (
    <div className="animate-fade-up">
      <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
      <p className="text-sm text-neutral-500 mb-6">
        {courses.length} course{courses.length !== 1 ? "s" : ""} · {allAssignments.filter(a => a.status !== "done").length} active tasks
      </p>

      {/* Empty state */}
      {courses.length === 0 && (
        <div className="border border-dashed border-border rounded-xl p-12 text-center">
          <p className="text-neutral-400 mb-2">No courses yet</p>
          <p className="text-sm text-neutral-600 mb-4">Add a course and upload your syllabus to get started.</p>
          <Link to="/courses" className="inline-block font-mono text-xs font-bold tracking-wider bg-accent-yellow/10 text-accent-yellow border border-accent-yellow/30 px-5 py-2.5 rounded-lg hover:bg-accent-yellow/20 transition">
            ADD COURSE →
          </Link>
        </div>
      )}

      {/* Deadline strip */}
      {upcoming.length > 0 && (
        <div className="mb-6">
          <h2 className="font-mono text-[10px] tracking-[2px] text-neutral-500 font-bold mb-3">UPCOMING DEADLINES</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {upcoming.map((a, i) => {
              const d = daysUntil(a.due_date);
              const urgent = d !== null && d <= 7;
              const courseColor = a.course?.color || "#5AF0FF";
              return (
                <div
                  key={a.id}
                  className="animate-slide-in min-w-[200px] p-3.5 rounded-xl border"
                  style={{
                    animationDelay: `${i * 50}ms`,
                    background: urgent ? "rgba(255,90,90,0.06)" : "rgba(255,255,255,0.02)",
                    borderColor: urgent ? "rgba(255,90,90,0.25)" : "#1e1e28",
                  }}
                >
                  <div className="font-mono text-[10px] font-bold tracking-wider mb-1.5" style={{ color: courseColor }}>
                    {a.course?.code}
                  </div>
                  <div className="text-[13px] font-medium leading-snug mb-2 text-neutral-200">{a.title}</div>
                  <div className="flex justify-between items-center">
                    <span className={`font-mono text-[11px] ${urgent ? "text-accent-red" : "text-neutral-600"}`}>
                      {d !== null ? `${d}d left` : "No date"}
                    </span>
                    <StatusBadge status={a.status} />
                  </div>
                  {a.weight > 0 && (
                    <div className="font-mono text-[10px] text-neutral-600 mt-1.5">{a.weight}% of grade</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Weekly plan + Course summary grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Weekly plan */}
        <div className="bg-bg-card border border-border rounded-xl p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-mono text-[10px] tracking-[2px] text-neutral-500 font-bold">WEEKLY PLAN</h2>
            <button
              onClick={handleGeneratePlan}
              disabled={planLoading || allAssignments.length === 0}
              className="flex items-center gap-1.5 font-mono text-[10px] font-bold tracking-wider text-accent-yellow hover:text-accent-yellow/80 disabled:text-neutral-600 transition"
            >
              {planLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              {planLoading ? "GENERATING..." : "GENERATE"}
            </button>
          </div>

          {plan?.days ? (
            plan.days.map((day, i) => (
              <div key={i} className="mb-3 pl-3 border-l-2 animate-slide-in" style={{ borderColor: i === 0 ? "#E8FF5A" : "#1e1e28", animationDelay: `${i * 40}ms` }}>
                <div className={`font-mono text-[11px] font-bold tracking-wider mb-1 ${i === 0 ? "text-accent-yellow" : "text-neutral-600"}`}>
                  {day.day || day.date} {i === 0 ? "← TODAY" : ""}
                </div>
                {(day.tasks || []).map((t, j) => (
                  <div key={j} className={`text-[13px] leading-relaxed ${i === 0 ? "text-neutral-300" : "text-neutral-600"}`}>
                    {typeof t === "string" ? t : t.text}
                  </div>
                ))}
              </div>
            ))
          ) : (
            <div className="text-sm text-neutral-600 py-8 text-center">
              {allAssignments.length > 0 ? "Click Generate to create your plan" : "Add courses and assignments first"}
            </div>
          )}
        </div>

        {/* Course cards */}
        <div className="space-y-3">
          <h2 className="font-mono text-[10px] tracking-[2px] text-neutral-500 font-bold mb-1">COURSES</h2>
          {courses.map((c, i) => (
            <Link
              key={c.id}
              to={`/courses/${c.id}`}
              className="block bg-bg-card border border-border rounded-xl p-4 hover:border-border-light transition group animate-fade-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: c.color }} />
                    <span className="font-mono text-[10px] font-bold tracking-wider" style={{ color: c.color }}>{c.code}</span>
                  </div>
                  <div className="text-sm font-medium text-neutral-200">{c.name}</div>
                  <div className="text-xs text-neutral-600 mt-1">{c.professor}</div>
                </div>
                <ChevronRight size={14} className="text-neutral-700 group-hover:text-neutral-400 transition mt-1" />
              </div>
              <div className="flex gap-3 mt-3 text-[11px] font-mono text-neutral-600">
                <span>{c.assignment_count} tasks</span>
                <span>{c.material_count} uploads</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
