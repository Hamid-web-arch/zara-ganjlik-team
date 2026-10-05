import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  signOut,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

const ROLE_COPY = {
  admin: {
    formTitle: "MANAGER ACCESS",
    formSubtitle: "Admin credentials required",
    emailPlaceholder: "MANAGER EMAIL",
    leftTitle: (
      <>Manager <br /> <span className="text-stroke italic font-fashion lowercase font-light">vault</span> <br /> Access</>
    ),
    leftDesc: "Rəqəmsal idarəetmə panelinə daxil olmaq üçün menecer məlumatlarını daxil edin.",
    pulseClass: "w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse",
    statusText: "RESTRICTED AREA",
  },
  staff: {
    formTitle: "STAFF PORTAL",
    formSubtitle: "Employee access keys required",
    emailPlaceholder: "STAFF EMAIL",
    leftTitle: (
      <>Staff <br /> <span className="text-stroke italic font-fashion lowercase font-light">network</span> <br /> Stream</>
    ),
    leftDesc: "Zara daxili Moments platformasına qoşulmaq və profilinizi idarə etmək üçün işçi girişini tamamlayın.",
    pulseClass: "w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse",
    statusText: "STAFF AREA",
  },
};

const DEFAULT_LEFT_TITLE = (
  <>SYSTEM <br /> <span className="text-stroke italic font-fashion lowercase font-light">vault</span> <br /> ACCESS</>
);
const DEFAULT_LEFT_DESC =
  "Rəqəmsal idarəetmə və daxili sosial şəbəkə şəbəkəsinə keçid etmək üçün müvafiq giriş növünü seçin.";

