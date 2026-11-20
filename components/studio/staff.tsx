"use client";
import { useEffect, useState, type FormEvent } from "react";
import { SquarePen, Plus, LockKeyhole, CalendarDays } from "lucide-react";
import {
  art,
  categories,
  type Service,
  type Booking,
  type Category,
} from "@/lib/studio/catalog";
import { api, msg } from "@/lib/studio/client";
import { BookingCard } from "./bookings";
import { Dialog } from "./dialog";
function MenuEditor({
  record,
  onClose,
  onDone,
}: {
  record: Service | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [name, setName] = useState(record?.name ?? ""),
    [desc, setDesc] = useState(record?.description ?? ""),
    [cat, setCat] = useState<Category>(record?.category ?? "Hair"),
    [price, setPrice] = useState(String(record?.price ?? "")),
    [duration, setDuration] = useState(String(record?.duration ?? 60)),
    [active, setActive] = useState((record?.active ?? 1) === 1),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false);
  async function save(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      await api(
        "staff/services" + (record ? "/" + record.id : ""),
        record ? "PATCH" : "POST",
        {
          name,
          description: desc,
          category: cat,
          price: Number(price),
          duration: Number(duration),
          active: active ? 1 : 0,
        },
      );
      onDone();
      onClose();
    } catch (e) {
      setError(msg(e));
    } finally {
      setSaving(false);
    }
  }
  return (
    <Dialog
      title={record ? "Edit treatment" : "New treatment"}
      kicker="SERVICE MENU"
      onClose={onClose}
    >
      <form onSubmit={save} className="form-stack">
        <label>
          Service name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            maxLength={70}
          />
        </label>
        <div className="form-row">
          <label>
            Category
            <select
              value={cat}
              onChange={(e) => setCat(e.target.value as Category)}
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Duration (min)
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              min={15}
              max={240}
              step={15}
              required
            />
          </label>
        </div>
        <label>
          Price (₹)
          <input
            type="number"
            min={1}
            max={100000}
            step={1}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </label>
        <label>
          Description
          <textarea
            rows={3}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            minLength={5}
            maxLength={240}
            required
          />
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />
          Available to book
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="dialog-buttons">
          <button type="button" className="button outline" onClick={onClose}>
            Cancel
          </button>
          <button className="button primary" disabled={saving}>
            {saving ? "Saving…" : "Save treatment"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
export function Staff() {
  const [access, setAccess] = useState<
      "checking" | "staff" | "guest" | "denied"
    >("checking"),
    [tab, setTab] = useState<"appointments" | "menu">("appointments"),
    [date, setDate] = useState(""),
    [status, setStatus] = useState(""),
    [rows, setRows] = useState<Booking[]>([]),
    [menu, setMenu] = useState<Service[]>([]),
    [busy, setBusy] = useState(true),
    [error, setError] = useState(""),
    [reload, setReload] = useState(0),
    [editor, setEditor] = useState<Service | null | undefined>(undefined),
    [key, setKey] = useState(""),
    [sessionTry, setSessionTry] = useState(0);
  useEffect(() => {
    const ctl = new AbortController();
    setError("");
    api<{ staff: boolean; email: string }>(
      "session",
      "GET",
      undefined,
      ctl.signal,
    )
      .then((r) => setAccess(r.staff ? "staff" : r.email ? "denied" : "guest"))
      .catch((e) => {
        if (!ctl.signal.aborted) setError(msg(e));
      });
    return () => ctl.abort();
  }, [sessionTry]);
  useEffect(() => {
    if (access !== "staff") return;
    const ctl = new AbortController();
    setBusy(true);
    setError("");
    const run =
      tab === "appointments"
        ? api<{ bookings: Booking[] }>(
            "staff/bookings?" + new URLSearchParams({ date, status }),
            "GET",
            undefined,
            ctl.signal,
          ).then((r) => setRows(r.bookings))
        : api<{ services: Service[] }>(
            "staff/services",
            "GET",
            undefined,
            ctl.signal,
          ).then((r) => setMenu(r.services));
    run
      .catch((e) => {
        if (!ctl.signal.aborted) setError(msg(e));
      })
      .finally(() => {
        if (!ctl.signal.aborted) setBusy(false);
      });
    return () => ctl.abort();
  }, [access, tab, date, status, reload]);
  return (
    <main id="main-content" className="sub-page site-width">
      <p className="eyebrow">
        <i /> STUDIO MANAGEMENT
      </p>
      <h1>
        The staff <em>desk.</em>
      </h1>
      {access === "checking" ? (
        <div className="inline-note">
          {error ? (
            <>
              <p role="alert">{error}</p>
              <button
                className="text-link"
                onClick={() => setSessionTry((n) => n + 1)}
              >
                Try again
              </button>
            </>
          ) : (
            "Checking staff access…"
          )}
        </div>
      ) : access !== "staff" ? (
        <div className="empty-state">
          <LockKeyhole />
          <h2>Staff sign-in</h2>
          <form className="form-stack" onSubmit={async (event) => {
            event.preventDefault();
            try {
              await api("staff-session", "POST", { key });
              setKey("");
              setSessionTry(n => n + 1);
            } catch (e) { setError(msg(e)); }
          }}>
            <label>Staff access key<input required type="password" autoComplete="current-password" value={key} onChange={e => setKey(e.target.value)} /></label>
            {error && <p role="alert">{error}</p>}
            <button className="button primary">Sign in</button>
          </form>
        </div>
      ) : (
        <>
          <div className="staff-tabs">
            <button onClick={async () => {
              try {
                await api("staff-session", "DELETE");
                setAccess("guest");
                setRows([]);
                setMenu([]);
              } catch (e) { setError(msg(e)); }
            }}>Sign out</button>
            <button
              className={tab === "appointments" ? "active" : ""}
              onClick={() => setTab("appointments")}
            >
              Appointments
            </button>
            <button
              className={tab === "menu" ? "active" : ""}
              onClick={() => setTab("menu")}
            >
              Service menu
            </button>
          </div>
          {tab === "appointments" ? (
            <div className="staff-tools">
              <label>
                Visit date
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </label>
              <label>
                Status
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="">All statuses</option>
                  <option value="booked">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>
              {(date || status) && (
                <button
                  className="text-link"
                  onClick={() => {
                    setDate("");
                    setStatus("");
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="sub-head">
              <h2>Treatments</h2>
              <button
                className="button primary"
                onClick={() => setEditor(null)}
              >
                <Plus />
                Add treatment
              </button>
            </div>
          )}
          {error ? (
            <p className="form-error" role="alert">
              {error}{" "}
              <button
                className="text-link"
                onClick={() => setReload((n) => n + 1)}
              >
                Retry
              </button>
            </p>
          ) : busy ? (
            <p className="inline-note" role="status">
              Loading…
            </p>
          ) : tab === "appointments" ? (
            rows.length ? (
              <div className="visit-list">
                {rows.map((b) => (
                  <BookingCard
                    staff
                    key={b.reference}
                    b={b}
                    onChange={() => setReload((n) => n + 1)}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <CalendarDays />
                <h3>No appointments found</h3>
                <p>
                  {date || status
                    ? "Try a different date or status."
                    : "New customer bookings will appear here."}
                </p>
              </div>
            )
          ) : (
            <div className="admin-menu">
              {menu.map((s) => (
                <div key={s.id}>
                  <img
                    src={art[s.category].image}
                    alt=""
                    width="64"
                    height="54"
                  />
                  <span>
                    <strong>{s.name}</strong>
                    <small>
                      {s.category} · {s.duration} min
                      {s.active ? "" : " · Archived"}
                    </small>
                  </span>
                  <button
                    className="button outline small"
                    aria-label={"Edit " + s.name}
                    onClick={() => setEditor(s)}
                  >
                    <SquarePen />
                    Edit
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      {editor !== undefined && (
        <MenuEditor
          record={editor}
          onClose={() => setEditor(undefined)}
          onDone={() => setReload((n) => n + 1)}
        />
      )}
    </main>
  );
}
