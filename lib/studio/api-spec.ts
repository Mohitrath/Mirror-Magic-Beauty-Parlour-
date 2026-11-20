type Schema = Record<string, unknown>;
const str = (description: string): Schema => ({ type: "string", description });
const num = (description: string): Schema => ({ type: "integer", description });
const obj = (
  properties: Record<string, Schema>,
  required: string[] = [],
): Schema => ({
  type: "object",
  properties,
  ...(required.length ? { required } : {}),
});
const ref = (k: string): Schema => ({ $ref: "#/components/schemas/" + k });
const arr = (items: Schema): Schema => ({ type: "array", items });
const json = (schema: Schema) => ({ "application/json": { schema } });
const day: Schema = { type: "string", format: "date", example: "2026-12-01" };
const hour: Schema = {
  type: "string",
  pattern: "^([01][0-9]|2[0-3]):[0-5][0-9]$",
  example: "11:00",
};
const cat: Schema = {
  type: "string",
  enum: ["Hair", "Skin", "Makeup", "Nails"],
};
const email: Schema = { type: "string", format: "email" };
const code = str("Private booking reference received at confirmation.");
const selection = {
  date: day,
  time: hour,
  stylistId: str(
    "Specialist ID. Omit on new bookings for any eligible specialist.",
  ),
};
const sFields = {
  name: str("Display name, 2–70 characters."),
  description: str("Description, 5–240 characters."),
  category: cat,
  price: num("Whole Indian rupees, 1–100000."),
  duration: num("Minutes, in 15-minute steps from 15 to 240."),
  active: { type: "integer", enum: [0, 1] },
};
const service = obj({
  id: str("Service ID"),
  ...sFields,
  position: num("Display order"),
});
const booking = obj({
  reference: code,
  serviceId: str("Service ID"),
  serviceName: str("Service title at booking"),
  category: cat,
  stylistId: str("Stylist ID"),
  stylistName: str("Stylist name"),
  date: day,
  time: hour,
  duration: num("Reserved minutes"),
  price: num("Agreed price in INR"),
  customerName: str("Name"),
  phone: str("Contact telephone"),
  email,
  status: { type: "string", enum: ["booked", "cancelled", "completed"] },
});
const times = obj({
  date: day,
  timeZone: str("Asia/Kolkata"),
  times: arr(hour),
});
const bookingResult = obj({ booking: ref("Booking") });
const listResult = obj({ bookings: arr(ref("Booking")) });
const serviceResult = obj({ service: ref("Service") });
const collection = obj({ services: arr(ref("Service")) });
const status = obj({ error: str("Human-readable error message") });
const pathParam = (name: string) => ({
  in: "path",
  name,
  required: true,
  schema: { type: "string" },
});
const query = (name: string, schema: Schema, required = false) => ({
  in: "query",
  name,
  required,
  schema,
});
function op(
  summary: string,
  schema: Schema,
  opts: {
    tag?: string;
    body?: Schema;
    params?: unknown[];
    created?: boolean;
  } = {},
) {
  const ok = { description: "Success", content: json(schema) };
  return {
    summary,
    tags: [opts.tag ?? "Studio"],
    ...(opts.params ? { parameters: opts.params } : {}),
    ...(opts.body
      ? { requestBody: { required: true, content: json(opts.body) } }
      : {}),
    responses: {
      "200": ok,
      ...(opts.created ? { "201": { ...ok, description: "Created" } } : {}),
      default: {
        description:
          "Request error. Status codes include 400, 403, 404, 409 and 415.",
        content: json(status),
      },
    },
  };
}
const accessBody = obj({ email });
const pp = [pathParam("reference")],
  sp = [pathParam("id")];
