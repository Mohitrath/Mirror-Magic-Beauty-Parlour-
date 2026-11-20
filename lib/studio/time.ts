export const OPEN = 600;
export const CLOSE = 1140;
export const LEAD = 30;
export const ADVANCE = 90;
export const zone = "Asia/Kolkata";
const dayMs = 86400000;
export const localDay = (now = Date.now()) =>
  new Date(now + 330 * 60000).toISOString().slice(0, 10);
export const addDays = (day: string, amount: number) =>
  new Date(Date.parse(day + "T00:00:00Z") + dayMs * amount)
    .toISOString()
    .slice(0, 10);
export function isOpenDate(day: string, now = Date.now()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  const date = new Date(day + "T00:00:00Z");
  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== day
  )
    return false;
  const today = localDay(now);
  return (
    day >= today && day <= addDays(today, ADVANCE) && date.getUTCDay() !== 1
  );
}
export const clock = (minute: number) =>
  String(Math.floor(minute / 60)).padStart(2, "0") +
  ":" +
  String(minute % 60).padStart(2, "0");
export const readTime = (time: string) =>
  /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)
    ? Number(time.slice(0, 2)) * 60 + Number(time.slice(3))
    : -1;
export const visitStamp = (date: string, time: string) =>
  Date.parse(date + "T" + time + ":00+05:30");
export const canStart = (
  day: string,
  start: number,
  duration: number,
  now = Date.now(),
) =>
  isOpenDate(day, now) &&
  start >= OPEN &&
  start % 15 === 0 &&
  start + duration <= CLOSE &&
  visitStamp(day, clock(start)) >= now + LEAD * 60000;
export function firstDay(duration = 30) {
  const today = localDay();
  for (let n = 0; n <= ADVANCE; n++) {
    const day = addDays(today, n);
    if (canStart(day, CLOSE - duration, duration)) return day;
  }
  return today;
}
export function niceTime(time: string) {
  const h = Number(time.slice(0, 2));
  return (h % 12 || 12) + ":" + time.slice(3) + (h < 12 ? " am" : " pm");
}
export const niceDate = (day: string) =>
  new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(day + "T12:00:00Z"));
