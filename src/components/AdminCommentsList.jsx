import { notify, confirmAsync } from "../lib/notify";
import { useEffect, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";

const DEFAULT_AVATAR =
  "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

export default function AdminCommentsList({ videoId }) {
  const [comments, setComments] = useState([]);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "comments"), where("videoId", "==", videoId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const all = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      all.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      setComments(all);
    });
    return () => unsubscribe();
  }, [videoId]);

  const handleDelete = async (comment) => {
    if (!await confirmAsync("Bu şərhi silmək istəyirsiniz?")) return;
    setDeletingId(comment.id);
    try {
      const replies = comments.filter((c) => c.parentId === comment.id);
      await Promise.all([
        deleteDoc(doc(db, "comments", comment.id)),
        ...replies.map((reply) => deleteDoc(doc(db, "comments", reply.id))),
      ]);
    } catch (err) {
      notify("Silinmə xətası: " + err.message);
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
    return <p className="text-[9px] text-white/30 uppercase tracking-widest py-3 text-center">Şərh yoxdur.</p>;
  }

  return (
    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
      {mainComments.map((comment) => (
        <div key={comment.id} className="border-b border-white/5 pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 min-w-0">
              <img
                src={comment.authorImage || DEFAULT_AVATAR}
                alt=""
                className="w-5 h-5 rounded-full object-cover border border-white/10 shrink-0 mt-0.5"
              />
              <div className="min-w-0">
                <p className="text-[9px] text-white/70 capitalize tracking-widest truncate">
                  {comment.authorName || "Staff Member"}
                </p>
                <p className="text-[10px] text-white/90 break-words">{comment.text}</p>
              </div>
            </div>
            <button
              disabled={deletingId === comment.id}
              onClick={() => handleDelete(comment)}
              title="Şərhi sil"
              className="text-red-500 hover:text-red-500 text-[10px] shrink-0 disabled:opacity-40 cursor-pointer"
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
                  className="w-4 h-4 rounded-full object-cover border border-white/10 shrink-0 mt-0.5"
                />
                <div className="min-w-0">
                  <p className="text-[8px] text-white/50 capitalize tracking-widest truncate">
                    ↩ {reply.authorName || "Staff"}
                  </p>
                  <p className="text-[9px] text-white/70 break-words">{reply.text}</p>
                </div>
              </div>
              <button
                disabled={deletingId === reply.id}
                onClick={() => handleDelete(reply)}
                title="Cavabı sil"
                className="text-red-500 hover:text-red-500 text-[9px] shrink-0 disabled:opacity-40 cursor-pointer"
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
