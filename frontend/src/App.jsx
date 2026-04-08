import { Routes, Route, NavLink, Navigate } from "react-router-dom";
import { LayoutDashboard, BookOpen, Upload, Calendar, GraduationCap } from "lucide-react";
import Dashboard from "./pages/Dashboard";
import CoursePage from "./pages/CoursePage";
import UploadPage from "./pages/UploadPage";
import CoursesPage from "./pages/CoursesPage";

const NAV = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/courses", icon: BookOpen, label: "Courses" },
  { to: "/upload", icon: Upload, label: "Upload" },
];

function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-bg border-r border-border flex flex-col z-50">
      {/* Logo */}
      <div className="px-5 pt-6 pb-8">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-2 h-2 rounded-full bg-accent-yellow shadow-[0_0_10px_#E8FF5A]" />
          <span className="font-mono text-[10px] tracking-[2.5px] text-neutral-500 font-bold">
            CAMPUS OS
          </span>
        </div>
        <p className="text-[11px] text-neutral-600 mt-1">AI Academic System</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
              ${isActive
                ? "bg-accent-yellow/10 text-accent-yellow"
                : "text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.03]"
              }`
            }
          >
            <Icon size={16} strokeWidth={1.8} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-border">
        <div className="flex items-center gap-2">
          <GraduationCap size={14} className="text-neutral-600" />
          <span className="text-[11px] text-neutral-600">v0.1.0</span>
        </div>
      </div>
    </aside>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      <main className="ml-56 p-6 max-w-[1000px]">
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
