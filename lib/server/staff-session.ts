import { createHash, createHmac, timingSafeEqual } from "node:crypto";
const lifetime = 8 * 3600;
function matches(left: string, right: string) {
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(left), digest(right));
}
function signature(expires: string, key: string) {
  return createHmac("sha256", key).update("staff:" + expires).digest("hex");
}
export function staffSession(request: Request) {
  const key = process.env.STUDIO_STAFF_KEY;
  const match = /(?:^|;\s*)studio_staff=(\d+)\.([a-f0-9]{64})(?:;|$)/.exec(request.headers.get("cookie") || "");
  return !!key && key.length >= 32 && !!match && Number(match[1]) > Date.now() &&
    matches(signature(match[1], key), match[2]);
}
export function staffCookie(request: Request, supplied: string | null) {
  let value = "", age = 0;
  if (supplied !== null) {
    const key = process.env.STUDIO_STAFF_KEY;
    if (!key || key.length < 32 || !matches(key, supplied)) return null;
    age = lifetime;
    const expires = String(Date.now() + age * 1000);
    value = expires + "." + signature(expires, key);
  }
  return "studio_staff=" + value + "; Path=/; Max-Age=" + age + "; HttpOnly; SameSite=Strict" +
    (new URL(request.url).protocol === "https:" ? "; Secure" : "");
}
