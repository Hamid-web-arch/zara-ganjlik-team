import { useEffect, useState } from "react";
import { NOTIFY_EVENTS } from "../lib/notify";
import { useLanguage } from "../lib/i18n/languageContext";

const TOAST_DURATION_MS = 4000;

export default function NotifyHost() {
  const { t } = useLanguage();
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null); // { message, resolve }
  const [promptState, setPromptState] = useState(null); // { message, placeholder, inputType, resolve }
  const [promptValue, setPromptValue] = useState("");

  useEffect(() => {
    const onToast = (e) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, message: e.detail.message }]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), TOAST_DURATION_MS);
    };
    const onConfirm = (e) => setConfirmState({ message: e.detail.message, resolve: e.detail.resolve });
    const onPrompt = (e) => {
      setPromptValue("");
      setPromptState({
        message: e.detail.message,
        placeholder: e.detail.placeholder,
        inputType: e.detail.inputType,
        resolve: e.detail.resolve,
      });
    };

    window.addEventListener(NOTIFY_EVENTS.TOAST_EVENT, onToast);
    window.addEventListener(NOTIFY_EVENTS.CONFIRM_EVENT, onConfirm);
    window.addEventListener(NOTIFY_EVENTS.PROMPT_EVENT, onPrompt);
    return () => {
      window.removeEventListener(NOTIFY_EVENTS.TOAST_EVENT, onToast);
      window.removeEventListener(NOTIFY_EVENTS.CONFIRM_EVENT, onConfirm);
      window.removeEventListener(NOTIFY_EVENTS.PROMPT_EVENT, onPrompt);
    };
  }, []);

  const answer = (result) => {
    confirmState?.resolve(result);
    setConfirmState(null);
  };

  const answerPrompt = (value) => {
    promptState?.resolve(value);
    setPromptState(null);
  };

  return (
    <>
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[400] flex flex-col gap-2 items-center px-4 w-full max-w-md pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto bg-zinc-900 border border-white/15 text-white text-[11px] tracking-wide px-5 py-3 rounded-sm shadow-xl whitespace-pre-line text-center"
          >
            {t.message}
          </div>
        ))}
      </div>

      {confirmState && (
        <div className="fixed inset-0 z-[410] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div role="dialog" aria-modal="true" className="glass w-full max-w-sm p-8 space-y-6 rounded-sm">
            <p className="text-[11px] tracking-wide text-white whitespace-pre-line">{confirmState.message}</p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => answer(false)}
                className="text-[9px] uppercase tracking-widest text-white border border-white/20 px-5 py-3 hover:bg-white hover:text-black transition"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => answer(true)}
                className="text-[9px] font-bold uppercase tracking-widest bg-white text-black px-5 py-3 hover:bg-gray-200 transition"
              >
                {t.common.confirm}
              </button>
            </div>
          </div>
        </div>
      )}

      {promptState && (
        <div className="fixed inset-0 z-[410] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <form
            role="dialog"
            aria-modal="true"
            className="glass w-full max-w-sm p-8 space-y-6 rounded-sm"
            onSubmit={(e) => {
              e.preventDefault();
              answerPrompt(promptValue);
            }}
          >
            <p className="text-[11px] tracking-wide text-white whitespace-pre-line">{promptState.message}</p>
            <input
              type={promptState.inputType}
              autoFocus
              placeholder={promptState.placeholder}
              value={promptValue}
              onChange={(e) => setPromptValue(e.target.value)}
              className="w-full bg-transparent border-b border-white/20 py-3 text-[11px] tracking-[0.2em] outline-none focus:border-white text-white"
            />
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => answerPrompt(null)}
                className="text-[9px] uppercase tracking-widest text-white border border-white/20 px-5 py-3 hover:bg-white hover:text-black transition"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                className="text-[9px] font-bold uppercase tracking-widest bg-white text-black px-5 py-3 hover:bg-gray-200 transition"
              >
                {t.common.confirm}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
