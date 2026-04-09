import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Loader2, ArrowLeft } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { register, login } from "../api/client";

export default function AuthPage({ mode }) {
  const isLogin = mode === "login";
  const navigate = useNavigate();
  const { loginUser } = useAuth();
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!form.email || !form.password) return setError("Email and password required");
    if (!isLogin && form.password.length < 6) return setError("Password must be at least 6 characters");

    setLoading(true);
    try {
      const result = isLogin ? await login(form) : await register(form);
      loginUser(result.token, result.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong");
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") handleSubmit(); };

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-muted)", textDecoration: "none", marginBottom: 32 }}>
          <ArrowLeft size={14} /> Back
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--accent)", boxShadow: "0 0 12px var(--accent)" }} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, letterSpacing: 2, color: "var(--text-dim)" }}>YOURCOURSE AI</span>
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
          {isLogin ? "Welcome back" : "Create your account"}
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 32 }}>
          {isLogin ? "Log in to access your courses" : "Start with 3 free AI generations"}
        </p>

        {error && (
          <div style={{
            padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13,
            background: "rgba(255,90,90,0.1)", border: "1px solid rgba(255,90,90,0.3)", color: "var(--accent-red)",
          }}>{error}</div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {!isLogin && (
            <div>
              <label style={{ display: "block", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: "var(--text-dim)", marginBottom: 6 }}>NAME</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} onKeyDown={handleKeyDown}
                placeholder="Your name"
                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, fontSize: 14, background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text)", outline: "none", boxSizing: "border-box" }} />
            </div>
          )}
          <div>
            <label style={{ display: "block", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: "var(--text-dim)", marginBottom: 6 }}>EMAIL</label>
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} onKeyDown={handleKeyDown}
              type="email" placeholder="you@school.edu"
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, fontSize: 14, background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text)", outline: "none", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ display: "block", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: "var(--text-dim)", marginBottom: 6 }}>PASSWORD</label>
            <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} onKeyDown={handleKeyDown}
              type="password" placeholder="••••••••"
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, fontSize: 14, background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text)", outline: "none", boxSizing: "border-box" }} />
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading}
          style={{
            width: "100%", padding: "14px 0", borderRadius: 10, fontSize: 15, fontWeight: 700, marginTop: 24,
            background: "var(--accent)", color: "var(--bg)", border: "none", cursor: "pointer",
            opacity: loading ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
          {loading && <Loader2 size={16} className="animate-spin" />}
          {isLogin ? "Log In" : "Create Account"}
        </button>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "var(--text-muted)" }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <Link to={isLogin ? "/signup" : "/login"} style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
            {isLogin ? "Sign up" : "Log in"}
          </Link>
        </p>
      </div>
    </div>
  );
}
