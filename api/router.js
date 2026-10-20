// Vercel only auto-detects Serverless Functions in a top-level /api folder, so this
// file has to exist here — the real implementation lives in /backend, kept separate
// from the frontend in /frontend.
export { default } from "../backend/router.js";
