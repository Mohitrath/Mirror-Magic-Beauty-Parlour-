"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  CalendarCheck,
  Check,
  Clock3,
  Copy,
  MapPin,
  Wallet,
} from "lucide-react";
import {
  art,
  type Booking,
  type Service,
  type Stylist,
} from "@/lib/studio/catalog";
import {
  addDays,
  ADVANCE,
  firstDay,
  isOpenDate,
  localDay,
  niceDate,
  niceTime,
} from "@/lib/studio/time";
import { api, msg, RequestError } from "@/lib/studio/client";
import { Dialog } from "./dialog";

export function BookingDialog({
  initial,
  move,
  after,
  onClose,
}: {
  initial?: Service;
  move?: Booking;
  after?: () => void;
  onClose: () => void;
}) {
  const [services, setServices] = useState<Service[]>([]),
    [team, setTeam] = useState<Stylist[]>([]);
  const [serviceId, setServiceId] = useState(initial?.id ?? ""),
    [stylist, setStylist] = useState(move?.stylistId ?? "");
  const [date, setDate] = useState(() =>
      firstDay(move?.duration ?? initial?.duration ?? 60),
    ),
    [time, setTime] = useState(""),
    [times, setTimes] = useState<string[]>([]),
    [period, setPeriod] = useState(0);
  const [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [phone, setPhone] = useState("");
  const [stage, setStage] = useState(1),
    [saving, setSaving] = useState(false),
    [booking, setBooking] = useState<Booking | null>(null),
    [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true),
    [slotLoading, setSlotLoading] = useState(false),
    [loadError, setLoadError] = useState(""),
    [slotError, setSlotError] = useState(""),
    [error, setError] = useState(""),
    [refresh, setRefresh] = useState(0);
  const requestKey = useRef(""),
    submitLock = useRef(false);
  useEffect(() => {
    if (!requestKey.current) requestKey.current = crypto.randomUUID();
  }, []);
  useEffect(() => {
    const ctl = new AbortController();
    setLoading(true);
    setLoadError("");
    Promise.all([
      api<{ services: Service[] }>("services", "GET", undefined, ctl.signal),
      api<{ stylists: Stylist[] }>("stylists", "GET", undefined, ctl.signal),
      api<{ email: string }>("session", "GET", undefined, ctl.signal),
    ])
      .then(([menu, people, user]) => {
        setServices(menu.services);
        setTeam(people.stylists);
        setEmail((old) => old || user.email);
        setServiceId((old) =>
          menu.services.some((s) => s.id === old)
            ? old
            : (menu.services[0]?.id ?? ""),
        );
        setLoading(false);
      })
      .catch((e) => {
        if (!ctl.signal.aborted) {
          setLoadError(msg(e));
          setLoading(false);
        }
      });
    return () => ctl.abort();
  }, [refresh]);
  const service = services.find((s) => s.id === serviceId);
  const item = move
    ? {
        id: move.serviceId,
        name: move.serviceName,
        price: move.price,
        category: move.category,
        duration: move.duration,
      }
    : service;
  const itemId = item?.id;
  useEffect(() => {
    setTime("");
    setTimes([]);
    setSlotError("");
    setSlotLoading(false);
    if (!itemId || !date || !isOpenDate(date) || loading) return;
    const ctl = new AbortController();
    setSlotLoading(true);
    const params = new URLSearchParams({
      serviceId: itemId,
      date,
      stylistId: stylist,
    });
    const promise = move
      ? api<{ times: string[] }>(
          "bookings/" + move.reference + "/availability",
          "POST",
          { date, stylistId: stylist, email: move.email },
          ctl.signal,
        )
      : api<{ times: string[] }>(
          "availability?" + params,
          "GET",
          undefined,
          ctl.signal,
        );
    promise
      .then((r) => {
        if (ctl.signal.aborted) return;
        setTimes(r.times);
        setPeriod(r.times.length ? part(r.times[0]) : 0);
        setSlotLoading(false);
      })
      .catch((e) => {
        if (!ctl.signal.aborted) {
          setSlotError(msg(e));
          setSlotLoading(false);
        }
      });
    return () => ctl.abort();
  }, [itemId, date, stylist, move, refresh, loading]);
  function part(t: string) {
    const h = Number(t.slice(0, 2));
    return h < 12 ? 0 : h < 16 ? 1 : 2;
  }
  function selectService(id: string) {
    setServiceId(id);
    setStylist("");
    setTime("");
    setError("");
  }
  async function send(e: FormEvent) {
    e.preventDefault();
    if (submitLock.current || !item || !time) return;
    setError("");
    if (stage === 1 && !move) {
      setStage(2);
      return;
    }
    submitLock.current = true;
    setSaving(true);
    try {
      const response = move
        ? await api<{ booking: Booking }>(
            "bookings/" + move.reference + "/reschedule",
            "POST",
            { date, time, stylistId: stylist, email: move.email },
          )
        : await api<{ booking: Booking }>("bookings", "POST", {
            requestKey: requestKey.current,
            serviceId: item.id,
            stylistId: stylist,
            date,
            time,
            customerName: name,
            email,
            phone,
            expectedDuration: item.duration,
          });
      setBooking(response.booking);
      after?.();
    } catch (e) {
      setError(msg(e));
      if (e instanceof RequestError && e.status === 409) {
        setStage(1);
        setRefresh((n) => n + 1);
        requestKey.current = crypto.randomUUID();
      }
    } finally {
      setSaving(false);
      submitLock.current = false;
    }
  }
  const chosen =
    team.find((s) => s.id === stylist)?.name ?? "Any available specialist";
  async function copy(ref: string) {
    try {
      await navigator.clipboard.writeText(ref);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }
  if (booking)
    return (
      <Dialog
        kicker="MIRROR MAGIC"
        title={move ? "Visit rescheduled" : "You’re booked."}
        onClose={onClose}
      >
        <div className="success-mark">
          <CalendarCheck />
        </div>
        <p className="dialog-intro">
          {booking.customerName}, your appointment is saved at Mirror Magic
          Beauty Palour.
        </p>
        <div className="receipt">
          <h3>{booking.serviceName}</h3>
          <p>
            {niceDate(booking.date)} · {niceTime(booking.time)} IST
          </p>
          <p>
            {booking.stylistName} · {booking.duration} min
          </p>
        </div>
        <div className="ref-area">
          <span className="field-label">Booking reference</span>
          <div>
            <code>{booking.reference}</code>
            <button
              className="icon-btn"
              onClick={() => copy(booking.reference)}
              aria-label="Copy booking reference"
            >
              {copied ? <Check size={17} /> : <Copy size={17} />}
            </button>
          </div>
        </div>
        <p className="muted">
          Keep this reference and use your booking email to find this visit on
          another device.
        </p>
        <div className="dialog-buttons">
          <button className="button outline" onClick={onClose}>
            Done
          </button>
          <a href="/bookings" className="button primary" onClick={onClose}>
            My bookings
          </a>
        </div>
      </Dialog>
    );
  return (
    <Dialog
      kicker={move ? "MANAGE YOUR VISIT" : "MIRROR MAGIC · APPOINTMENTS"}
      title={
        move
          ? "Reschedule your visit"
          : stage === 1
            ? "Book a visit"
            : "Your details"
      }
      onClose={onClose}
      wide
    >
      {!move && (
        <div className="steps">
          <span className={stage === 1 ? "current" : "finished"}>
            {stage === 2 ? <Check size={14} /> : <b>1</b>}Your visit
          </span>
          <i />
          <span className={stage === 2 ? "current" : ""}>
            <b>2</b>Your details
          </span>
        </div>
      )}
      {loadError ? (
        <div role="alert" className="inline-note">
          {loadError}{" "}
          <button
            className="text-link"
            onClick={() => setRefresh((v) => v + 1)}
          >
            Try again
          </button>
        </div>
      ) : loading ? (
        <p role="status" className="inline-note">
          Loading the studio menu…
        </p>
      ) : !item ? (
        <p className="inline-note">
          There are currently no bookable services. Call the studio on
          9236279462.
        </p>
      ) : (
        <form onSubmit={send}>
          {stage === 1 ? (
            <div className="form-stack">
              {!move && (
                <label>
                  Treatment
                  <select
                    value={serviceId}
                    onChange={(e) => selectService(e.target.value)}
                  >
                    {services.map((s) => (
                      <option value={s.id} key={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <div className="chosen-service">
                <img
                  src={art[item.category].image}
                  alt=""
                  width="70"
                  height="62"
                />
                <div>
                  <strong>{item.name}</strong>
                  <span>
                    <Clock3 size={13} />
                    {item.duration} min
                  </span>
                </div>
              </div>
              <div className="form-row">
                <label>
                  Specialist
                  <select
                    value={stylist}
                    onChange={(e) => setStylist(e.target.value)}
                  >
                    {!move && <option value="">Any available</option>}
                    {team
                      .filter((t) => t.categories.includes(item.category))
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                  </select>
                </label>
                <label>
                  Visit date
                  <input
                    required
                    type="date"
                    min={localDay()}
                    max={addDays(localDay(), ADVANCE)}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </label>
              </div>
              <div>
                <div className="label-line">
                  <span className="field-label">Available times</span>
                  <span className="muted">India time (IST)</span>
                </div>
                {!date || !isOpenDate(date) ? (
                  <p className="inline-note">
                    Select an open day within 90 days. The studio closes on
                    Mondays.
                  </p>
                ) : slotLoading ? (
                  <p className="inline-note" role="status">
                    Checking available times…
                  </p>
                ) : slotError ? (
                  <p className="inline-note error" role="alert">
                    {slotError}{" "}
                    <button
                      className="text-link"
                      type="button"
                      onClick={() => setRefresh((v) => v + 1)}
                    >
                      Retry
                    </button>
                  </p>
                ) : !times.length ? (
                  <p className="inline-note">
                    No appointments are available for this day. Try another date
                    or specialist.
                  </p>
                ) : (
                  <>
                    <div
                      className="periods"
                      role="group"
                      aria-label="Time of day"
                    >
                      {["Morning", "Afternoon", "Evening"].map((label, i) => (
                        <button
                          type="button"
                          key={label}
                          className={period === i ? "active" : ""}
                          onClick={() => setPeriod(i)}
                          disabled={!times.some((t) => part(t) === i)}
                          aria-pressed={period === i}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <div
                      className="times"
                      role="group"
                      aria-label="Available start times"
                    >
                      {times
                        .filter((t) => part(t) === period)
                        .map((t) => (
                          <button
                            key={t}
                            type="button"
                            className={time === t ? "active" : ""}
                            aria-pressed={time === t}
                            onClick={() => {
                              setTime(t);
                              setError("");
                            }}
                          >
                            {niceTime(t)}
                          </button>
                        ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="form-stack">
              <div className="receipt">
                <h3>{item.name}</h3>
                <p>
                  {niceDate(date)} · {niceTime(time)} IST
                </p>
                <p>{chosen}</p>
              </div>
              <label>
                Full name
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  placeholder="Your full name"
                  required
                  minLength={2}
                  maxLength={80}
                />
              </label>
              <div className="form-row">
                <label>
                  Email address
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    required
                    maxLength={180}
                  />
                </label>
                <label>
                  Phone number
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                    placeholder="Your mobile number"
                    required
                    minLength={7}
                    maxLength={28}
                  />
                </label>
              </div>
              <p className="pay-note">
                <Wallet size={17} /> Pay at the studio
              </p>
            </div>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="dialog-buttons">
            {stage === 2 && !move ? (
              <button
                type="button"
                className="button outline"
                disabled={saving}
                onClick={() => {
                  setStage(1);
                  setError("");
                }}
              >
                Back
              </button>
            ) : (
              <span className="location-note">
                <MapPin size={15} /> Rath
              </span>
            )}
            <button
              className="button primary"
              disabled={saving || !time || slotLoading}
            >
              {saving
                ? "Saving…"
                : move
                  ? "Save new time"
                  : stage === 1
                    ? "Continue"
                    : "Confirm appointment"}
            </button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
