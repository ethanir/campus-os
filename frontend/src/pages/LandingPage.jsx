import { Link } from "react-router-dom";
import { Sparkles, Upload, GraduationCap, FileCheck, Eye, Zap, Shield, BookOpen } from "lucide-react";

export default function LandingPage() {
  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", minHeight: "100vh" }}>
      <style>{`
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.6s ease both; }
        .fade-up-2 { animation: fadeUp 0.6s ease 0.15s both; }
        .fade-up-3 { animation: fadeUp 0.6s ease 0.3s both; }
        .fade-up-4 { animation: fadeUp 0.6s ease 0.45s both; }
      `}</style>

      {/* Nav */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 40px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--accent)", boxShadow: "0 0 12px var(--accent)" }} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>EZ SCHOOL AI</span>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Link to="/login" style={{
            padding: "8px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600,
            color: "var(--text-muted)", textDecoration: "none", transition: "all 0.2s",
          }}>Log in</Link>
          <Link to="/signup" style={{
            padding: "8px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600,
            background: "var(--accent)", color: "var(--bg)", textDecoration: "none", transition: "all 0.2s",
          }}>Get Started Free</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: "center", padding: "80px 40px 60px", maxWidth: 900, margin: "0 auto" }}>
        <div className="fade-up" style={{
          display: "inline-block", padding: "6px 16px", borderRadius: 20, marginBottom: 24,
          background: `rgba(var(--accent-rgb), 0.1)`, border: `1px solid var(--accent)`,
          fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: "var(--accent)",
        }}>
          YOUR COURSE MATERIALS → AI THAT KNOWS YOUR CLASS
        </div>
        <h1 className="fade-up-2" style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.15, marginBottom: 20, letterSpacing: -1 }}>
          The AI that actually<br />
          <span style={{ color: "var(--accent)" }}>knows your course</span>
        </h1>
        <p className="fade-up-3" style={{ fontSize: 18, lineHeight: 1.7, color: "var(--text-muted)", maxWidth: 620, margin: "0 auto 36px" }}>
          Upload your slides, textbooks, and assignments. Our AI learns your professor's methods, notation, and style — then completes homework and generates study guides exactly how your class teaches it.
        </p>
        <div className="fade-up-4" style={{ display: "flex", gap: 14, justifyContent: "center" }}>
          <Link to="/signup" style={{
            padding: "14px 36px", borderRadius: 10, fontSize: 16, fontWeight: 700,
            background: "var(--accent)", color: "var(--bg)", textDecoration: "none",
            boxShadow: `0 4px 24px rgba(var(--accent-rgb), 0.3)`, transition: "all 0.2s",
          }}>Start Free — 3 AI Generations</Link>
        </div>
        <p className="fade-up-4" style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 12 }}>No credit card required</p>
      </section>

      {/* Problem → Solution */}
      <section style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 40px 80px" }}>
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24,
          padding: 32, borderRadius: 20, background: "var(--bg-card)", border: "1px solid var(--border)",
        }}>
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--accent-red)", marginBottom: 16, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1.5 }}>THE PROBLEM</h3>
            <div style={{ fontSize: 15, lineHeight: 1.8, color: "var(--text-muted)" }}>
              ChatGPT doesn't know your professor's notation. Generic AI gives generic answers. You spend hours copy-pasting slides, textbook chapters, and assignment specs into AI chats just to get course-specific help.
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--accent-green)", marginBottom: 16, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1.5 }}>THE SOLUTION</h3>
            <div style={{ fontSize: 15, lineHeight: 1.8, color: "var(--text-muted)" }}>
              EZ School AI stores all your course materials permanently. Every AI generation uses your actual slides, textbook, and professor's methods as context. It completes work exactly like a top student in YOUR class would.
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ maxWidth: 1000, margin: "0 auto", padding: "0 40px 80px" }}>
        <h2 style={{ textAlign: "center", fontSize: 32, fontWeight: 800, marginBottom: 12 }}>What it does</h2>
        <p style={{ textAlign: "center", fontSize: 16, color: "var(--text-muted)", marginBottom: 48, maxWidth: 500, margin: "0 auto 48px" }}>
          Upload once. Generate everything.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
          {[
            {
              icon: FileCheck, color: "var(--accent-green)", title: "Turn-in Ready Homework",
              desc: "Generates a complete submission using your professor's exact methods and notation. Ready to submit for 100%.",
            },
            {
              icon: Eye, color: "var(--accent-secondary)", title: "Study Version",
              desc: "Same homework, but with detailed step-by-step explanations for every problem so you actually learn it.",
            },
            {
              icon: GraduationCap, color: "var(--accent)", title: "Exam Study Guides",
              desc: "Turns all your slides and textbook chapters into a comprehensive study guide. Every theorem, every problem type, every formula.",
            },
            {
              icon: Upload, color: "var(--accent-pink)", title: "Upload Anything",
              desc: "PDFs, slides, textbooks, assignment specs. The AI reads everything and uses it as context for every generation.",
            },
            {
              icon: Sparkles, color: "var(--accent)", title: "Course-Specific AI",
              desc: "Not generic answers. Every response is grounded in YOUR actual course materials, YOUR professor's style.",
            },
            {
              icon: Zap, color: "#FFA35A", title: "Screenshot Import",
              desc: "Screenshot your Blackboard or Banner schedule. AI reads it and creates all your courses in seconds.",
            },
          ].map(({ icon: Icon, color, title, desc }, i) => (
            <div key={i} style={{
              padding: 24, borderRadius: 16, background: "var(--bg-card)", border: "1px solid var(--border)",
              transition: "all 0.2s",
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
                background: `${color}15`, marginBottom: 16,
              }}>
                <Icon size={20} style={{ color }} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{title}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-muted)" }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ maxWidth: 1000, margin: "0 auto", padding: "0 40px 80px" }}>
        <h2 style={{ textAlign: "center", fontSize: 32, fontWeight: 800, marginBottom: 48 }}>How it works</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 32 }}>
          {[
            { step: "1", title: "Add your courses", desc: "Import from a schedule screenshot or add manually. Takes 10 seconds." },
            { step: "2", title: "Upload materials", desc: "Drop in your slides, textbook chapters, assignment PDFs, announcements. Everything." },
            { step: "3", title: "Generate anything", desc: "Turn-in ready homework, study guides, step-by-step explanations — all using YOUR course content." },
          ].map(({ step, title, desc }, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{
                width: 48, height: 48, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                background: "var(--accent)", color: "var(--bg)", fontSize: 20, fontWeight: 800, margin: "0 auto 16px",
              }}>{step}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{title}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-muted)" }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section style={{ maxWidth: 1000, margin: "0 auto", padding: "0 40px 80px" }}>
        <h2 style={{ textAlign: "center", fontSize: 32, fontWeight: 800, marginBottom: 12 }}>Simple pricing</h2>
        <p style={{ textAlign: "center", fontSize: 16, color: "var(--text-muted)", marginBottom: 48 }}>
          Start free. Buy credits when you need them.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
          {[
            { name: "Free", price: "$0", period: "", credits: "3 AI generations", features: ["Unlimited courses", "Unlimited uploads", "3 AI generations total"], cta: "Get Started", highlight: false },
            { name: "Starter", price: "$4.99", period: "", credits: "50 credits", features: ["Everything in Free", "50 AI generations", "Buy anytime, no subscription"], cta: "Buy Credits", highlight: true },
            { name: "Pro Pack", price: "$9.99", period: "", credits: "150 credits", features: ["Everything in Free", "150 AI generations", "Best value per credit"], cta: "Buy Credits", highlight: false },
          ].map(({ name, price, credits, features, cta, highlight }, i) => (
            <div key={i} style={{
              padding: 28, borderRadius: 16, textAlign: "center",
              background: highlight ? `rgba(var(--accent-rgb), 0.05)` : "var(--bg-card)",
              border: `${highlight ? 2 : 1}px solid ${highlight ? "var(--accent)" : "var(--border)"}`,
            }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{name}</h3>
              <div style={{ fontSize: 36, fontWeight: 800, marginBottom: 4 }}>{price}</div>
              <div style={{ fontSize: 13, color: "var(--accent)", fontWeight: 600, marginBottom: 20 }}>{credits}</div>
              {features.map((f, j) => (
                <div key={j} style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 2 }}>{f}</div>
              ))}
              <Link to="/signup" style={{
                display: "block", marginTop: 20, padding: "12px 0", borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: "none",
                background: highlight ? "var(--accent)" : "var(--bg-hover)",
                color: highlight ? "var(--bg)" : "var(--text-muted)",
                border: `1px solid ${highlight ? "var(--accent)" : "var(--border)"}`,
              }}>{cta}</Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ textAlign: "center", padding: "60px 40px 80px" }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Stop wasting hours prompting AI</h2>
        <p style={{ fontSize: 16, color: "var(--text-muted)", marginBottom: 28 }}>Upload your materials once. Let AI that knows your course do the rest.</p>
        <Link to="/signup" style={{
          padding: "14px 36px", borderRadius: 10, fontSize: 16, fontWeight: 700,
          background: "var(--accent)", color: "var(--bg)", textDecoration: "none",
        }}>Get Started Free</Link>
      </section>

      {/* Footer */}
      <footer style={{ textAlign: "center", padding: "24px 40px", borderTop: "1px solid var(--border)", fontSize: 12, color: "var(--text-dim)" }}>
        © 2026 EZ School AI. All rights reserved.
      </footer>
    </div>
  );
}
