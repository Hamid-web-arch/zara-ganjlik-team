import { notify, confirmAsync } from "../lib/notify";
import { useEffect, useState } from "react";
import { listComments, deleteComment } from "../lib/api";
import { useLanguage } from "../lib/i18n/languageContext";

const DEFAULT_AVATAR =
  "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

export default function AdminCommentsList({ videoId }) {
  const { t } = useLanguage();
  const s = t.adminPanel.comments;
  const [comments, setComments] = useState([]);
  const [deletingId, setDeletingId] = useState(null);

  const loadComments = () =>
    listComments(videoId)
      .then(setComments)
      .catch((error) => console.error("Şərhlər yüklənərkən xəta:", error));

  useEffect(() => {
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  const handleDelete = async (comment) => {
    if (!(await confirmAsync(s.confirm))) return;
    setDeletingId(comment.id);
    try {
      // Replies cascade automatically on the server (comments.parent_id FK).
      await deleteComment(comment.id);
      await loadComments();
    } catch (err) {
      notify(s.deleteError + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const mainComments = comments.filter((c) => !c.parentId);
  const repliesByParent = comments.reduce((acc, c) => {
    if (c.parentId) (acc[c.parentId] ||= []).push(c);
    return acc;
  }, {});

  if (comments.length === 0) {
    return <p className="text-[9px] text-zinc-400 uppercase tracking-widest py-3 text-center">{s.none}</p>;
  }

  return (
    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
      {mainComments.map((comment) => (
        <div key={comment.id} className="border-b border-zinc-100 pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 min-w-0">
              <img
                src={comment.authorImage || DEFAULT_AVATAR}
                alt=""
                className="w-5 h-5 rounded-full object-cover border border-zinc-200 shrink-0 mt-0.5"
              />
              <div className="min-w-0">
                <p className="text-[9px] text-zinc-600 capitalize tracking-widest truncate">
                  {comment.authorName || "Staff Member"}
                </p>
                <p className="text-[10px] text-zinc-900 break-words">{comment.text}</p>
              </div>
            </div>
            <button
              disabled={deletingId === comment.id}
              onClick={() => handleDelete(comment)}
              title={s.deleteComment}
              className="text-red-600 hover:text-red-700 text-[10px] shrink-0 disabled:opacity-40 cursor-pointer"
            >
              <i className="fa-solid fa-trash" />
            </button>
          </div>

          {(repliesByParent[comment.id] || []).map((reply) => (
            <div key={reply.id} className="flex items-start justify-between gap-2 ml-6 mt-1.5">
              <div className="flex items-start gap-1.5 min-w-0">
                <img
                  src={reply.authorImage || DEFAULT_AVATAR}
                  alt=""
                  className="w-4 h-4 rounded-full object-cover border border-zinc-200 shrink-0 mt-0.5"
                />
                <div className="min-w-0">
                  <p className="text-[8px] text-zinc-500 capitalize tracking-widest truncate">
                    ↩ {reply.authorName || "Staff"}
                  </p>
                  <p className="text-[9px] text-zinc-700 break-words">{reply.text}</p>
                </div>
              </div>
              <button
                disabled={deletingId === reply.id}
                onClick={() => handleDelete(reply)}
                title={s.deleteReply}
                className="text-red-600 hover:text-red-700 text-[9px] shrink-0 disabled:opacity-40 cursor-pointer"
              >
                <i className="fa-solid fa-trash" />
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
