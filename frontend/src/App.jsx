import { useState } from "react";
import { Routes, Route, NavLink, Navigate, useLocation } from "react-router-dom";
import { LayoutDashboard, BookOpen, Sun, Moon, Code2, Palette, LogOut, Zap } from "lucide-react";
import { useTheme } from "./hooks/useTheme";
import { useAuth } from "./hooks/useAuth";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import CoursePage from "./pages/CoursePage";
import CoursesPage from "./pages/CoursesPage";

const NAV = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/courses", icon: BookOpen, label: "Courses" },
];

const THEME_ICONS = { dark: Moon, light: Sun, code: Code2 };

function ThemeSwitcher() {
  const { theme, setTheme, THEMES, THEME_LABELS } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      {open && (
        <div className="absolute bottom-full left-0 w-full pb-1" style={{ background: "transparent" }}>
          <div className="w-full rounded-lg overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            {THEMES.map((t) => {
              const Icon = THEME_ICONS[t];
              return (
                <button key={t} onClick={() => { setTheme(t); setOpen(false); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 text-left text-sm transition"
                  style={{ color: theme === t ? "var(--accent)" : "var(--text-muted)", background: theme === t ? `rgba(var(--accent-rgb), 0.08)` : "transparent" }}>
                  <Icon size={13} />
                  <span className="font-mono text-[10px] tracking-wider font-bold">{THEME_LABELS[t].toUpperCase()}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      <button className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm transition"
        style={{ color: "var(--text-muted)", background: "var(--bg-hover)" }}>
        <Palette size={14} />
        <span className="font-mono text-[10px] tracking-wider font-bold">THEME</span>
      </button>
    </div>
  );
}

function Sidebar() {
  const { user, logout } = useAuth();
  return (
    <aside className="fixed left-0 top-0 h-screen w-52 flex flex-col z-50 border-r"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full" style={{ background: "var(--accent)", boxShadow: `0 0 8px var(--accent)` }} />
          <span className="font-mono text-[10px] tracking-[2.5px] font-bold" style={{ color: "var(--text-dim)" }}>EZ SCHOOL AI</span>
        </div>
      </div>

      {/* Credits display */}
      {user && (
        <div className="mx-3 mb-4 px-3 py-2.5 rounded-lg" style={{ background: `rgba(var(--accent-rgb), 0.06)`, border: `1px solid rgba(var(--accent-rgb), 0.15)` }}>
          <div className="flex items-center gap-2 mb-1">
            <Zap size={12} style={{ color: "var(--accent)" }} />
            <span className="font-mono text-[10px] font-bold tracking-wider" style={{ color: "var(--accent)" }}>
              {user.credits} CREDITS
            </span>
          </div>
          <div style={{ height: 3, borderRadius: 2, background: "var(--border)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.min((user.credits / 50) * 100, 100)}%`, background: "var(--accent)", borderRadius: 2, transition: "width 0.3s" }} />
          </div>
        </div>
      )}

      <nav className="flex-1 px-3 space-y-0.5">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === "/dashboard"}
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

      <div className="px-3 pb-3 space-y-1.5">
        <ThemeSwitcher />
        {user && (
          <button onClick={logout}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm transition"
            style={{ color: "var(--text-dim)" }}>
            <LogOut size={14} />
            <span className="font-mono text-[10px] tracking-wider font-bold">LOG OUT</span>
          </button>
        )}
      </div>
    </aside>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "var(--text-muted)" }}>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
}

function AppLayout({ children }) {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Sidebar />
      <main className="ml-52 p-6">{children}</main>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>Loading...</div>;

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <AuthPage mode="login" />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <AuthPage mode="signup" />} />

      {/* Protected routes */}
      <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/courses" element={<ProtectedRoute><AppLayout><CoursesPage /></AppLayout></ProtectedRoute>} />
      <Route path="/courses/:id" element={<ProtectedRoute><AppLayout><CoursePage /></AppLayout></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
