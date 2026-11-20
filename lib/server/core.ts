import { staffSession } from "./staff-session";
import type { StudioDatabase } from "@/db";
export { database } from "@/db";
import {
  categories,
  starters,
  team,
  type Category,
  type Service,
  type Stylist,
} from "@/lib/studio/catalog";
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export type Body = Record<string, unknown>;
export const value = (o: Body, k: string) =>
  typeof o[k] === "string" ? (o[k] as string).trim() : "";
export const asCategory = (v: unknown) => categories.includes(v as Category);
export async function ready(db: StudioDatabase) {
  if (
    await db
      .prepare("SELECT id FROM services WHERE id=?")
      .bind(starters[0].id)
      .first()
  )
    return;
  const batch = starters.map((s) =>
    db
      .prepare(
        "INSERT OR IGNORE INTO services (id,name,category,description,price,duration,position) VALUES (?,?,?,?,?,?,?)",
      )
      .bind(
        s.id,
        s.name,
        s.category,
        s.description,
        s.price,
        s.duration,
        s.position,
      ),
  );
  for (const s of team) {
    batch.push(
      db
        .prepare(
          "INSERT OR IGNORE INTO stylists (id,name,title) VALUES (?,?,?)",
        )
        .bind(s.id, s.name, s.title),
    );
    for (const c of s.categories)
      batch.push(
        db
          .prepare(
            "INSERT OR IGNORE INTO stylist_skills (stylist_id,category) VALUES (?,?)",
          )
          .bind(s.id, c),
      );
  }
  await db.batch(batch);
}
export async function services(db: StudioDatabase, all = false, category = "") {
  if (category && !asCategory(category))
    throw new ApiError(400, "Choose a category from the service menu.");
  const q =
    "SELECT * FROM services WHERE (?=1 OR active=1) AND (?='' OR category=?) ORDER BY position, name";
  return (
    await db
      .prepare(q)
      .bind(all ? 1 : 0, category, category)
      .all<Service>()
  ).results;
}
export async function stylists(
  db: StudioDatabase,
  category = "",
): Promise<Stylist[]> {
  if (category && !asCategory(category))
    throw new ApiError(400, "Unknown service category.");
  const q =
    "SELECT s.id,s.name,s.title,sk.category FROM stylists s JOIN stylist_skills sk ON sk.stylist_id=s.id ORDER BY s.name,sk.category";
  const rows = (
    await db
      .prepare(q)
      .all<{ id: string; name: string; title: string; category: Category }>()
  ).results;
  const people = new Map<string, Stylist>();
  for (const row of rows) {
    const person = people.get(row.id) ?? {
      id: row.id,
      name: row.name,
      title: row.title,
      categories: [] as Category[],
    };
    person.categories.push(row.category);
    people.set(row.id, person);
  }
  return [...people.values()].filter(
    (s) => !category || s.categories.includes(category as Category),
  );
}
export function serviceFields(body: Body) {
  const name = value(body, "name"),
    category = value(body, "category"),
    description = value(body, "description");
  const price = body.price,
    duration = body.duration;
  if (
    name.length < 2 ||
    name.length > 70 ||
    !asCategory(category) ||
    description.length < 5 ||
    description.length > 240
  )
    throw new ApiError(
      400,
      "Enter a service name, a category and a description of 5–240 characters.",
    );
  if (
    typeof price !== "number" ||
    !Number.isInteger(price) ||
    price < 1 ||
    price > 100000
  )
    throw new ApiError(
      400,
      "Enter a whole-rupee price between ₹1 and ₹1,00,000.",
    );
  if (
    typeof duration !== "number" ||
    !Number.isInteger(duration) ||
    duration < 15 ||
    duration > 240 ||
    duration % 15 !== 0
  )
    throw new ApiError(
      400,
      "Choose a duration in 15-minute steps, from 15 to 240 minutes.",
    );
  if (body.active !== undefined && body.active !== 0 && body.active !== 1)
    throw new ApiError(400, "Active must be 0 or 1.");
  return {
    name,
    category,
    description,
    price,
    duration,
    active: body.active === 0 ? 0 : 1,
  };
}
export type Identity = {
  owner: string;
  staff: boolean;
  email: string;
  cookie?: string;
};
export async function identity(req: Request): Promise<Identity> {
  const existing = /(?:^|;\s*)mirror_magic_guest=([a-f0-9]{32})(?:;|$)/.exec(
    req.headers.get("cookie") ?? "",
  )?.[1];
  const key = existing ?? crypto.randomUUID().replaceAll("-", "");
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(key),
  );
  const owner =
    "guest:" +
    Array.from(new Uint8Array(hash), (n) =>
      n.toString(16).padStart(2, "0"),
    ).join("");
  const secure = new URL(req.url).protocol === "https:" ? "; Secure" : "";
  return {
    owner,
    email: "",
    staff: staffSession(req),
    cookie: existing
      ? undefined
      : "mirror_magic_guest=" +
        key +
        "; Path=/; HttpOnly; SameSite=Lax; Max-Age=7776000" +
        secure,
  };
}
export async function readBody(req: Request): Promise<Body> {
  if (
    !req.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  )
    throw new ApiError(415, "Send a JSON request body.");
  if (Number(req.headers.get("content-length")) > 10000)
    throw new ApiError(413, "The submitted form is too large.");
  const str = await req.text();
  if (str.length > 10000)
    throw new ApiError(413, "The submitted form is too large.");
  try {
    const o = JSON.parse(str);
    if (o && typeof o === "object" && !Array.isArray(o)) return o;
  } catch {}
  throw new ApiError(400, "Send a valid JSON object.");
}
