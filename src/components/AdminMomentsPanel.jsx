import { notify, confirmAsync } from "../lib/notify";
import { useEffect, useState } from "react";
import { listAllMoments, approveMoment, deleteMoment } from "../lib/api";
import AdminCommentsList from "./AdminCommentsList";
import { useLanguage } from "../lib/i18n/languageContext";

export default function AdminMomentsPanel() {
  const { t } = useLanguage();
  const s = t.adminPanel.moments;
  const [tab, setTab] = useState("pending"); // "pending" | "approved"
  // Both lists come from one Firestore read; switching tabs just picks one, so it no
  // longer re-downloads the whole approved_moments collection every time.
  const [items, setItems] = useState({ pending: [], approved: [] }); // null on error
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [expandedCommentsId, setExpandedCommentsId] = useState(null);

  const pendingCount = items ? items.pending.length : 0;
  const liveCount = items ? items.approved.length : 0;
  const list = items ? items[tab] : null;

  const loadMoments = async () => {
    setLoading(true);
    try {
      setItems(await listAllMoments());
    } catch (error) {
      console.error("Data oxunarkən xəta:", error);
      setItems(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMoments();
  }, []);

  // Moves or drops `id` locally after an action, so no re-fetch is needed. Approving
  // moves the item from pending into the live feed (newest first, matching the query).
  const removeFromView = (id, { toApproved, approvedItem } = {}) => {
    setItems((prev) => {
      if (!prev) return prev;
      const pending = prev.pending.filter((v) => v.id !== id);
      let approved = prev.approved.filter((v) => v.id !== id);
      if (toApproved && approvedItem) {
        approved = [approvedItem, ...approved].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      }
      return { pending, approved };
    });
  };

  const handleApprove = async (id) => {
    setBusyId(id);
    try {
      await approveMoment(id);
      notify(s.approved);
      const approvedItem = items?.pending.find((v) => v.id === id);
      removeFromView(id, { toApproved: true, approvedItem: approvedItem && { ...approvedItem, status: "approved" } });
    } catch (err) {
      notify(s.approveError + err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id) => {
    if (!(await confirmAsync(s.rejectConfirm))) return;
    setBusyId(id);
    try {
      await deleteMoment(id);
      removeFromView(id);
    } catch (err) {
      notify(s.rejectError + err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (id) => {
    if (!(await confirmAsync(s.removeConfirm))) return;
    setBusyId(id);
    try {
      await deleteMoment(id);
      notify(s.removed);
      removeFromView(id);
    } catch (err) {
      notify(s.removeError + err.message);
    } finally {
      setBusyId(null);
    }
  };

  const tabClass = (active) =>
    active
      ? "border border-white bg-white text-black text-[9px] font-bold tracking-widest px-4 py-2 uppercase transition cursor-pointer"
      : "border border-white/10 bg-transparent text-white/40 text-[9px] font-bold tracking-widest px-4 py-2 uppercase transition hover:border-white/20 cursor-pointer";

  return (
    <div className="my-8">
      <div className="glass p-8 rounded-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 mb-8 gap-4">
          <div>
            <h2 className="font-sync text-xs tracking-widest uppercase">{s.title}</h2>
            <p className="text-[9px] uppercase tracking-widest text-white/30 mt-1">{s.subtitle}</p>
          </div>

          <div className="flex gap-2 select-none">
            <button onClick={() => setTab("pending")} className={tabClass(tab === "pending")}>
              {s.pending} (<span>{pendingCount}</span>)
            </button>
            <button onClick={() => setTab("approved")} className={tabClass(tab === "approved")}>
              {s.live} (<span>{liveCount}</span>)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading && (
            <div className="col-span-full py-12 text-center text-white/40 text-[9px] tracking-widest uppercase font-light animate-pulse">
              {s.connecting}
            </div>
          )}

          {!loading && list === null && (
            <div className="col-span-full py-12 text-center text-red-500 text-[9px]">{s.error}</div>
          )}

          {!loading && list !== null && list.length === 0 && (
            <div className="col-span-full py-12 text-center text-white/20 text-[9px] tracking-widest uppercase font-light">
              {s.empty}
            </div>
          )}

          {!loading &&
            list?.map((video) => (
              <div
                key={video.id}
                className="border border-white/5 bg-white/[0.02] p-4 rounded-sm flex flex-col justify-between gap-4 transition-all hover:border-white/10"
              >
                <div className="relative aspect-[9/16] w-full max-h-[260px] bg-black/50 rounded-sm overflow-hidden border border-white/5">
                  <video src={video.url} className="w-full h-full object-cover" controls muted />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] text-white/30 tracking-widest uppercase">{s.caption}</span>
                  <p className="text-[10px] text-white/80 font-light tracking-wide leading-relaxed uppercase">
                    {video.caption}
                  </p>
                </div>

                <button
                  onClick={() => setExpandedCommentsId(expandedCommentsId === video.id ? null : video.id)}
                  className="text-[8px] text-white/40 hover:text-white uppercase tracking-widest flex items-center gap-1.5 cursor-pointer border-t border-white/5 pt-2"
                >
                  <i className="fa-solid fa-comment" />
                  {expandedCommentsId === video.id ? s.hideComments : s.showComments}
                </button>

                {expandedCommentsId === video.id && <AdminCommentsList videoId={video.id} />}

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
                  {tab === "pending" ? (
                    <>
                      <button
                        disabled={busyId === video.id}
                        onClick={() => handleApprove(video.id)}
                        className="bg-white text-black text-[9px] font-bold tracking-widest py-3 uppercase transition hover:bg-gray-50 cursor-pointer disabled:opacity-40"
                      >
                        {busyId === video.id ? s.wait : s.approve}
                      </button>
                      <button
                        disabled={busyId === video.id}
                        onClick={() => handleReject(video.id)}
                        className="bg-transparent border border-white/10 text-white/40 text-[9px] font-bold tracking-widest py-3 uppercase transition hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 cursor-pointer disabled:opacity-40"
                      >
                        {busyId === video.id ? s.rejecting : s.reject}
                      </button>
                    </>
                  ) : (
                    <button
                      disabled={busyId === video.id}
                      onClick={() => handleRemove(video.id)}
                      className="col-span-2 bg-transparent border border-red-500/30 text-red-500 text-[9px] font-bold tracking-widest py-3 uppercase transition hover:bg-red-500/10 hover:border-red-500 cursor-pointer disabled:opacity-40"
                    >
                      {busyId === video.id ? s.removing : s.removeLive}
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
