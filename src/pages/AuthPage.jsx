import { notify } from "../lib/notify";
import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, forgotPassword, logout as apiLogout } from "../lib/api";
import { useAuth } from "../lib/authState";
import { useLanguage } from "../lib/i18n/languageContext";

// Colour is not language-specific, so it stays out of the translation tables.
const ROLE_PULSE = {
  admin: "w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse",
  staff: "w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse",
};

function renderTitle([first, accent, last]) {
  return (
    <>
      {first} <br /> <span className="text-stroke italic font-fashion lowercase font-light">{accent}</span> <br /> {last}
    </>
  );
}

export default function AuthPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const s = t.authPage;
  const { setProfile } = useAuth();
  const [role, setRole] = useState(null); // null | "admin" | "staff"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const roleRef = useRef(role);
  roleRef.current = role;

  const handleSelectRole = (nextRole) => setRole(nextRole);
  const handleBack = () => setRole(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const selectedRole = roleRef.current;
    if (!selectedRole) {
      notify(s.notify.selectRole);
      return;
    }

    try {
      const profile = await login(email.trim(), password, remember);

      if (profile.mustResetPassword) {
        // A temporary (admin-set) password — must be replaced before anything else,
        // regardless of which portal they picked.
        setProfile(profile);
        navigate("/force-password-reset");
        return;
      }

      if (profile.accessLevel === "admin") {
        setProfile(profile);
        navigate(selectedRole === "admin" ? "/admin" : "/staff-profile");
      } else if (selectedRole === "admin") {
        // Picking the manager portal with a non-admin account is denied, same as before
        // — sign the session back out rather than leaving it half-authenticated.
        await apiLogout();
        notify(s.notify.noAdminAccess);
      } else {
        setProfile(profile);
        navigate("/staff-profile");
      }
    } catch (error) {
      console.error("Giriş xətası:", error);
      notify(s.notify.wrongCreds);
    }
  };

  const handleSendReset = async () => {
    const value = resetEmail.trim();
    if (!value) {
      notify(s.notify.enterEmail);
      return;
    }
    try {
      await forgotPassword(value);
      notify(s.notify.linkSent);
      setResetOpen(false);
    } catch (error) {
      console.error("Şifrə sıfırlama xətası:", error);
      notify(s.notify.emailNotFound);
    }
  };

  const copy = role ? s.roles[role] : null;

  return (
    <div className="antialiased text-white min-h-dvh relative overflow-x-hidden">
      <div className="fixed inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070"
          className="w-full h-full object-cover opacity-40 bg-animate grayscale"
          alt=""
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black" />
      </div>

      <main className="relative z-10 min-h-dvh flex flex-col items-center justify-center p-4 md:p-8">
        <div className="absolute top-8 left-8 md:top-12 md:left-20 flex flex-col gap-1">
          <h1 className="font-sync text-xl md:text-2xl font-bold tracking-tighter">GNC.</h1>
          <span className="text-[7px] md:text-[9px] tracking-[0.5em] text-white/20">6615-GENCLIK</span>
        </div>

        <div className="w-full max-w-[1000px] grid grid-cols-1 md:grid-cols-2 glass overflow-hidden rounded-sm min-h-[500px] md:min-h-[600px]">
          <div className="hidden md:flex flex-col justify-between p-10 lg:p-16 border-r border-white/10 bg-black/20">
            <div className="space-y-4">
              <span className="text-[9px] uppercase tracking-[0.8em] text-white/30">{s.portalSecure}</span>
              <h2 className="text-5xl lg:text-7xl font-black uppercase tracking-tighter leading-none">
                {copy ? renderTitle(copy.title) : renderTitle(s.defaultTitle)}
              </h2>
            </div>

            <div className="space-y-6">
              <p className="text-[10px] text-white/50 leading-relaxed uppercase tracking-widest max-w-[250px]">
                {copy ? copy.desc : s.defaultDesc}
              </p>
              <div className="flex items-center gap-3">
                <div className={copy ? ROLE_PULSE[role] : "w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse"} />
                <span className="text-[8px] uppercase tracking-widest text-white/30 font-mono">
                  {copy ? copy.status : s.defaultStatus}
                </span>
              </div>
            </div>
          </div>

          <div className="p-8 sm:p-12 md:p-16 lg:p-20 flex flex-col justify-center bg-black/60 md:bg-black/40 relative">
            {!role ? (
              <div className="space-y-10 md:space-y-12 transition-all duration-300">
                <div className="space-y-2 text-center md:text-left">
                  <h3 className="font-sync text-2xl md:text-3xl font-bold tracking-tighter">{s.selectType}</h3>
                  <p className="text-[9px] md:text-[10px] uppercase tracking-[0.4em] text-white/40">{s.selectTypeSub}</p>
                </div>

                <div className="space-y-4 pt-4">
                  <button
                    type="button"
                    onClick={() => handleSelectRole("admin")}
                    className="group relative w-full overflow-hidden border border-white/10 py-4 text-[10px] uppercase tracking-[0.5em] transition-all hover:border-white"
                  >
                    <span className="relative z-10 transition-colors duration-500 group-hover:text-black">
                      {s.managerBtn}
                    </span>
                    <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectRole("staff")}
                    className="group relative w-full overflow-hidden border border-white/10 py-4 text-[10px] uppercase tracking-[0.5em] transition-all hover:border-white"
                  >
                    <span className="relative z-10 transition-colors duration-500 group-hover:text-black">
                      {s.staffBtn}
                    </span>
                    <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-8 md:space-y-10 transition-all duration-300">
                <button
                  type="button"
                  onClick={handleBack}
                  className="text-[8px] uppercase tracking-[0.4em] text-white/40 hover:text-white transition flex items-center gap-2 absolute top-6 right-8"
                >
                  {s.backToSelect}
                </button>

                <div className="space-y-2 text-center md:text-left pt-4">
                  <h3 className="font-sync text-2xl md:text-3xl font-bold tracking-tighter">{copy.formTitle}</h3>
                  <p className="text-[9px] md:text-[10px] uppercase tracking-[0.4em] text-white/40">{copy.formSub}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
                  <input
                    type="email"
                    placeholder={copy.emailPh}
                    required
                    autoComplete="off"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent border-b border-white/10 py-4 text-[10px] md:text-[11px] tracking-[0.3em] outline-none focus:border-white transition-all placeholder:text-white/20"
                  />

                  <input
                    type="password"
                    placeholder={s.password}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent border-b border-white/10 py-4 text-[10px] md:text-[11px] tracking-[0.3em] outline-none focus:border-white transition-all placeholder:text-white/20"
                  />

                  <label className="flex items-center gap-2.5 text-[9px] uppercase tracking-[0.3em] text-white/40 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="accent-white"
                    />
                    {s.rememberMe}
                  </label>

                  <button
                    type="submit"
                    className="group relative w-full overflow-hidden border border-white/20 py-4 md:py-5 text-[9px] md:text-[10px] uppercase tracking-[0.6em] transition-all hover:border-white active:scale-[0.98]"
                  >
                    <span className="relative z-10 transition-colors duration-500 group-hover:text-black">
                      {s.submit}
                    </span>
                    <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                  </button>
                </form>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setResetOpen(true)}
                    className="text-[8px] uppercase tracking-[0.3em] text-white/20 hover:text-white transition-all"
                  >
                    {s.forgot}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 md:mt-0 md:absolute md:bottom-12 md:right-20">
          <Link
            to="/"
            className="text-[9px] uppercase tracking-[0.5em] text-white/30 hover:text-white transition-all duration-300"
          >
            {s.exit}
          </Link>
        </div>
      </main>

      {resetOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
          <div className="glass w-full max-w-md p-10 space-y-8 relative">
            <button
              type="button"
              onClick={() => setResetOpen(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition"
            >
              ✕
            </button>
            <div className="space-y-2">
              <h3 className="font-sync text-xl font-bold tracking-tighter">{s.resetTitle}</h3>
              <p className="text-[9px] uppercase tracking-[0.4em] text-white/40">{s.resetSub}</p>
            </div>
            <input
              type="email"
              placeholder={s.resetEmailPh}
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              className="w-full bg-transparent border-b border-white/10 py-4 text-[10px] tracking-[0.3em] outline-none focus:border-white transition-all"
            />
            <button
              type="button"
              onClick={handleSendReset}
              className="w-full border border-white/20 py-4 text-[9px] uppercase tracking-[0.5em] hover:bg-white hover:text-black transition-all"
            >
              {s.sendReset}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
