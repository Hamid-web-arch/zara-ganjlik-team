import { useEffect, useRef, useState } from "react";
import { listComments, createComment } from "../lib/api";
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

export default function MomentComments({ videoId, onClose, onCountChange }) {
  const { t } = useLanguage();
  const s = t.comments;
  const [comments, setComments] = useState([]);
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    listComments(videoId)
      .then((all) => {
        setComments(all);
        onCountChange?.(videoId, all.length);
      })
      .catch((error) => console.error(s.errLoad, error));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [comments]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    setSending(true);
    try {
      const comment = await createComment(videoId, text, replyTo?.id);
      setComments((prev) => {
        const next = [...prev, comment];
        onCountChange?.(videoId, next.length);
        return next;
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
    <div className="fixed inset-x-0 bottom-0 z-50 h-[75vh] rounded-t-2xl md:static md:z-auto md:h-full md:rounded-sm bg-black/98 md:bg-black/95 backdrop-blur-sm border-t md:border border-white/10 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
        <h3 className="text-[10px] font-bold tracking-widest uppercase">
          {s.title} ({comments.length})
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white cursor-pointer transition">
          <i className="fa-solid fa-xmark text-base" />
        </button>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {comments.length === 0 && (
          <p className="text-[9px] tracking-widest font-light text-gray-400 uppercase text-center mt-6">{s.empty}</p>
        )}

        {mainComments.map((comment) => (
          <div key={comment.id} className="border-b border-white/5 pb-3 flex flex-col gap-1 group">
            <div className="flex items-center justify-between text-[9px] tracking-widest font-bold">
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={comment.authorImage || DEFAULT_AVATAR}
                  alt=""
                  className="w-5 h-5 rounded-full object-cover border border-white/10 shrink-0"
                />
                <span className="text-white/70 capitalize truncate">{comment.authorName || "Staff Member"}</span>
              </div>
              <span className="text-gray-400 font-mono text-[8px] shrink-0">
                {formatCommentDate(comment.createdAt)}
              </span>
            </div>
            <p className="text-[11px] font-light tracking-wide text-white break-words">{comment.text}</p>

            <div className="flex justify-end opacity-60 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setReplyTo({ id: comment.id, author: comment.authorName || "Staff" })}
                className="text-[8px] tracking-widest font-bold text-gray-400 hover:text-white transition cursor-pointer flex items-center gap-1 uppercase"
              >
                <i className="fa-solid fa-reply text-[7px]" /> {s.reply}
              </button>
            </div>

            {(repliesByParent[comment.id] || []).map((reply) => (
              <div
                key={reply.id}
                className="ml-5 pl-2 border-l-2 border-white/10 mt-1 flex flex-col gap-0.5 bg-white/5 p-2 rounded group/reply"
              >
                <div className="flex items-center justify-between text-[8px] tracking-widest font-bold">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <img
                      src={reply.authorImage || DEFAULT_AVATAR}
                      alt=""
                      className="w-4 h-4 rounded-full object-cover border border-white/10 shrink-0"
                    />
                    <span className="text-gray-400 capitalize truncate">↩️ {reply.authorName || "Staff"}</span>
                  </div>
                  <span className="text-gray-400 font-mono text-[7px] shrink-0">
                    {formatCommentDate(reply.createdAt)}
                  </span>
                </div>
                <p className="text-[10px] font-light tracking-wide text-white/70 break-words">{reply.text}</p>
                <div className="flex justify-end opacity-60 group-hover/reply:opacity-100 transition-opacity">
                  <button
                    // Stays in the same thread (parent = the top-level comment, not this
                    // reply) so replies never nest more than one level deep — the
                    // "replying to X" banner below still names the actual reply's author.
                    onClick={() => setReplyTo({ id: comment.id, author: reply.authorName || "Staff" })}
                    className="text-[8px] tracking-widest font-bold text-gray-400 hover:text-white transition cursor-pointer flex items-center gap-1 uppercase"
                  >
                    <i className="fa-solid fa-reply text-[7px]" /> {s.reply}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {replyTo && (
        <div className="bg-zinc-900 px-4 py-2 text-[9px] tracking-widest text-gray-400 flex items-center justify-between border-t border-white/5 shrink-0">
          <span className="uppercase">
            <strong className="capitalize">{replyTo.author}</strong> {s.replyingTo}
          </span>
          <button onClick={() => setReplyTo(null)} className="text-red-500 hover:text-red-300 font-bold ml-2 uppercase">
            {s.cancelReply}
          </button>
        </div>
      )}

      <form onSubmit={handleSend} className="p-3 border-t border-white/10 flex items-center gap-2 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={replyTo ? s.replyPlaceholder : s.placeholder}
          autoComplete="off"
          className="flex-1 bg-zinc-900 border border-white/10 rounded px-3 py-2 text-xs font-light tracking-wide text-white placeholder-gray-500 focus:outline-none focus:border-white/10"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="bg-white text-black text-[9px] tracking-widest font-bold px-4 py-2.5 rounded transition hover:bg-gray-50 uppercase disabled:opacity-40"
        >
          {s.send}
        </button>
      </form>
    </div>
  );
}
