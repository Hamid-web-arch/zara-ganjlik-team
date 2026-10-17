import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { notify } from "../lib/notify";
import { resetPassword } from "../lib/api";
import { useLanguage } from "../lib/i18n/languageContext";
import EyeToggleButton from "../components/EyeToggleButton";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const { t } = useLanguage();
  const s = t.authPage.resetPasswordPage;
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return notify(s.invalidLink);
    if (password.length < 8) return notify(s.tooShort);
    if (password !== confirm) return notify(s.mismatch);

    setSubmitting(true);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (error) {
      notify(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="antialiased text-white min-h-dvh relative overflow-x-hidden flex items-center justify-center p-4">
      <div className="fixed inset-0 z-0 bg-black" />
      <div className="relative z-10 w-full max-w-md glass p-10 space-y-8 rounded-sm">
        <h1 className="font-sync text-2xl font-bold tracking-tighter">{s.title}</h1>

        {!token ? (
          <p className="text-[11px] text-white/60">{s.invalidLink}</p>
        ) : done ? (
          <div className="space-y-6">
            <p className="text-[11px] text-white/70">{s.success}</p>
            <Link
              to="/auth"
              className="block text-center w-full border border-white/20 py-4 text-[9px] uppercase tracking-[0.5em] hover:bg-white hover:text-black transition-all"
            >
              {s.backToLogin}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder={s.newPasswordPh}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
        )}
      </div>
    </div>
  );
}
