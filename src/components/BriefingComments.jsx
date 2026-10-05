import { useEffect, useState } from "react";
import { addDoc, collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useLanguage } from "../lib/i18n/languageContext";

const DEFAULT_AVATAR =
  "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

function formatCommentDate(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return (
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
    " - " +
    date.toLocaleDateString([], { month: "short", day: "numeric" })
  );
}

export default function BriefingComments({ videoId, currentUser }) {
  const { t } = useLanguage();
  const s = t.comments;
  const [comments, setComments] = useState([]);
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "comments"), where("videoId", "==", videoId));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const all = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
        all.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        setComments(all);
      },
      (error) => console.error(s.errLoad, error)
    );
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    setSending(true);
    try {
      await addDoc(collection(db, "comments"), {
        videoId,
        parentId: replyTo?.id || null,
        text,
        authorUid: currentUser?.uid || null,
        authorName: currentUser?.name || "Staff Member",
        authorImage: currentUser?.image || null,
        createdAt: Date.now(),
      });
      setInput("");
      setReplyTo(null);
    } catch (err) {
      console.error(s.errSend, err);
    } finally {
      setSending(false);
    }
  };

  const mainComments = comments.filter((c) => !c.parentId);
  const repliesByParent = comments.reduce((acc, c) => {
    if (c.parentId) (acc[c.parentId] ||= []).push(c);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <h3 className="text-[10px] font-bold tracking-widest uppercase text-white/60">
        {s.title} ({comments.length})
      </h3>

      <form onSubmit={handleSend} className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={replyTo ? s.replyPlaceholder : s.placeholder}
          autoComplete="off"
          className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2.5 text-xs font-light tracking-wide text-white placeholder-white/30 focus:outline-none focus:border-white/30"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="bg-white text-black text-[9px] tracking-widest font-bold px-4 py-2.5 rounded transition hover:bg-zinc-200 uppercase disabled:opacity-40 shrink-0"
        >
          {s.send}
        </button>
      </form>

      {replyTo && (
        <div className="bg-white/5 px-4 py-2 text-[9px] tracking-widest text-white/50 flex items-center justify-between rounded">
          <span className="uppercase">
            <strong className="capitalize text-white/80">{replyTo.author}</strong> {s.replyingTo}
          </span>
          <button onClick={() => setReplyTo(null)} className="text-red-400 hover:text-red-300 font-bold ml-2 uppercase">
            {s.cancelReply}
          </button>
        </div>
      )}

      <div className="space-y-4">
        {comments.length === 0 && (
          <p className="text-[9px] tracking-widest font-light text-white/30 uppercase text-center py-6">{s.empty}</p>
        )}

        {mainComments.map((comment) => (
          <div key={comment.id} className="border-b border-white/5 pb-4 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[9px] tracking-widest font-bold">
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={comment.authorImage || DEFAULT_AVATAR}
                  alt=""
                  className="w-6 h-6 rounded-full object-cover border border-white/10 shrink-0"
                />
                <span className="text-white/80 capitalize truncate">{comment.authorName || "Staff Member"}</span>
              </div>
              <span className="text-white/30 font-mono text-[8px] shrink-0">
                {formatCommentDate(comment.createdAt)}
              </span>
            </div>
            <p className="text-[12px] font-light tracking-wide text-white break-words">{comment.text}</p>

            <div className="flex justify-end">
              <button
                onClick={() => setReplyTo({ id: comment.id, author: comment.authorName || "Staff" })}
                className="text-[8px] tracking-widest font-bold text-white/40 hover:text-white transition flex items-center gap-1 uppercase"
              >
                <i className="fa-solid fa-reply text-[7px]" /> {s.reply}
              </button>
            </div>

            {(repliesByParent[comment.id] || []).map((reply) => (
              <div
                key={reply.id}
                className="ml-4 sm:ml-6 pl-3 border-l-2 border-white/10 flex flex-col gap-1 bg-white/5 p-3 rounded"
              >
                <div className="flex items-center justify-between text-[8px] tracking-widest font-bold">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <img
                      src={reply.authorImage || DEFAULT_AVATAR}
                      alt=""
                      className="w-5 h-5 rounded-full object-cover border border-white/10 shrink-0"
                    />
                    <span className="text-white/60 capitalize truncate">↩ {reply.authorName || "Staff"}</span>
                  </div>
                  <span className="text-white/30 font-mono text-[7px] shrink-0">
                    {formatCommentDate(reply.createdAt)}
                  </span>
                </div>
                <p className="text-[11px] font-light tracking-wide text-white/80 break-words">{reply.text}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
