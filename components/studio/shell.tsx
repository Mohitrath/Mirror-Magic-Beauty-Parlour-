"use client";
import {
  useState,
  useEffect,
  createContext,
  useContext,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { CalendarDays, Menu, X } from "lucide-react";
import type { Service, Booking } from "@/lib/studio/catalog";
import { brand } from "@/lib/studio/brand";
import { BrandMark, Instagram } from "./marks";
import { InstallApp } from "./install";
import { BookingDialog } from "./booking";
type Action = { service?: Service; move?: Booking; after?: () => void };
const Context = createContext<(action?: Action) => void>(() => {});
export const useBook = () => useContext(Context);
export function StudioShell({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<Action | null>(null),
    [menu, setMenu] = useState(false),
    [anchor, setAnchor] = useState("");
  const path = usePathname() || "/";
  useEffect(() => {
    const update = () => {
      setAnchor(window.location.hash);
      setMenu(false);
    };
    update();
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, [path]);
  useEffect(() => {
    if (!menu) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(false);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [menu]);
  const links = [
    ["Home", "/"],
    ["Services", "/#services"],
    ["Our studio", "/#studio"],
    ["My bookings", "/bookings"],
  ];
  function isActive(href: string) {
    return href === "/"
      ? path === "/" && !anchor
      : href.includes("#")
        ? path === "/" && anchor === href.slice(1)
        : path === href;
  }
  const open = (a: Action = {}) => {
    setMenu(false);
    setModal(a);
  };
  return (
    <Context.Provider value={open}>
      <a className="skip" href="#main-content">
        Skip to content
      </a>
      <header className="site-header">
        <div className="header-in">
          <a
            href="/"
            className="brand-link"
            aria-label="Mirror Magic Beauty Palour home"
          >
            <BrandMark />
          </a>
          <nav
            id="primary-nav"
            aria-label="Main navigation"
            className={"main-nav" + (menu ? " visible" : "")}
          >
            {links.map(([name, href]) => (
              <a
                key={name}
                href={href}
                onClick={() => setMenu(false)}
                aria-current={isActive(href) ? "page" : undefined}
              >
                {name}
              </a>
            ))}
          </nav>
          <div className="header-actions">
            <button className="button primary head-book" onClick={() => open()}>
              <CalendarDays /> Book a visit
            </button>
            <button
              className="hamb icon-btn"
              aria-controls="primary-nav"
              aria-expanded={menu}
              aria-label={menu ? "Close menu" : "Open menu"}
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>
      {children}
      <footer>
        <div className="site-width footer-main">
          <a href="/" className="brand-link" aria-label="Mirror Magic home">
            <BrandMark />
          </a>
          <div className="foot-nav">
            <a href="/#services">Services</a>
            <a href="/bookings">My bookings</a>
            <InstallApp />
            <a href="/staff">Staff desk</a>
            <a href="/api-docs">API docs</a>
            <a
              aria-label="Mirror Magic on Instagram"
              href={brand.instagram}
              target="_blank"
              rel="noreferrer"
            >
              <Instagram size={18} />
            </a>
          </div>
        </div>
        <div className="site-width footer-base">
          <span>Mirror Magic Beauty Palour · Rath, Uttar Pradesh</span>
          <span>Sample menu and hours. Editorial imagery.</span>
        </div>
      </footer>
      {modal && (
        <BookingDialog
          initial={modal.service}
          move={modal.move}
          after={modal.after}
          onClose={() => setModal(null)}
        />
      )}
    </Context.Provider>
  );
}
