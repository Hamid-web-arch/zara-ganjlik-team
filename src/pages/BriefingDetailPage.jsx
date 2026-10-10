import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getBriefing } from "../lib/api";
import { useAuthGuard } from "../hooks/useAuthGuard";
import BriefingReactions from "../components/BriefingReactions";
import { useLanguage } from "../lib/i18n/languageContext";

export default function BriefingDetailPage() {
  const { id } = useParams();
  const { t } = useLanguage();
  const { authorized } = useAuthGuard();
  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authorized) return;
    setLoading(true);
    getBriefing(id)
      .then(setBriefing)
      .catch((error) => console.error("Breefing yüklənərkən xəta:", error))
      .finally(() => setLoading(false));
  }, [authorized, id]);

  if (!authorized) {
    return (
      <div className="fixed inset-0 bg-black flex justify-center items-center z-[9999]">
        <p className="text-[10px] tracking-[0.5em] uppercase text-white animate-pulse">{t.common.authenticating}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto p-6 md:p-12">
        <Link
          to="/briefings"
          className="text-[9px] uppercase tracking-widest text-white/40 hover:text-white transition inline-flex items-center gap-2 mb-8"
        >
          <i className="fa-solid fa-arrow-left" /> {t.briefings.backToList}
        </Link>

        {loading && (
          <p className="text-center text-white/40 text-[10px] uppercase tracking-widest py-20 animate-pulse">
            {t.common.loading}
          </p>
        )}

        {!loading && !briefing && (
          <p className="text-center text-white/20 text-[10px] uppercase tracking-widest py-20">{t.briefings.notFound}</p>
        )}

        {!loading && briefing && (
          <>
            <div className="w-full aspect-video bg-zinc-900 rounded-sm overflow-hidden border border-white/10">
              <video src={briefing.url} className="w-full h-full" controls playsInline />
            </div>

            <div className="mt-6 space-y-2">
              <h1 className="text-lg md:text-2xl font-bold tracking-tight">{briefing.title}</h1>
              <p className="text-[9px] uppercase tracking-widest text-white/30">
                {briefing.createdAt ? new Date(briefing.createdAt).toLocaleDateString() : ""}
              </p>
              {briefing.description && (
                <p className="text-sm text-white/70 leading-relaxed pt-2 whitespace-pre-line">
                  {briefing.description}
                </p>
              )}
            </div>

            <div className="mt-10 border-t border-white/10 pt-8">
              <BriefingReactions
                briefingId={briefing.id}
                reactions={briefing.reactions || {}}
                onChange={(reactions) => setBriefing((prev) => ({ ...prev, reactions }))}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
