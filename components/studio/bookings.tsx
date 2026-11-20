"use client";
import { useState, useEffect, type FormEvent } from "react";
import { CalendarDays, Search, CalendarCheck, Clock3 } from "lucide-react";
import { art, type Booking } from "@/lib/studio/catalog";
import { niceDate, niceTime, visitStamp } from "@/lib/studio/time";
import { api, msg } from "@/lib/studio/client";
import { useBook } from "./shell";
import { Dialog } from "./dialog";
export function BookingCard({
  b,
  staff = false,
  onChange,
}: {
  b: Booking;
  staff?: boolean;
  onChange: (b?: Booking) => void;
}) {
  const book = useBook(),
    [action, setAction] = useState<"cancel" | "complete" | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const future = visitStamp(b.date, b.time) > Date.now();
  async function save() {
    if (!action || busy) return;
    setBusy(true);
    setError("");
    try {
      const base = "bookings/" + b.reference;
      const r = staff
        ? await api<{ booking: Booking }>("staff/" + base, "PATCH", { action })
        : await api<{ booking: Booking }>(base + "/cancel", "POST", {
            email: b.email,
          });
      setAction(null);
      onChange(r.booking);
    } catch (e) {
      setError(msg(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="visit-card">
      <img
        src={art[b.category].image}
        width="112"
        height="112"
        alt=""
        loading="lazy"
      />
      <div className="visit-content">
        <div className="visit-title">
          <h3>{b.serviceName}</h3>
          <span className={"status " + b.status}>
            {b.status === "booked"
              ? "Confirmed"
              : b.status === "completed"
                ? "Completed"
                : "Cancelled"}
          </span>
        </div>
        <div className="visit-info">
          <span>
            <CalendarDays size={15} />
            {niceDate(b.date)}
          </span>
          <span>
            <Clock3 size={15} />
            {niceTime(b.time)} IST · {b.duration} min
          </span>
        </div>
        <p>
          {b.stylistName}
        </p>
        {staff && (
          <p>
            <strong>{b.customerName}</strong> ·{" "}
            <a href={"tel:" + b.phone}>{b.phone}</a> ·{" "}
            <a href={"mailto:" + b.email}>{b.email}</a>
          </p>
        )}
        <small className="ref-code">{b.reference}</small>
        {b.status === "booked" && (future || staff) && (
          <div className="visit-actions">
            {future && (
              <button
                className="text-link"
                onClick={() => book({ move: b, after: () => onChange() })}
              >
                Reschedule
              </button>
            )}
            {staff && !future && (
              <button
                className="text-link"
                onClick={() => {
                  setError("");
                  setAction("complete");
                }}
              >
                Mark completed
              </button>
            )}
            <button
              className="plain-link"
              onClick={() => {
                setError("");
                setAction("cancel");
              }}
            >
              Cancel appointment
            </button>
          </div>
        )}
      </div>
      {action && (
        <Dialog
          title={
            action === "cancel"
              ? "Cancel this appointment?"
              : "Complete this visit?"
          }
          kicker="APPOINTMENT UPDATE"
          onClose={() => setAction(null)}
        >
          <p className="dialog-intro">
            {b.serviceName} on {niceDate(b.date)} at {niceTime(b.time)} IST.
          </p>
          {action === "cancel" && (
            <p>The reserved time will become available for another customer.</p>
          )}
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <div className="dialog-buttons">
            <button className="button outline" onClick={() => setAction(null)}>
              Keep booking
            </button>
            <button className="button primary" onClick={save} disabled={busy}>
              {busy
                ? "Saving…"
                : action === "cancel"
                  ? "Yes, cancel visit"
                  : "Mark completed"}
            </button>
          </div>
        </Dialog>
      )}
    </article>
  );
}
export function MyBookings() {
  const book = useBook(),
    [rows, setRows] = useState<Booking[]>([]),
    [manual, setManual] = useState<Booking | null>(null),
    [reference, setReference] = useState(""),
    [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true),
    [finding, setFinding] = useState(false),
    [findError, setFindError] = useState(""),
    [listError, setListError] = useState(""),
    [reload, setReload] = useState(0);
  useEffect(() => {
    const ctl = new AbortController();
    setLoading(true);
    setListError("");
    api<{ bookings: Booking[] }>("bookings", "GET", undefined, ctl.signal)
      .then((d) => setRows(d.bookings))
      .catch((e) => {
        if (!ctl.signal.aborted) setListError(msg(e));
      })
      .finally(() => {
        if (!ctl.signal.aborted) setLoading(false);
      });
    return () => ctl.abort();
  }, [reload]);
  async function find(e?: FormEvent) {
    e?.preventDefault();
    setFinding(true);
    setFindError("");
    try {
      const r = await api<{ booking: Booking }>("bookings/lookup", "POST", {
        reference,
        email,
      });
      setManual(r.booking);
    } catch (e) {
      setManual(null);
      setFindError(msg(e));
    } finally {
      setFinding(false);
    }
  }
  function changed(b?: Booking) {
    setReload((n) => n + 1);
    if (manual) {
      if (b && manual.reference === b.reference) setManual(b);
      else if (!b) void find();
    }
  }
  const ordered = [...rows].sort((a, b) => {
    const x = a.status === "booked" && visitStamp(a.date, a.time) > Date.now(),
      y = b.status === "booked" && visitStamp(b.date, b.time) > Date.now();
    return x !== y
      ? x
        ? -1
        : 1
      : (x ? 1 : -1) *
          (visitStamp(a.date, a.time) - visitStamp(b.date, b.time));
  });
  return (
    <main id="main-content" className="sub-page site-width">
      <p className="eyebrow">
        <i /> APPOINTMENTS
      </p>
      <h1>
        My <em>bookings.</em>
      </h1>
      <div className="manage-grid">
        <section>
          <div className="sub-head">
            <h2>Your visits</h2>
            <button
              className="button outline small"
              onClick={() => book({ after: () => setReload((n) => n + 1) })}
            >
              <CalendarDays />
              Book a visit
            </button>
          </div>
          {loading ? (
            <p role="status" className="inline-note">
              Loading your appointments…
            </p>
          ) : listError ? (
            <p role="alert" className="form-error">
              {listError}{" "}
              <button
                className="text-link"
                onClick={() => setReload((n) => n + 1)}
              >
                Retry
              </button>
            </p>
          ) : ordered.length ? (
            <div className="visit-list">
              {ordered.map((b) => (
                <BookingCard key={b.reference} b={b} onChange={changed} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <CalendarCheck />
              <h3>No appointments yet</h3>
              <p>
                Your bookings from this account or browser will appear here.
              </p>
              <button
                className="button primary"
                onClick={() => book({ after: () => setReload((v) => v + 1) })}
              >
                Book your first visit
              </button>
            </div>
          )}
        </section>
        <aside className="finder">
          <Search size={23} />
          <h2>Find a booking</h2>
          <p>
            Booked on another device? Use the reference from your confirmation
            and the same email address.
          </p>
          <form className="form-stack" onSubmit={find}>
            <label>
              Booking reference
              <input
                value={reference}
                placeholder="MM-…"
                onChange={(e) => setReference(e.target.value)}
                required
                maxLength={32}
              />
            </label>
            <label>
              Booking email
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <button className="button primary" disabled={finding}>
              {finding ? "Finding…" : "Find booking"}
            </button>
          </form>
          {findError && (
            <p className="form-error" role="alert">
              {findError}
            </p>
          )}
        </aside>
      </div>
      {manual && (
        <section className="lookup-result" aria-live="polite">
          <h2>Booking found</h2>
          <BookingCard b={manual} onChange={changed} />
        </section>
      )}
    </main>
  );
}
