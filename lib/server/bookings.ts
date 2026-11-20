import type { StudioDatabase } from "@/db";
import { ApiError, type Body, type Identity, value } from "./core";
import { type Booking, type Service } from "@/lib/studio/catalog";
import {
  OPEN,
  CLOSE,
  canStart,
  clock,
  isOpenDate,
  readTime,
  visitStamp,
} from "@/lib/studio/time";
type RecordRow = Omit<Booking, "time"> & {
  owner: string;
  start: number;
  requestKey: string;
};
const base = `SELECT a.reference,a.owner,a.request_key AS requestKey,a.service_id AS serviceId,a.service_name AS serviceName,a.category,
a.stylist_id AS stylistId,p.name AS stylistName,a.date,a.start,a.duration,a.price,a.customer_name AS customerName,a.email,a.phone,a.status
FROM appointments a JOIN stylists p ON p.id=a.stylist_id`;
function publicRecord(r: RecordRow): Booking {
  const { owner, requestKey, start, ...rest } = r;
  return { ...rest, time: clock(start) };
}
const referenceKey = (r: string) => r.trim().toUpperCase();
const byRef = (db: StudioDatabase, ref: string) =>
  db
    .prepare(base + " WHERE a.reference=?")
    .bind(referenceKey(ref))
    .first<RecordRow>();
