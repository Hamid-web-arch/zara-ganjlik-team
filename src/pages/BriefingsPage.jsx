import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuthGuard } from "../hooks/useAuthGuard";
import { useLanguage } from "../lib/i18n/languageContext";

export default function BriefingsPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { authorized } = useAuthGuard({ onError: () => navigate("/auth") });
  const [briefings, setBriefings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authorized) return;
    (async () => {
      setLoading(true);
      try {
        const snap = await getDocs(query(collection(db, "briefings"), orderBy("createdAt", "desc")));
        setBriefings(snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
      } catch (error) {
        console.error("Breefinglər yüklənərkən xəta:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [authorized]);

  if (!authorized) {
    return (
      <div className="fixed inset-0 bg-black flex justify-center items-center z-[9999]">
        <p className="text-[10px] tracking-[0.5em] uppercase text-white animate-pulse">{t.common.authenticating}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto p-6 md:p-12">
        <div className="flex items-center justify-between mb-10 md:mb-12">
          <div>
            <h1 className="font-sync text-lg md:text-2xl font-bold tracking-tighter uppercase">{t.briefings.title}</h1>
            <p className="text-[9px] uppercase tracking-[0.4em] text-white/40 mt-1">{t.briefings.subtitle}</p>
          </div>
          <Link
            to="/"
            className="text-[9px] uppercase tracking-widest border border-white/10 px-4 py-2 hover:bg-white hover:text-black transition shrink-0"
          >
            {t.common.back}
          </Link>
        </div>

        {loading && (
          <p className="text-center text-white/40 text-[10px] uppercase tracking-widest py-20 animate-pulse">
            {t.common.loading}
          </p>
        )}

        {!loading && briefings.length === 0 && (
          <p className="text-center text-white/20 text-[10px] uppercase tracking-widest py-20">{t.briefings.empty}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {briefings.map((b) => (
            <Link key={b.id} to={`/briefings/${b.id}`} className="group block">
              <div className="relative aspect-video bg-zinc-900 overflow-hidden rounded-sm border border-white/10">
                <video src={b.url} className="w-full h-full object-cover" muted preload="metadata" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
                  <i className="fa-solid fa-play text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <p className="mt-3 text-[11px] tracking-wide text-white group-hover:text-white/70 transition-colors line-clamp-2">
                {b.title}
              </p>
              <p className="text-[9px] uppercase tracking-widest text-white/30 mt-1">
                {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : ""}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
