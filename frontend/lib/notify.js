// Replaces the blocking window.alert / window.confirm dialogs. The calls don't touch React
// directly: they dispatch an event that <NotifyHost /> (mounted once in main.jsx) listens
// for and renders. That keeps this usable from any handler, async or not.
const TOAST_EVENT = "gnc:toast";
const CONFIRM_EVENT = "gnc:confirm";
const PROMPT_EVENT = "gnc:prompt";

export function notify(message) {
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { message: String(message) } }));
}

/** Resolves true/false once the user answers the modal. */
export function confirmAsync(message) {
  return new Promise((resolve) => {
    window.dispatchEvent(new CustomEvent(CONFIRM_EVENT, { detail: { message: String(message), resolve } }));
  });
}

/** Resolves the typed value, or null if the user cancels. */
export function promptAsync(message, { placeholder = "", inputType = "text" } = {}) {
  return new Promise((resolve) => {
    window.dispatchEvent(
      new CustomEvent(PROMPT_EVENT, { detail: { message: String(message), placeholder, inputType, resolve } })
    );
  });
}

export const NOTIFY_EVENTS = { TOAST_EVENT, CONFIRM_EVENT, PROMPT_EVENT };