export default function AuthPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState(null); // null | "admin" | "staff"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const roleRef = useRef(role);
  roleRef.current = role;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user || !window.location.pathname.includes("/auth")) return;

      try {
        const staffSnap = await getDoc(doc(db, "staff", user.uid));
        const crewSnap = await getDoc(doc(db, "crew", user.uid));
        const userData = staffSnap.exists()
          ? staffSnap.data()
          : crewSnap.exists()
          ? crewSnap.data()
          : null;

        if (!userData) {
          await signOut(auth);
          alert("İstifadəçi məlumatları tapılmadı.");
          return;
        }

        const userAccessLevel = userData.accessLevel; // 'admin' | 'user'
        const selectedRole = localStorage.getItem("user_role");

        if (userAccessLevel === "admin") {
          navigate(selectedRole === "admin" ? "/admin" : "/staff-profile");
        } else if (selectedRole === "admin") {
          // Any non-admin accessLevel (including unset/misspelled values) is denied
          // manager access — only "user" used to be checked, so an unexpected value
          // left the form stuck with no feedback.
          await signOut(auth);
          alert("Sizin admin panelinə giriş icazəniz yoxdur!");
        } else {
          navigate("/staff-profile");
        }
      } catch (error) {
        console.error("Auth Xətası:", error);
        await signOut(auth);
        alert("Giriş zamanı xəta baş verdi. Yenidən cəhd edin.");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleSelectRole = (nextRole) => setRole(nextRole);
  const handleBack = () => setRole(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const selectedRole = roleRef.current;
    if (!selectedRole) {
      alert("Zəhmət olmasa giriş növünü seçin.");
      return;
    }

    try {
      localStorage.setItem("user_role", selectedRole);
      await setPersistence(auth, browserLocalPersistence);
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // Redirect happens via onAuthStateChanged
    } catch (error) {
      console.error("Giriş xətası:", error);
      alert("Giriş rədd edildi: Məlumatlar yanlışdır.");
    }
  };

  const handleSendReset = async () => {
    const value = resetEmail.trim();
    if (!value) {
      alert("Email daxil edin.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, value);
      alert("Link göndərildi.");
      setResetOpen(false);
    } catch (error) {
      console.error("Şifrə sıfırlama xətası:", error);
      alert("Xəta: Email tapılmadı.");
    }
  };

  const copy = role ? ROLE_COPY[role] : null;

  return (
    <div className="antialiased text-white min-h-screen relative overflow-x-hidden">
      <div className="fixed inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070"
          className="w-full h-full object-cover opacity-40 bg-animate grayscale"
          alt=""
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black" />
      </div>

      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
        <div className="absolute top-8 left-8 md:top-12 md:left-20 flex flex-col gap-1">
          <h1 className="font-sync text-xl md:text-2xl font-bold tracking-tighter">GNC.</h1>
          <span className="text-[7px] md:text-[9px] tracking-[0.5em] text-white/20">6615-GENCLIK</span>
        </div>

        <div className="w-full max-w-[1000px] grid grid-cols-1 md:grid-cols-2 glass overflow-hidden rounded-sm min-h-[500px] md:min-h-[600px]">
          <div className="hidden md:flex flex-col justify-between p-10 lg:p-16 border-r border-white/10 bg-black/20">
            <div className="space-y-4">
              <span className="text-[9px] uppercase tracking-[0.8em] text-white/30">Portal Status: Secure</span>
              <h2 className="text-5xl lg:text-7xl font-black uppercase tracking-tighter leading-none">
                {copy ? copy.leftTitle : DEFAULT_LEFT_TITLE}
              </h2>
            </div>

            <div className="space-y-6">
              <p className="text-[10px] text-white/50 leading-relaxed uppercase tracking-widest max-w-[250px]">
                {copy ? copy.leftDesc : DEFAULT_LEFT_DESC}
              </p>
              <div className="flex items-center gap-3">
                <div className={copy ? copy.pulseClass : "w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse"} />
                <span className="text-[8px] uppercase tracking-widest text-white/30 font-mono">
                  {copy ? copy.statusText : "GATEWAY AREA"}
                </span>
              </div>
            </div>
          </div>

          <div className="p-8 sm:p-12 md:p-16 lg:p-20 flex flex-col justify-center bg-black/60 md:bg-black/40 relative">
            {!role ? (
              <div className="space-y-10 md:space-y-12 transition-all duration-300">
                <div className="space-y-2 text-center md:text-left">
                  <h3 className="font-sync text-2xl md:text-3xl font-bold tracking-tighter">SELECT TYPE</h3>
                  <p className="text-[9px] md:text-[10px] uppercase tracking-[0.4em] text-white/40">
                    Giriş növünü müəyyən edin
                  </p>
                </div>

                <div className="space-y-4 pt-4">
                  <button
                    type="button"
                    onClick={() => handleSelectRole("admin")}
                    className="group relative w-full overflow-hidden border border-white/10 py-4 text-[10px] uppercase tracking-[0.5em] transition-all hover:border-white"
                  >
                    <span className="relative z-10 transition-colors duration-500 group-hover:text-black">
                      MANAGER / ADMIN
                    </span>
                    <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectRole("staff")}
                    className="group relative w-full overflow-hidden border border-white/10 py-4 text-[10px] uppercase tracking-[0.5em] transition-all hover:border-white"
                  >
                    <span className="relative z-10 transition-colors duration-500 group-hover:text-black">
                      STAFF / MEMBER
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
                  ← SEÇİMƏ QAYIT
                </button>

                <div className="space-y-2 text-center md:text-left pt-4">
                  <h3 className="font-sync text-2xl md:text-3xl font-bold tracking-tighter">{copy.formTitle}</h3>
                  <p className="text-[9px] md:text-[10px] uppercase tracking-[0.4em] text-white/40">
                    {copy.formSubtitle}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
                  <input
                    type="email"
                    placeholder={copy.emailPlaceholder}
                    required
                    autoComplete="off"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent border-b border-white/10 py-4 text-[10px] md:text-[11px] tracking-[0.3em] outline-none focus:border-white transition-all placeholder:text-white/20"
                  />

                  <input
                    type="password"
                    placeholder="PASSWORD"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent border-b border-white/10 py-4 text-[10px] md:text-[11px] tracking-[0.3em] outline-none focus:border-white transition-all placeholder:text-white/20"
                  />

                  <button
                    type="submit"
                    className="group relative w-full overflow-hidden border border-white/20 py-4 md:py-5 text-[9px] md:text-[10px] uppercase tracking-[0.6em] transition-all hover:border-white active:scale-[0.98]"
                  >
                    <span className="relative z-10 transition-colors duration-500 group-hover:text-black">
                      Verify & Enter
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
                    Forgot password?
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
            [ Exit System ]
          </Link>
        </div>
      </main>

      {resetOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="glass w-full max-w-md p-10 space-y-8 relative">
            <button
              type="button"
              onClick={() => setResetOpen(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition"
            >
              ✕
            </button>
            <div className="space-y-2">
              <h3 className="font-sync text-xl font-bold tracking-tighter">RESET ACCESS</h3>
              <p className="text-[9px] uppercase tracking-[0.4em] text-white/40">Enter manager email for link</p>
            </div>
            <input
              type="email"
              placeholder="EMAIL ADDRESS"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              className="w-full bg-transparent border-b border-white/10 py-4 text-[10px] tracking-[0.3em] outline-none focus:border-white transition-all"
            />
            <button
              type="button"
              onClick={handleSendReset}
              className="w-full border border-white/20 py-4 text-[9px] uppercase tracking-[0.5em] hover:bg-white hover:text-black transition-all"
            >
              Send Reset Link
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
