import { useState, useEffect } from "react";
import { Zap, Crown, Sparkles, Shield, Lock, Check, Loader2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getCreditPacks, createCheckout, changePassword } from "../api/client";

export default function AccountPage() {
  const { user, refreshUser } = useAuth();
  const [packs, setPacks] = useState({});
  const [buying, setBuying] = useState(null);
  const [buySuccess, setBuySuccess] = useState(null);
  const [pwForm, setPwForm] = useState({ current_password: "", new_password: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState(null);

  useEffect(() => { getCreditPacks().then(setPacks).catch(console.error); }, []);

  const isPremium = user?.has_purchased;

  const handleBuy = async (packId) => {
    setBuying(packId);
    setBuySuccess(null);
    try {
      const result = await createCheckout(packId);
      // Redirect to Stripe Checkout
      window.location.href = result.checkout_url;
    } catch (err) {
      setBuySuccess("Failed to start checkout. Try again.");
      setBuying(null);
    }
  };

  // Check for payment success/cancel from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      setBuySuccess("Payment successful! Credits have been added to your account.");
      refreshUser();
      window.history.replaceState({}, "", "/account");
    } else if (params.get("payment") === "cancelled") {
      setBuySuccess("Payment was cancelled.");
      window.history.replaceState({}, "", "/account");
    }
  }, []);

  const handleChangePassword = async () => {
    setPwLoading(true);
    setPwMessage(null);
    try {
      await changePassword(pwForm);
      setPwMessage({ type: "success", text: "Password changed successfully" });
      setPwForm({ current_password: "", new_password: "" });
    } catch (err) {
      setPwMessage({ type: "error", text: err.response?.data?.detail || "Failed to change password" });
    }
    setPwLoading(false);
  };

  return (
    <div className="animate-fade-up max-w-2xl">
      <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text)" }}>Account</h1>
      <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>{user?.email}</p>

      {/* Current Tier */}
      <div className="rounded-2xl p-6 mb-6" style={{
        background: isPremium ? `rgba(var(--accent-rgb), 0.06)` : "var(--bg-card)",
        border: `1px solid ${isPremium ? "var(--accent)" : "var(--border)"}`,
      }}>
        <div className="flex items-center gap-3 mb-3">
          {isPremium ? (
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `rgba(var(--accent-rgb), 0.15)` }}>
              <Crown size={20} style={{ color: "var(--accent)" }} />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--bg-hover)" }}>
              <Sparkles size={20} style={{ color: "var(--text-muted)" }} />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold" style={{ color: "var(--text)" }}>
                {isPremium ? "Premium AI" : "Standard AI"}
              </span>
              <span className="font-mono text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full" style={{
                background: isPremium ? "var(--accent)" : "var(--bg-hover)",
                color: isPremium ? "var(--bg)" : "var(--text-dim)",
              }}>
                {isPremium ? "PREMIUM · VERIFIED" : "STANDARD"}
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {isPremium
                ? "You're using premium AI with verified solutions — highest accuracy for coursework."
                : "Free tier uses standard AI. Buy credits for premium AI with verified, higher-accuracy solutions."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
          <div>
            <div className="flex items-center gap-2">
              <Zap size={14} style={{ color: "var(--accent)" }} />
              <span className="text-2xl font-bold" style={{ color: "var(--text)" }}>{user?.credits || 0}</span>
            </div>
            <span className="text-xs" style={{ color: "var(--text-dim)" }}>credits remaining</span>
          </div>
          <div className="flex-1">
            <div style={{ height: 6, borderRadius: 3, background: "var(--border)", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 3, transition: "width 0.3s",
                width: `${Math.min((user?.credits || 0) / 50 * 100, 100)}%`,
                background: isPremium ? "var(--accent)" : "var(--text-dim)",
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      {!isPremium && (
        <div className="rounded-2xl p-5 mb-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h3 className="font-mono text-[10px] tracking-[2px] font-bold mb-3" style={{ color: "var(--text-dim)" }}>HOW TIERS WORK</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl p-4" style={{ background: "var(--bg-hover)" }}>
              <div className="text-sm font-bold mb-1" style={{ color: "var(--text-muted)" }}>Standard AI (Free)</div>
              <ul className="text-xs space-y-1.5" style={{ color: "var(--text-dim)" }}>
                <li>• Gemini Flash AI engine</li>
                <li>• 3 free generations</li>
                <li>• Great for trying the platform</li>
                <li>• Good for simpler coursework</li>
              </ul>
            </div>
            <div className="rounded-xl p-4" style={{ background: `rgba(var(--accent-rgb), 0.04)`, border: `1px solid var(--accent)` }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold" style={{ color: "var(--accent)" }}>Premium AI</span>
                <Crown size={12} style={{ color: "var(--accent)" }} />
              </div>
              <ul className="text-xs space-y-1.5" style={{ color: "var(--text-muted)" }}>
                <li>• Claude Sonnet AI engine</li>
                <li>• Auto-verified solutions (checked & corrected)</li>
                <li>• Excels at complex proofs, math, and CS</li>
                <li>• Reads figures/graphs from your textbook PDFs</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Buy Credits */}
      <div className="rounded-2xl p-5 mb-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <h3 className="font-mono text-[10px] tracking-[2px] font-bold mb-4" style={{ color: "var(--text-dim)" }}>
          {isPremium ? "BUY MORE CREDITS" : "UPGRADE TO PREMIUM AI"}
        </h3>

        {buySuccess && (
          <div className="rounded-lg p-3 mb-4 text-sm" style={{
            background: "rgba(90,255,140,0.08)", border: "1px solid var(--accent-green)", color: "var(--accent-green)",
          }}>
            <Check size={14} className="inline mr-2" />{buySuccess}
          </div>
        )}

        <div className="space-y-3">
          {Object.entries(packs).map(([id, pack]) => (
            <div key={id} className="flex items-center justify-between rounded-xl p-4 transition" style={{
              background: "var(--bg-hover)", border: "1px solid var(--border)",
            }}>
              <div>
                <div className="text-sm font-bold" style={{ color: "var(--text)" }}>{pack.label}</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>
                  {pack.description} • ${(pack.price_cents / 100).toFixed(2)}
                </div>
              </div>
              <button onClick={() => handleBuy(id)} disabled={!!buying}
                className="font-mono text-[10px] font-bold tracking-wider px-4 py-2 rounded-lg transition disabled:opacity-50"
                style={{ background: "var(--accent)", color: "var(--bg)" }}>
                {buying === id ? <Loader2 size={12} className="animate-spin" /> : `$${(pack.price_cents / 100).toFixed(2)}`}
              </button>
            </div>
          ))}
        </div>

        <p className="text-[10px] mt-3" style={{ color: "var(--text-dim)" }}>
          All credit packs unlock Premium AI (Claude Sonnet). Credits never expire.
        </p>
      </div>

      {/* Change Password */}
      <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <h3 className="font-mono text-[10px] tracking-[2px] font-bold mb-4" style={{ color: "var(--text-dim)" }}>CHANGE PASSWORD</h3>

        {pwMessage && (
          <div className="rounded-lg p-3 mb-3 text-sm" style={{
            background: pwMessage.type === "success" ? "rgba(90,255,140,0.08)" : "rgba(255,90,90,0.08)",
            border: `1px solid ${pwMessage.type === "success" ? "var(--accent-green)" : "var(--accent-red)"}`,
            color: pwMessage.type === "success" ? "var(--accent-green)" : "var(--accent-red)",
          }}>{pwMessage.text}</div>
        )}

        <div className="space-y-3">
          <div>
            <label className="font-mono text-[10px] tracking-wider font-bold block mb-1.5" style={{ color: "var(--text-dim)" }}>CURRENT PASSWORD</label>
            <input type="password" value={pwForm.current_password} onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })}
              className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text)" }} />
          </div>
          <div>
            <label className="font-mono text-[10px] tracking-wider font-bold block mb-1.5" style={{ color: "var(--text-dim)" }}>NEW PASSWORD</label>
            <input type="password" value={pwForm.new_password} onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })}
              className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text)" }} />
          </div>
        </div>
        <button onClick={handleChangePassword} disabled={pwLoading || !pwForm.current_password || !pwForm.new_password}
          className="mt-4 font-mono text-xs font-bold tracking-wider px-5 py-2.5 rounded-lg transition disabled:opacity-30"
          style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}>
          {pwLoading ? "CHANGING..." : "CHANGE PASSWORD"}
        </button>
      </div>
    </div>
  );
}
