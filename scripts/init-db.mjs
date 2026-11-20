import { createClient } from "@libsql/client";
import { readFile } from "node:fs/promises";

const url = process.env.TURSO_DATABASE_URL || "file:studio.db";
const authToken = process.env.TURSO_AUTH_TOKEN;
if (process.env.VERCEL && (!url.startsWith("libsql://") || !authToken))
  throw new Error("Add TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in Vercel, then redeploy.");
const client = createClient({ url, authToken });
try {
  const source = await readFile(new URL("../drizzle/0000_grey_iron_lad.sql", import.meta.url), "utf8");
  const statements = source.split("--> statement-breakpoint").map(s => s.trim()).filter(Boolean);
  await client.batch(statements.map(s => s.replace(/^CREATE (TABLE|(?:UNIQUE )?INDEX) /, "CREATE $1 IF NOT EXISTS ")), "write");
  console.log("Studio database ready.");
} finally {
  client.close();
}
