// Replaces the blocking window.alert / window.confirm dialogs. The calls don't touch React
// directly: they dispatch an event that <NotifyHost /> (mounted once in main.jsx) listens
// for and renders. That keeps this usable from any handler, async or not.
const TOAST_EVENT = "gnc:toast";
const CONFIRM_EVENT = "gnc:confirm";

export function notify(message) {
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { message: String(message) } }));
}

/** Resolves true/false once the user answers the modal. */
export function confirmAsync(message) {
  return new Promise((resolve) => {
    window.dispatchEvent(new CustomEvent(CONFIRM_EVENT, { detail: { message: String(message), resolve } }));
  });
}

export const NOTIFY_EVENTS = { TOAST_EVENT, CONFIRM_EVENT };
