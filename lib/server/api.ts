import { staffCookie } from "./staff-session";
import { apiSpec } from "@/lib/studio/api-spec";
import { type Service } from "@/lib/studio/catalog";
import {
  ApiError,
  database,
  identity,
  readBody,
  ready,
  serviceFields,
  services,
  stylists,
  value,
  type Identity,
} from "./core";
import {
  availability,
  changeBooking,
  createBooking,
  findBooking,
  listBookings,
  moveAvailability,
} from "./bookings";
const json = (data: unknown, status = 200, who?: Identity) =>
  Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...(who?.cookie ? { "Set-Cookie": who.cookie } : {}),
    },
  });
export async function handleApi(request: Request) {
  try {
    const url = new URL(request.url),
      path = url.pathname.replace(/^\/api\/?/, "").replace(/\/$/, ""),
      p = path.split("/"),
      m = request.method;
    const q = (k: string) => url.searchParams.get(k) ?? "";
    if (m === "GET" && path === "openapi.json") return json(apiSpec);
    if (m === "GET" && !path)
      return json({
        name: "Mirror Magic Beauty Palour API",
        version: "1.0.0",
        documentation: "/api-docs",
        schema: "/api/openapi.json",
      });
    const db = database();
    if (path === "health" && m === "GET") {
      await db.prepare("SELECT 1").first();
      return json({ status: "ok" });
    }
    if (m !== "GET" && request.headers.get("sec-fetch-site") === "cross-site")
      throw new ApiError(
        403,
        "Open the form on the studio website to continue.",
      );
    if (path === "staff-session" && (m === "POST" || m === "DELETE")) {
      const key = m === "POST" ? value(await readBody(request), "key") : null;
      const cookie = staffCookie(request, key);
      if (!cookie) throw new ApiError(403, "Check the staff access key.");
      return Response.json({ ok: true }, { headers: { "Set-Cookie": cookie, "Cache-Control": "no-store" } });
    }
    if (path === "session" && m === "GET") {
      const who = await identity(request);
      return json({ email: who.email, staff: who.staff }, 200, who);
    }
    await ready(db);
    if (path === "services" && m === "GET")
      return json({ services: await services(db, false, q("category")) });
    if (path === "stylists" && m === "GET")
      return json({ stylists: await stylists(db, q("category")) });
    if (path === "availability" && m === "GET")
      return json(
        await availability(db, q("serviceId"), q("date"), q("stylistId")),
      );
    const who = await identity(request);
    if (path === "bookings" && m === "GET")
      return json({ bookings: await listBookings(db, who) }, 200, who);
    if (path === "bookings" && m === "POST") {
      const b = await createBooking(db, who, await readBody(request));
      return json({ booking: b.booking }, b.created ? 201 : 200, who);
    }
    if (path === "bookings/lookup" && m === "POST") {
      const b = await readBody(request);
      if (!value(b, "reference") || !value(b, "email"))
        throw new ApiError(
          400,
          "Enter the booking reference and original email address.",
        );
      return json(
        {
          booking: await findBooking(
            db,
            value(b, "reference"),
            who,
            value(b, "email"),
          ),
        },
        200,
        who,
      );
    }
    if (p[0] === "bookings" && p.length === 3 && m === "POST") {
      const b = await readBody(request);
      if (p[2] === "availability")
        return json(await moveAvailability(db, p[1], who, b), 200, who);
      if (["reschedule", "cancel"].includes(p[2]))
        return json(
          { booking: await changeBooking(db, p[1], who, b, p[2]) },
          200,
          who,
        );
    }
    if (p[0] === "staff") {
      if (!who.staff)
        throw new ApiError(
          403,
          "Sign in with an authorised studio staff account.",
        );
      if (path === "staff/bookings" && m === "GET")
        return json({
          bookings: await listBookings(db, who, true, q("date"), q("status")),
        });
      if (p[1] === "bookings" && p.length === 3 && m === "PATCH") {
        const b = await readBody(request),
          action = value(b, "action");
        if (!["cancel", "complete"].includes(action))
          throw new ApiError(400, "Choose cancel or complete.");
        return json({ booking: await changeBooking(db, p[2], who, b, action) });
      }
      if (path === "staff/services" && m === "GET")
        return json({ services: await services(db, true) });
      if (p[1] === "services") {
        const change =
          path === "staff/services" && m === "POST"
            ? "create"
            : p.length === 3 && m === "PATCH"
              ? "edit"
              : p.length === 3 && m === "DELETE"
                ? "archive"
                : null;
        if (change) {
          const id = change === "create" ? crypto.randomUUID() : p[2];
          const get = () =>
            db
              .prepare("SELECT * FROM services WHERE id=?")
              .bind(id)
              .first<Service>();
          const original = change === "create" ? undefined : await get();
          if (change !== "create" && !original)
            throw new ApiError(404, "Service not found.");
          if (change === "archive")
            await db
              .prepare("UPDATE services SET active=0 WHERE id=?")
              .bind(id)
              .run();
          else {
            const fields = serviceFields({
              ...original,
              ...(await readBody(request)),
            });
            const args = [
              fields.name,
              fields.category,
              fields.description,
              fields.price,
              fields.duration,
              fields.active,
              id,
            ];
            const sql =
              change === "create"
                ? "INSERT INTO services(name,category,description,price,duration,active,id) VALUES(?,?,?,?,?,?,?)"
                : "UPDATE services SET name=?,category=?,description=?,price=?,duration=?,active=? WHERE id=?";
            await db
              .prepare(sql)
              .bind(...args)
              .run();
          }
          return json(
            { service: await get() },
            change === "create" ? 201 : 200,
          );
        }
      }
    }
    throw new ApiError(404, "This API route or method was not found.");
  } catch (e) {
    if (e instanceof ApiError) return json({ error: e.message }, e.status);
    console.error(
      "Studio API request failed",
      e instanceof Error ? e.name : "Unknown error",
    );
    return json(
      {
        error:
          "The studio service is temporarily unavailable. Please try again.",
      },
      500,
    );
  }
}
