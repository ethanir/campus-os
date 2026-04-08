import { useState } from "react";
import { Routes, Route, NavLink, Navigate } from "react-router-dom";
import { LayoutDashboard, BookOpen, Upload, Sun, Moon, Code2, Palette } from "lucide-react";
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

const THEME_ICONS = { dark: Moon, light: Sun, code: Code2 };

function ThemeSwitcher() {
  const { theme, setTheme, THEMES, THEME_LABELS } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      {/* Popup */}
      {open && (
        <div className="absolute bottom-full left-0 mb-1 w-full rounded-lg overflow-hidden"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          {THEMES.map((t) => {
            const Icon = THEME_ICONS[t];
            const active = theme === t;
            return (
              <button key={t} onClick={() => { setTheme(t); setOpen(false); }}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 text-left text-sm transition"
                style={{
                  color: active ? "var(--accent)" : "var(--text-muted)",
                  background: active ? `rgba(var(--accent-rgb), 0.08)` : "transparent",
                }}>
                <Icon size={13} />
                <span className="font-mono text-[10px] tracking-wider font-bold">{THEME_LABELS[t].toUpperCase()}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Trigger */}
      <button className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm transition"
        style={{ color: "var(--text-muted)", background: "var(--bg-hover)" }}>
        <Palette size={14} />
        <span className="font-mono text-[10px] tracking-wider font-bold">THEME</span>
      </button>
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-52 flex flex-col z-50 border-r"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
      <div className="px-5 pt-6 pb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full" style={{ background: "var(--accent)", boxShadow: `0 0 8px var(--accent)` }} />
          <span className="font-mono text-[10px] tracking-[2.5px] font-bold" style={{ color: "var(--text-dim)" }}>CAMPUS OS</span>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === "/"}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={({ isActive }) => ({
              background: isActive ? `rgba(var(--accent-rgb), 0.1)` : "transparent",
              color: isActive ? "var(--accent)" : "var(--text-muted)",
            })}>
            <Icon size={16} strokeWidth={1.8} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-4">
        <ThemeSwitcher />
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