const newBooking = obj(
  {
    requestKey: {
      type: "string",
      format: "uuid",
      description: "A UUID v4 repeated for retries of this request.",
    },
    serviceId: str("Service ID"),
    ...selection,
    customerName: str("Full name"),
    email,
    phone: str("Telephone, 7–15 digits"),
    expectedPrice: num("Optional quoted price"),
    expectedDuration: num("Optional quoted duration"),
  },
  ["requestKey", "serviceId", "date", "time", "customerName", "email", "phone"],
);
export const apiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Mirror Magic Beauty Palour API",
    version: "1.0.0",
    description:
      "All appointment times are local to Asia/Kolkata and prices are in Indian rupees. The server recognises an HTTP-only guest cookie. To manage a booking from another browser, supply the private booking reference and the original email. Staff operations require a valid staff session.",
  },
  servers: [{ url: "/api" }],
  components: {
    schemas: {
      Service: service,
      Booking: booking,
      Stylist: obj({
        id: str("Specialist ID"),
        name: str("Name"),
        title: str("Specialty"),
        categories: arr(cat),
      }),
    },
  },
  paths: {
    "/health": { get: op("Check database health", obj({ status: str("ok") })) },
    "/session": {
      get: op(
        "Identify the session and initialise a guest cookie",
        obj({ staff: { type: "boolean" }, email }),
      ),
    },
    "/services": {
      get: op("List active treatments", collection, {
        params: [query("category", cat)],
      }),
    },
    "/stylists": {
      get: op(
        "List eligible specialists",
        obj({ stylists: arr(ref("Stylist")) }),
        { params: [query("category", cat)] },
      ),
    },
    "/availability": {
      get: op("List available appointment starts", times, {
        params: [
          query("serviceId", str("Service ID"), true),
          query("date", day, true),
          query("stylistId", str("Specialist ID")),
        ],
      }),
    },
    "/bookings": {
      get: op("List the current visitor’s bookings", listResult, {
        tag: "Bookings",
      }),
      post: op("Book an appointment", bookingResult, {
        tag: "Bookings",
        body: newBooking,
        created: true,
      }),
    },
    "/bookings/lookup": {
      post: op("Find a booking using its reference and email", bookingResult, {
        tag: "Bookings",
        body: obj({ reference: code, email }, ["reference", "email"]),
      }),
    },
    "/bookings/{reference}/availability": {
      post: op("Find alternatives for an existing booking", times, {
        tag: "Bookings",
        params: pp,
        body: obj({ email, date: day, stylistId: str("Preferred stylist") }, [
          "date",
        ]),
      }),
    },
    "/bookings/{reference}/reschedule": {
      post: op("Move a booking", bookingResult, {
        tag: "Bookings",
        params: pp,
        body: obj({ email, ...selection }, ["date", "time"]),
      }),
    },
    "/bookings/{reference}/cancel": {
      post: op("Cancel a booking", bookingResult, {
        tag: "Bookings",
        params: pp,
        body: accessBody,
      }),
    },
    "/staff/bookings": {
      get: op("List studio appointments", listResult, {
        tag: "Staff",
        params: [
          query("date", day),
          query("status", str("booked, cancelled or completed")),
        ],
      }),
    },
    "/staff/bookings/{reference}": {
      patch: op("Cancel or complete an appointment", bookingResult, {
        tag: "Staff",
        params: pp,
        body: obj(
          { action: { type: "string", enum: ["cancel", "complete"] } },
          ["action"],
        ),
      }),
    },
    "/staff/services": {
      get: op(
        "List the full service menu, including archived items",
        collection,
        { tag: "Staff" },
      ),
      post: op("Create a treatment", serviceResult, {
        tag: "Staff",
        body: obj(sFields, [
          "name",
          "description",
          "category",
          "price",
          "duration",
        ]),
        created: true,
      }),
    },
    "/staff/services/{id}": {
      patch: op("Edit or restore a treatment", serviceResult, {
        tag: "Staff",
        params: sp,
        body: obj(sFields),
      }),
      delete: op("Archive a treatment", serviceResult, {
        tag: "Staff",
        params: sp,
      }),
    },
  },
};