async function permitted(
  db: StudioDatabase,
  ref: string,
  who: Identity,
  email: string,
) {
  const r = await byRef(db, ref);
  if (
    !r ||
    !(
      r.owner === who.owner ||
      who.staff ||
      (!!email && r.email === email.trim().toLowerCase())
    )
  )
    throw new ApiError(404, "We couldn’t find a booking with those details.");
  return r;
}
export async function findBooking(
  db: StudioDatabase,
  ref: string,
  who: Identity,
  email: string,
) {
  return publicRecord(await permitted(db, ref, who, email));
}
export async function listBookings(
  db: StudioDatabase,
  who: Identity,
  staff = false,
  date = "",
  status = "",
) {
  if (staff && !who.staff) throw new ApiError(403, "Staff access is required.");
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date))
    throw new ApiError(400, "Use a date in YYYY-MM-DD format.");
  if (status && !["booked", "completed", "cancelled"].includes(status))
    throw new ApiError(400, "Unknown booking status.");
  const q =
    base +
    " WHERE (?=1 OR a.owner=?) AND (?='' OR a.date=?) AND (?='' OR a.status=?) ORDER BY a.date DESC,a.start ASC";
  return (
    await db
      .prepare(q)
      .bind(staff ? 1 : 0, who.owner, date, date, status, status)
      .all<RecordRow>()
  ).results.map(publicRecord);
}
async function service(db: StudioDatabase, id: string) {
  const s = await db
    .prepare("SELECT * FROM services WHERE id=? AND active=1")
    .bind(id)
    .first<Service>();
  if (!s) throw new ApiError(404, "This service is no longer on the menu.");
  return s;
}
function validDate(day: string) {
  if (!isOpenDate(day))
    throw new ApiError(
      400,
      "Choose an open day within the next 90 days. The studio is closed on Mondays.",
    );
}
export async function availability(
  db: StudioDatabase,
  serviceId: string,
  day: string,
  stylistId: string,
  booking?: RecordRow,
) {
  const treatment = booking ?? (await service(db, serviceId));
  validDate(day);
  const team = (
    await db
      .prepare(
        "SELECT stylist_id AS id FROM stylist_skills WHERE category=? AND (?='' OR stylist_id=?) ORDER BY stylist_id",
      )
      .bind(treatment.category, stylistId, stylistId)
      .all<{ id: string }>()
  ).results;
  const taken = (
    await db
      .prepare(
        "SELECT stylist_id AS id,start,duration FROM appointments WHERE date=? AND status!='cancelled' AND reference!=?",
      )
      .bind(day, booking?.reference ?? "")
      .all<{ id: string; start: number; duration: number }>()
  ).results;
  const times: string[] = [];
  const now = Date.now();
  for (let start = OPEN; start + treatment.duration <= CLOSE; start += 15) {
    if (!canStart(day, start, treatment.duration, now)) continue;
    if (
      team.some(
        (p) =>
          !taken.some(
            (a) =>
              a.id === p.id &&
              a.start < start + treatment.duration &&
              start < a.start + a.duration,
          ),
      )
    )
      times.push(clock(start));
  }
  return { date: day, timeZone: "Asia/Kolkata", times };
}
export async function moveAvailability(
  db: StudioDatabase,
  ref: string,
  who: Identity,
  body: Body,
) {
  const r = await permitted(db, ref, who, value(body, "email"));
  return availability(
    db,
    r.serviceId,
    value(body, "date"),
    value(body, "stylistId"),
    r,
  );
}
const newReference = () => {
  const chars = crypto
    .randomUUID()
    .replaceAll("-", "")
    .slice(-20)
    .toUpperCase();
  return "MM-" + chars.match(/.{4}/g)!.join("-");
};
function validateStart(day: string, start: number, duration: number) {
  validDate(day);
  if (!canStart(day, start, duration))
    throw new ApiError(
      400,
      "Choose an available studio time at least 30 minutes ahead.",
    );
}
export async function createBooking(db: StudioDatabase, who: Identity, body: Body) {
  const requestKey = value(body, "requestKey"),
    name = value(body, "customerName"),
    email = value(body, "email").toLowerCase(),
    phone = value(body, "phone");
  const serviceId = value(body, "serviceId"),
    stylistId = value(body, "stylistId"),
    date = value(body, "date"),
    start = readTime(value(body, "time"));
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      requestKey,
    )
  )
    throw new ApiError(400, "Provide a UUID v4 requestKey for this booking.");
  if (
    name.length < 2 ||
    name.length > 80 ||
    email.length > 180 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !/^[+\d() -]+$/.test(phone) ||
    !/^\d{7,15}$/.test(phone.replace(/\D/g, "")) ||
    phone.length > 28
  )
    throw new ApiError(
      400,
      "Enter your full name, a valid email address and a phone number.",
    );
  const existing = () =>
    db
      .prepare(base + " WHERE a.request_key=?")
      .bind(requestKey)
      .first<RecordRow>();
  const replay = (r: RecordRow) => {
    if (
      r.owner !== who.owner ||
      r.serviceId !== serviceId ||
      r.date !== date ||
      r.start !== start ||
      r.email !== email ||
      r.customerName !== name ||
      r.phone !== phone ||
      (stylistId && r.stylistId !== stylistId)
    )
      throw new ApiError(
        409,
        "This request key belongs to a different booking. Start a new booking.",
      );
    return { booking: publicRecord(r), created: false };
  };
  const prior = await existing();
  if (prior) return replay(prior);
  const s = await service(db, serviceId);
  validateStart(date, start, s.duration);
  if (
    (body.expectedPrice !== undefined && body.expectedPrice !== s.price) ||
    (body.expectedDuration !== undefined &&
      body.expectedDuration !== s.duration)
  )
    throw new ApiError(
      409,
      "The service details have changed. Reopen the service menu to review the updated treatment.",
    );
  const ref = newReference();
  // Selecting the eligible specialist and reserving the interval share one SQLite write.
  const q = `INSERT INTO appointments(reference,request_key,owner,service_id,service_name,category,stylist_id,date,start,duration,price,customer_name,email,phone,status,created_at)
  SELECT ?,?,?,s.id,s.name,s.category,sk.stylist_id,?,?,s.duration,s.price,?,?,?,'booked',?
  FROM services s JOIN stylist_skills sk ON sk.category=s.category
  WHERE s.id=? AND s.active=1 AND s.duration=? AND s.price=? AND (?='' OR sk.stylist_id=?)
  AND NOT EXISTS (SELECT 1 FROM appointments a WHERE a.stylist_id=sk.stylist_id AND a.date=? AND a.status!='cancelled' AND a.start<?+s.duration AND ?<a.start+a.duration)
  ORDER BY sk.stylist_id LIMIT 1 ON CONFLICT(request_key) DO NOTHING`;
  const out = await db
    .prepare(q)
    .bind(
      ref,
      requestKey,
      who.owner,
      date,
      start,
      name,
      email,
      phone,
      new Date().toISOString(),
      s.id,
      s.duration,
      s.price,
      stylistId,
      stylistId,
      date,
      start,
      start,
    )
    .run();
  if (!out.meta.changes) {
    const previous = await existing();
    if (previous) return replay(previous);
    throw new ApiError(
      409,
      "That time is no longer available. Please choose another.",
    );
  }
  return { booking: publicRecord((await byRef(db, ref))!), created: true };
}
export async function changeBooking(
  db: StudioDatabase,
  ref: string,
  who: Identity,
  body: Body,
  action: string,
) {
  const r = await permitted(db, ref, who, value(body, "email"));
  const started = visitStamp(r.date, clock(r.start)) <= Date.now();
  if (action === "complete" && !who.staff)
    throw new ApiError(403, "Staff access is required.");
  if (r.status === "cancelled" && action === "cancel") return publicRecord(r);
  if (r.status === "completed" && action === "complete") return publicRecord(r);
  if (r.status !== "booked")
    throw new ApiError(409, "This appointment is already " + r.status + ".");
  if (started && !who.staff)
    throw new ApiError(
      409,
      "This visit has started. Please contact the studio.",
    );
  let changes = 0;
  if (action === "cancel" || action === "complete") {
    if (action === "complete" && !started)
      throw new ApiError(
        409,
        "You can complete a visit once its start time has passed.",
      );
    const out = await db
      .prepare(
        "UPDATE appointments SET status=? WHERE reference=? AND status='booked'",
      )
      .bind(action === "cancel" ? "cancelled" : "completed", r.reference)
      .run();
    changes = out.meta.changes;
  } else if (action === "reschedule") {
    const day = value(body, "date"),
      start = readTime(value(body, "time")),
      stylist = value(body, "stylistId") || r.stylistId;
    validateStart(day, start, r.duration);
    const q = `UPDATE appointments SET date=?,start=?,stylist_id=?
    WHERE reference=? AND status='booked' AND date=? AND start=? AND stylist_id=?
    AND EXISTS (SELECT 1 FROM stylist_skills WHERE stylist_id=? AND category=?)
    AND NOT EXISTS (SELECT 1 FROM appointments a WHERE a.reference!=? AND a.stylist_id=? AND a.date=? AND a.status!='cancelled' AND a.start<?+? AND ?<a.start+a.duration)`;
    const out = await db
      .prepare(q)
      .bind(
        day,
        start,
        stylist,
        r.reference,
        r.date,
        r.start,
        r.stylistId,
        stylist,
        r.category,
        r.reference,
        stylist,
        day,
        start,
        r.duration,
        start,
      )
      .run();
    changes = out.meta.changes;
  } else throw new ApiError(400, "Unknown appointment action.");
  if (!changes)
    throw new ApiError(
      409,
      "The appointment or time slot changed. Refresh and choose again.",
    );
  return publicRecord((await byRef(db, r.reference))!);
}
