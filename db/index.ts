import { createClient, type Client, type InValue } from "@libsql/client";

class Statement {
  constructor(private client: Client, readonly sql: string, readonly args: InValue[] = []) {}
  bind(...args: InValue[]) { return new Statement(this.client, this.sql, args); }
  private execute() { return this.client.execute({ sql: this.sql, args: this.args }); }
  async first<T = unknown>() { return (await this.execute()).rows[0] as T | undefined; }
  async all<T>() { return { results: (await this.execute()).rows as unknown as T[] }; }
  async run() { return { meta: { changes: (await this.execute()).rowsAffected } }; }
}
export class StudioDatabase {
  constructor(private client: Client) {}
  prepare(sql: string) { return new Statement(this.client, sql); }
  batch(statements: Statement[]) {
    return this.client.batch(statements.map(({ sql, args }) => ({ sql, args })), "write");
  }
}
let db: StudioDatabase | undefined;
export function database() {
  if (!db) {
    const url = process.env.TURSO_DATABASE_URL || "file:studio.db";
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (process.env.VERCEL && (!url.startsWith("libsql://") || !authToken))
      throw new Error("Configure TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in Vercel.");
    db = new StudioDatabase(createClient({ url, authToken }));
  }
  return db;
}
