import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getCountFromServer, getDocs, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuthGuard } from "../hooks/useAuthGuard";
import MomentCard from "../components/MomentCard";
import UploadMomentModal from "../components/UploadMomentModal";

const DEFAULT_AVATAR =
  "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

export default function MomentsPage() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const hasInteractedRef = useRef(false);
  const { authorized, profile } = useAuthGuard({ onError: () => navigate("/auth") });
  const currentUser = profile
    ? { uid: profile.uid, name: profile.name || profile.authEmail || "Staff Member", image: profile.image || DEFAULT_AVATAR }
    : null;
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [commentCounts, setCommentCounts] = useState({});

  const loadApprovedVideos = useCallback(async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(query(collection(db, "approved_moments"), where("status", "==", "approved")));
      const list = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setVideos(list);

      // Count aggregations return only a number, so this never downloads comment documents
      // (the previous version read every comment on every page load just to count them).
      const entries = await Promise.all(
        list.map(async (video) => {
          const countSnap = await getCountFromServer(
            query(collection(db, "comments"), where("videoId", "==", video.id))
          );
          return [video.id, countSnap.data().count];
        })
      );
      setCommentCounts(Object.fromEntries(entries));
    } catch (error) {
      console.error("Moments məlumatları çəkilərkən xəta:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authorized) loadApprovedVideos();
  }, [authorized, loadApprovedVideos]);

  const handleCommentCountChange = (videoId, count) => {
    setCommentCounts((prev) => ({ ...prev, [videoId]: count }));
  };

  if (!authorized) {
    return (
      <div className="fixed inset-0 bg-black flex justify-center items-center z-[9999]">
        <p className="text-[10px] tracking-[0.5em] uppercase text-white animate-pulse">Authenticating...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[150] bg-black text-white overflow-hidden">
      <div className="absolute top-0 left-0 w-full z-50 flex justify-between items-end px-6 md:px-12 pt-8 pb-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-baseline gap-2">
          <h1 className="text-2xl md:text-3xl font-black tracking-[-0.15em] text-white">ZARA</h1>
          <span className="text-[10px] md:text-xs font-light tracking-[0.2em] uppercase opacity-70 text-white">
            STAFF MOMENTS
          </span>
        </div>
        <div className="flex items-center gap-6 text-white">
          <button
            onClick={() => setUploadOpen(true)}
            className="hover:opacity-60 transition-opacity text-[10px] uppercase tracking-widest font-bold flex items-center gap-2 cursor-pointer"
          >
            <span>YENİ AN PAYLAŞ</span>
            <i className="fa-solid fa-plus" />
          </button>
          <button
            onClick={() => navigate("/")}
            className="hover:opacity-60 transition-opacity text-[10px] uppercase tracking-widest font-bold flex items-center gap-2 cursor-pointer"
          >
            <span>GERİ</span>
            <i className="fa-solid fa-arrow-left" />
          </button>
        </div>
      </div>

      <div ref={containerRef} className="zara-container w-full h-full bg-black">
        {loading && (
          <div className="zara-card w-full h-full flex items-center justify-center bg-black text-white">
            <p className="text-[10px] tracking-widest font-light text-gray-400 uppercase animate-pulse">
              YÜKLƏNİR...
            </p>
          </div>
        )}

        {!loading && videos.length === 0 && (
          <div className="zara-card w-full h-full flex items-center justify-center bg-black text-white">
            <p className="text-[10px] tracking-widest font-light text-gray-400 uppercase">No moments shared yet.</p>
          </div>
        )}

        {!loading &&
          videos.map((video) => (
            <MomentCard
              key={video.id}
              video={video}
              containerRef={containerRef}
              hasInteractedRef={hasInteractedRef}
              currentUser={currentUser}
              commentCount={commentCounts[video.id]}
              onCommentCountChange={handleCommentCountChange}
            />
          ))}
      </div>

      <UploadMomentModal open={uploadOpen} onClose={() => setUploadOpen(false)} onUploaded={loadApprovedVideos} />
    </div>
  );
}
