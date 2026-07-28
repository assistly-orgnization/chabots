import { neon } from "@neondatabase/serverless";

/**
 * Singleton Neon SQL client for server-side use.
 * Uses the DATABASE_URL environment variable.
 */
const sql = neon(process.env.DATABASE_URL!);

export default sql;
