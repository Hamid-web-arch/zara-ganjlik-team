import { neon } from "@neondatabase/serverless";

// neon() issues each query over HTTP (no TCP connection to keep alive), which is what
// makes it a good fit for Vercel's short-lived serverless functions. Vercel's own Neon
// integration (Storage tab) sets DATABASE_URL; POSTGRES_URL is its common alias elsewhere.
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL (or POSTGRES_URL) is not set — connect a database in Vercel's Storage tab.");
}

export const sql = neon(connectionString);
