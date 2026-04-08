import { Routes, Route, NavLink, Navigate } from "react-router-dom";
import { LayoutDashboard, BookOpen, Upload, Sun, Moon, Sparkles } from "lucide-react";
import { useTheme } from "./hooks/useTheme";
import Dashboard from "./pages/Dashboard";
import CoursePage from "./pages/CoursePage";
import CoursesPage from "./pages/CoursesPage";
import UploadPage from "./pages/UploadPage";

const NAV = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/courses", icon: BookOpen, label: "Courses" },
  { to: "/upload", icon: Upload, label: "Upload" },
];

const THEME_ICONS = { dark: Moon, light: Sun, neon: Sparkles };

function Sidebar() {
  const { theme, cycle, label } = useTheme();
  const ThemeIcon = THEME_ICONS[theme];

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-52 flex flex-col z-50 border-r"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <div className="px-5 pt-6 pb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full" style={{ background: "var(--accent)", boxShadow: `0 0 8px var(--accent)` }} />
          <span className="font-mono text-[10px] tracking-[2.5px] font-bold" style={{ color: "var(--text-dim)" }}>
            CAMPUS OS
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all`}
            style={({ isActive }) => ({
              background: isActive ? `rgba(var(--accent-rgb), 0.1)` : "transparent",
              color: isActive ? "var(--accent)" : "var(--text-muted)",
            })}
          >
            <Icon size={16} strokeWidth={1.8} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-4">
        <button
          onClick={cycle}
          className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm transition-all"
          style={{ color: "var(--text-muted)", background: "var(--bg-hover)" }}
        >
          <ThemeIcon size={14} />
          <span className="font-mono text-[10px] tracking-wider font-bold">{label.toUpperCase()}</span>
        </button>
      </div>
    </aside>
  );
}

export default function App() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Sidebar />
      <main className="ml-52 p-6 max-w-[960px]">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:id" element={<CoursePage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}
