import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Loader2, BookOpen, Sparkles, FileText, Zap } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getCourses } from "../api/client";

export default function Dashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCourses().then(setCourses).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64" style={{ color: "var(--text-muted)" }}><Loader2 className="animate-spin mr-2" size={18} /> Loading...</div>;

  return (
    <div className="animate-fade-up">
      <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text)" }}>
        {user?.name ? `Hey ${user.name.split(" ")[0]}` : "Dashboard"}
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
        {courses.length} course{courses.length !== 1 ? "s" : ""} · {user?.credits || 0} credits remaining
      </p>

      {/* Empty state */}
      {courses.length === 0 && (
        <div className="rounded-2xl p-10" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: `rgba(var(--accent-rgb), 0.1)` }}>
              <BookOpen size={24} style={{ color: "var(--accent)" }} />
            </div>
            <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--text)" }}>Welcome to YourCourse AI</h2>
            <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: "var(--text-muted)" }}>
              Add your courses, upload materials, and let AI handle the rest.
            </p>
            <Link to="/courses"
              className="font-mono text-xs font-bold tracking-wider px-5 py-2.5 rounded-lg transition inline-block"
              style={{ background: "var(--accent)", color: "var(--bg)", textDecoration: "none" }}>
              GET STARTED
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: BookOpen, title: "Add Courses", desc: "Import from a screenshot or add manually" },
              { icon: FileText, title: "Upload Everything", desc: "Slides, textbooks, assignments, announcements" },
              { icon: Sparkles, title: "AI Generates", desc: "Study guides, completed homework, explanations" },
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
      )}

      {/* Course grid */}
      {courses.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {courses.map((c, i) => (
            <Link key={c.id} to={`/courses/${c.id}`}
              className="rounded-xl p-5 transition group animate-fade-up"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", animationDelay: `${i * 50}ms`, textDecoration: "none" }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                    <span className="font-mono text-[10px] font-bold tracking-wider" style={{ color: c.color }}>{c.code}</span>
                  </div>
                  <div className="text-sm font-medium" style={{ color: "var(--text)" }}>{c.name}</div>
                  {c.professor && <div className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>{c.professor}</div>}
                </div>
                <ChevronRight size={14} className="mt-1" style={{ color: "var(--text-dim)" }} />
              </div>
              <div className="flex gap-4 text-[11px] font-mono" style={{ color: "var(--text-dim)" }}>
                <div className="flex items-center gap-1.5"><FileText size={11} /><span>{c.material_count} file{c.material_count !== 1 ? "s" : ""}</span></div>
                <div className="flex items-center gap-1.5"><Sparkles size={11} /><span>{c.assignment_count} task{c.assignment_count !== 1 ? "s" : ""}</span></div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
