import { useEffect, useRef, useState } from "react";
import { likeMoment, unlikeMoment } from "../lib/api";
import MomentComments from "./MomentComments";
import { useLanguage } from "../lib/i18n/languageContext";

function formatTime(seconds) {
  if (Number.isNaN(seconds)) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export default function MomentCard({
  video,
  containerRef,
  hasInteractedRef,
  currentUser,
  commentCount,
  onCommentCountChange,
}) {
  const { t } = useLanguage();
  const s = t.momentsPage;
  const videoRef = useRef(null);
  const cardRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [showOverlayIcon, setShowOverlayIcon] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [everVisible, setEverVisible] = useState(false);
  const [likedBy, setLikedBy] = useState(video.likedBy || []);
  const [liking, setLiking] = useState(false);

  // useState's initial value only runs on mount, so a re-fetched `video` prop (e.g. after
  // another user likes it, or the feed reloads) never reached this state on its own.
  // Skipped while a like/unlike is in flight so it can't stomp the optimistic update below.
  useEffect(() => {
    if (!liking) setLikedBy(video.likedBy || []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video.likedBy]);

  useEffect(() => {
    const container = containerRef.current;
    const card = cardRef.current;
    if (!container || !card) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const v = videoRef.current;
        if (!v) return;
        if (entry.isIntersecting) {
          setEverVisible(true);
          if (hasInteractedRef.current) {
            v.muted = false;
            v.play()
              .then(() => setPlaying(true))
              .catch(() => {});
          }
        } else {
          v.pause();
          v.currentTime = 0;
          setPlaying(false);
        }
      },
      { root: container, threshold: 0.6 }
    );

    observer.observe(card);
    return () => observer.disconnect();
  }, [containerRef, hasInteractedRef]);

  const handleTogglePlay = () => {
    hasInteractedRef.current = true;
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play()
        .then(() => setPlaying(true))
        .catch(() => {});
    } else {
      v.pause();
      setPlaying(false);
      setShowOverlayIcon(true);
      setTimeout(() => setShowOverlayIcon(false), 400);
    }
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    setProgress((v.currentTime / v.duration) * 100);
    setCurrentTime(v.currentTime);
    setDuration(v.duration);
  };

  const handleSeek = (e) => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percentage = (e.clientX - rect.left) / rect.width;
    v.currentTime = percentage * v.duration;
  };

  const commentLabel =
    commentCount == null ? s.commentsLoading : commentCount > 0 ? s.comments.replace("{n}", commentCount) : s.writeComment;

  const uid = currentUser?.uid;
  const liked = uid ? likedBy.includes(uid) : false;

  const handleLike = async () => {
    if (!uid || liking) return;
    const wasLiked = liked;
    setLiking(true);
    setLikedBy((prev) => (wasLiked ? prev.filter((id) => id !== uid) : [...prev, uid]));

    try {
      await (wasLiked ? unlikeMoment(video.id) : likeMoment(video.id));
    } catch (err) {
      console.error("Bəyəni xətası:", err);
      setLikedBy((prev) => (wasLiked ? [...prev, uid] : prev.filter((id) => id !== uid)));
    } finally {
      setLiking(false);
    }
  };

  return (
    <div ref={cardRef} className="zara-card w-full h-full relative bg-black md:grid md:grid-cols-12 md:pt-20">
      <div className="w-full h-full md:col-span-7 relative bg-black flex items-center justify-center overflow-hidden group/player">
        <video
          ref={videoRef}
          className="w-full h-full object-cover md:object-contain cursor-pointer"
          loop
          playsInline
          preload={everVisible ? "auto" : "none"}
          src={video.url}
          onClick={handleTogglePlay}
          onTimeUpdate={handleTimeUpdate}
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div
            className="bg-black/40 text-white w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300"
            style={{ opacity: showOverlayIcon ? 1 : 0, transform: showOverlayIcon ? "scale(1)" : "scale(0.75)" }}
          >
            <i className="fa-solid fa-play text-xl ml-1" />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col gap-2 z-40 opacity-0 group-hover/player:opacity-100 transition-opacity duration-300 select-none">
          <div
            onClick={handleSeek}
            className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer relative progress-container"
          >
            <div className="h-full bg-white rounded-full relative" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex items-center justify-between text-white text-[10px] tracking-widest font-light mt-1">
            <button onClick={handleTogglePlay} className="cursor-pointer transition hover:text-white/70 px-1 text-xs">
              <i className={`fa-solid ${playing ? "fa-pause" : "fa-play"}`} />
            </button>
            <div className="time-display font-mono">
              <span>{formatTime(currentTime)}</span> / <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      </div>

      {showComments ? (
        <div className="absolute inset-0 z-40 md:relative md:col-span-5 md:h-full">
          <MomentComments
            videoId={video.id}
            currentUser={currentUser}
            onClose={() => setShowComments(false)}
            onCountChange={onCommentCountChange}
          />
        </div>
      ) : (
        <div className="absolute left-0 bottom-0 w-full p-6 pb-12 z-40 md:relative md:p-12 md:col-span-5 md:h-full md:bg-black flex flex-col justify-end md:justify-center gap-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-zinc-900 text-gray-400 border border-white/10 flex items-center justify-center font-black text-xs">
              ST
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-widest uppercase">Staff Member</span>
              <span className="text-[10px] text-gray-400 font-light tracking-wide uppercase">Zara Ganjlik</span>
            </div>
          </div>
          <p className="text-xs font-light tracking-wide leading-relaxed text-white/70 max-w-md uppercase">
            {video.caption}
          </p>

          <div className="absolute right-6 bottom-36 md:relative md:right-0 md:bottom-0 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 mt-2">
            <button
              onClick={handleLike}
              disabled={!uid}
              className="flex flex-col md:flex-row items-center gap-1 md:gap-2 cursor-pointer disabled:cursor-default"
            >
              <i className={`fa-heart text-xl ${liked ? "fa-solid text-red-500" : "fa-regular"}`} />
              <span className={`text-[10px] font-light tracking-widest ${liked ? "text-red-500" : "text-gray-400"}`}>
                {likedBy.length} {s.likes}
              </span>
            </button>
            <button
              onClick={() => setShowComments(true)}
              className="flex flex-col md:flex-row items-center gap-1 md:gap-2 cursor-pointer"
            >
              <i className="fa-regular fa-comment text-xl" />
              <span className="text-[10px] font-light tracking-widest text-gray-400 uppercase">{commentLabel}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
