import { useState } from "react";
import { reactToBriefing } from "../lib/api";
import { useAuth } from "../lib/authState";
import { useLanguage } from "../lib/i18n/languageContext";

// WhatsApp-style: pick one emoji, tap the same one again to remove it — no text comments.
const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "👏"];

export default function BriefingReactions({ briefingId, reactions, onChange }) {
  const { t } = useLanguage();
  const s = t.briefings.reactions;
  const { profile } = useAuth();
  const [busy, setBusy] = useState(false);

  const myReaction = profile ? reactions[profile.uid] : null;
  const counts = Object.values(reactions).reduce((acc, emoji) => {
    acc[emoji] = (acc[emoji] || 0) + 1;
    return acc;
  }, {});
  const total = Object.keys(reactions).length;

  const handleReact = async (emoji) => {
    if (busy) return;
    setBusy(true);
    try {
      const updated = await reactToBriefing(briefingId, emoji);
      onChange(updated.reactions);
    } catch (error) {
      console.error("Reaksiya xətası:", error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-[9px] uppercase tracking-widest text-white/30">{s.title}</p>
      <div className="flex items-center gap-2 flex-wrap">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => handleReact(emoji)}
            disabled={busy}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full border text-base leading-none transition disabled:opacity-40 cursor-pointer ${
              myReaction === emoji ? "border-white bg-white/10" : "border-white/10 hover:border-white/30"
            }`}
          >
            <span>{emoji}</span>
            {counts[emoji] > 0 && <span className="text-[10px] text-white/50">{counts[emoji]}</span>}
          </button>
        ))}
      </div>
      {total > 0 && <p className="text-[9px] uppercase tracking-widest text-white/20">{s.totalCount.replace("{n}", total)}</p>}
    </div>
  );
}
