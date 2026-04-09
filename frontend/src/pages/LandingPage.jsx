import { Link } from "react-router-dom";
import { Sparkles, Upload, GraduationCap, FileCheck, Eye, Zap, Crown, BookOpen, Check, X } from "lucide-react";

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
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>YOURCOURSE AI</span>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Link to="/login" style={{ padding: "8px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600, color: "var(--text-muted)", textDecoration: "none" }}>Log in</Link>
          <Link to="/signup" style={{ padding: "8px 24px", borderRadius: 8, fontSize: 14, fontWeight: 700, background: "var(--accent)", color: "var(--bg)", textDecoration: "none" }}>Get Started Free</Link>
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
            boxShadow: `0 4px 24px rgba(var(--accent-rgb), 0.3)`,
          }}>Try Free — No Credit Card</Link>
        </div>
        <p className="fade-up-4" style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 12 }}>3 free AI generations to try it out</p>
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
              ChatGPT doesn't know your professor's notation. Generic AI gives generic answers that use the wrong methods. You spend hours copy-pasting slides, textbook chapters, and assignment specs into AI chats — and the results still aren't course-specific.
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--accent-green)", marginBottom: 16, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1.5 }}>THE SOLUTION</h3>
            <div style={{ fontSize: 15, lineHeight: 1.8, color: "var(--text-muted)" }}>
              YourCourse AI stores all your course materials permanently. Every AI generation uses your actual slides, textbook, and professor's methods as context. It doesn't just give you an answer — it completes work exactly like a top student in YOUR class would, using YOUR professor's notation and methods.
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
            { icon: FileCheck, color: "var(--accent-green)", title: "Turn-in Ready Homework", desc: "Generates a complete, submission-ready solution using your professor's exact methods and notation. Ready for 100%." },
            { icon: Eye, color: "var(--accent-secondary)", title: "Study Version", desc: "Same homework, but every step explained in detail — what concept applies, why, and how. Like having a private tutor." },
            { icon: GraduationCap, color: "var(--accent)", title: "Exam Study Guides", desc: "Turns all your slides and textbook chapters into a massive study guide. Every theorem, problem type, formula, and worked example." },
            { icon: Upload, color: "var(--accent-pink)", title: "Upload Anything", desc: "PDFs, slides, textbooks, assignment specs, announcements. The AI reads everything and uses it as context for every generation." },
            { icon: Sparkles, color: "var(--accent)", title: "Course-Specific AI", desc: "Not generic answers. Every response is grounded in YOUR actual course materials, YOUR professor's methods, YOUR notation." },
            { icon: Zap, color: "#FFA35A", title: "Screenshot Import", desc: "Screenshot your Blackboard or Banner schedule. AI reads it and auto-creates all your courses in seconds." },
          ].map(({ icon: Icon, color, title, desc }, i) => (
            <div key={i} style={{ padding: 24, borderRadius: 16, background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: `${color}15`, marginBottom: 16 }}>
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
            { step: "2", title: "Upload materials", desc: "Drop in your slides, textbook chapters, assignment PDFs, announcements — everything from your class." },
            { step: "3", title: "Generate anything", desc: "Turn-in ready homework, study guides, step-by-step explanations — all using YOUR course content and professor's methods." },
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

      {/* AI Tiers Comparison */}
      <section style={{ maxWidth: 1000, margin: "0 auto", padding: "0 40px 80px" }}>
        <h2 style={{ textAlign: "center", fontSize: 32, fontWeight: 800, marginBottom: 12 }}>Two AI engines. You choose.</h2>
        <p style={{ textAlign: "center", fontSize: 16, color: "var(--text-muted)", marginBottom: 48 }}>
          Try free with standard AI. Upgrade for premium results.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* Standard */}
          <div style={{ padding: 28, borderRadius: 16, background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <Sparkles size={20} style={{ color: "var(--text-muted)" }} />
              <h3 style={{ fontSize: 20, fontWeight: 700 }}>Standard AI</h3>
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, marginBottom: 4 }}>Free</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>3 AI generations</div>
            <div style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 20, padding: "8px 12px", borderRadius: 8, background: "var(--bg-hover)", fontFamily: "'JetBrains Mono', monospace" }}>
              Powered by Gemini Flash
            </div>
            {[
              { has: true, text: "Upload unlimited courses & files" },
              { has: true, text: "3 AI generations to try" },
              { has: true, text: "All features included" },
              { has: false, text: "May miss details on complex work" },
              { has: false, text: "Less precise with notation" },
            ].map(({ has, text }, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--text-muted)", lineHeight: 2.2 }}>
                {has ? <Check size={14} style={{ color: "var(--accent-green)", flexShrink: 0 }} /> : <X size={14} style={{ color: "var(--text-dim)", flexShrink: 0 }} />}
                {text}
              </div>
            ))}
            <Link to="/signup" style={{
              display: "block", marginTop: 24, padding: "12px 0", borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: "none", textAlign: "center",
              background: "var(--bg-hover)", color: "var(--text-muted)", border: "1px solid var(--border)",
            }}>Start Free</Link>
          </div>

          {/* Premium */}
          <div style={{ padding: 28, borderRadius: 16, background: `rgba(var(--accent-rgb), 0.04)`, border: `2px solid var(--accent)` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <Crown size={20} style={{ color: "var(--accent)" }} />
              <h3 style={{ fontSize: 20, fontWeight: 700 }}>Premium AI</h3>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: 1.5,
                padding: "3px 8px", borderRadius: 6, background: "var(--accent)", color: "var(--bg)",
              }}>RECOMMENDED</span>
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, marginBottom: 4 }}>
              $4.99<span style={{ fontSize: 16, fontWeight: 500, color: "var(--text-muted)" }}> / 50 credits</span>
            </div>
            <div style={{ fontSize: 13, color: "var(--accent)", fontWeight: 600, marginBottom: 20 }}>~$0.10 per generation</div>
            <div style={{ fontSize: 13, color: "var(--accent)", marginBottom: 20, padding: "8px 12px", borderRadius: 8, background: `rgba(var(--accent-rgb), 0.08)`, fontFamily: "'JetBrains Mono', monospace", border: `1px solid var(--accent)` }}>
              Powered by Claude Sonnet
            </div>
            {[
              { text: "Everything in Standard" },
              { text: "Significantly more accurate results" },
              { text: "Precise with professor's notation" },
              { text: "Better at complex proofs & math" },
              { text: "Follows course methods exactly" },
            ].map(({ text }, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--text)", lineHeight: 2.2 }}>
                <Check size={14} style={{ color: "var(--accent)", flexShrink: 0 }} />
                {text}
              </div>
            ))}
            <Link to="/signup" style={{
              display: "block", marginTop: 24, padding: "12px 0", borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: "none", textAlign: "center",
              background: "var(--accent)", color: "var(--bg)", boxShadow: `0 4px 16px rgba(var(--accent-rgb), 0.3)`,
            }}>Try Free, Then Upgrade</Link>
          </div>
        </div>

        <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-dim)", marginTop: 20 }}>
          Credit packs: 50 for $4.99 · 150 for $9.99 · 500 for $24.99 — credits never expire
        </p>
      </section>

      {/* FAQ */}
      <section style={{ maxWidth: 800, margin: "0 auto", padding: "0 40px 80px" }}>
        <h2 style={{ textAlign: "center", fontSize: 32, fontWeight: 800, marginBottom: 48 }}>FAQ</h2>
        {[
          { q: "How is this different from ChatGPT or StudyX?", a: "Those tools don't know your course. They give generic answers using general knowledge. YourCourse AI stores your actual slides, textbook, and assignments — every AI generation uses YOUR course materials as context, so answers use your professor's exact methods and notation." },
          { q: "What's the difference between Standard and Premium AI?", a: "Standard AI (Gemini Flash) is free and works well for simpler tasks. Premium AI (Claude Sonnet) is significantly more accurate, especially for complex proofs, multi-step math problems, and matching your professor's specific notation. Most students upgrade after trying their first generation." },
          { q: "Will my professor know I used this?", a: "The AI uses your course's actual methods and notation — the output looks like a well-prepared student's work, not like AI-generated text. It solves problems the way your class teaches, not with random methods from the internet." },
          { q: "What file types can I upload?", a: "PDF, PowerPoint (.pptx), Word documents, and plain text files. Upload slides, textbook chapters, assignment specs, syllabi, announcements — anything from your course." },
          { q: "Do credits expire?", a: "No. Buy credits whenever you need them — before midterms, finals, or whenever you have a tough assignment. They stay in your account forever." },
        ].map(({ q, a }, i) => (
          <div key={i} style={{ marginBottom: 24, padding: "20px 24px", borderRadius: 16, background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{q}</h3>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--text-muted)" }}>{a}</p>
          </div>
        ))}
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
        © 2026 YourCourse AI. All rights reserved.
      </footer>
    </div>
  );
}
