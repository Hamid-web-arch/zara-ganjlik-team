import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { notify } from "../lib/notify";
import { setPassword as setPasswordApi, logout } from "../lib/api";
import { useAuth } from "../lib/authState";
import { useLanguage } from "../lib/i18n/languageContext";
import EyeToggleButton from "../components/EyeToggleButton";

/**
 * Shown right after a member logs in with a temporary (admin-set) password — they must
 * choose their own before they can use anything else. useAuthGuard redirects here
 * whenever profile.mustResetPassword is true, so this page doesn't need its own guard.
 */
export default function ForcePasswordResetPage() {
  const navigate = useNavigate();
  const { profile, setProfile } = useAuth();
  const { t } = useLanguage();
  const s = t.authPage.forceReset;
  const [password, setPasswordInput] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) return notify(s.tooShort);
    if (password !== confirm) return notify(s.mismatch);

    setSubmitting(true);
    try {
      const { profile: updated } = await setPasswordApi(password);
      setProfile(updated);
      navigate(updated.accessLevel === "admin" ? "/admin" : "/staff-profile");
    } catch (error) {
      notify(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  return (
    <div className="antialiased text-white min-h-dvh relative overflow-x-hidden flex items-center justify-center p-4">
      <div className="fixed inset-0 z-0 bg-black" />
      <div className="relative z-10 w-full max-w-md glass p-10 space-y-8 rounded-sm">
        <div className="space-y-2">
          <h1 className="font-sync text-2xl font-bold tracking-tighter">{s.title}</h1>
          <p className="text-[11px] text-white/50 leading-relaxed">
            {s.subtitle.replace("{name}", profile?.name || "")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder={s.newPasswordPh}
              required
              value={password}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full bg-transparent border-b border-white/10 py-4 pr-7 text-[11px] tracking-[0.3em] outline-none focus:border-white transition-all placeholder:text-white/20"
            />
            <EyeToggleButton
              visible={showPassword}
              onToggle={() => setShowPassword((v) => !v)}
              className="text-white/30 hover:text-white"
            />
          </div>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              placeholder={s.confirmPh}
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full bg-transparent border-b border-white/10 py-4 pr-7 text-[11px] tracking-[0.3em] outline-none focus:border-white transition-all placeholder:text-white/20"
            />
            <EyeToggleButton
              visible={showConfirm}
              onToggle={() => setShowConfirm((v) => !v)}
              className="text-white/30 hover:text-white"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full border border-white/20 py-4 text-[9px] uppercase tracking-[0.5em] hover:bg-white hover:text-black transition-all disabled:opacity-40"
          >
            {submitting ? s.submitting : s.submit}
          </button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={handleLogout}
            className="text-[8px] uppercase tracking-[0.3em] text-white/20 hover:text-white transition-all"
          >
            {s.logout}
          </button>
        </div>
      </div>
    </div>
  );
}
