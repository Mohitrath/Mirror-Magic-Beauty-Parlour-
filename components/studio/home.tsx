"use client";
import { useState } from "react";
import {
  CalendarDays,
  MapPin,
  Scissors,
  Sparkles,
  Paintbrush,
  Hand,
  Phone,
  Clock3,
  ChevronDown,
} from "lucide-react";
import {
  art,
  categories,
  type Service,
  type Category,
} from "@/lib/studio/catalog";
import { brand } from "@/lib/studio/brand";
import { useBook } from "./shell";
import { Seal, Instagram } from "./marks";
import { PhotoGallery, studioPhotos, tiltPhoto, resetTilt } from "./photo-gallery";
const icons = {
  Hair: Scissors,
  Skin: Sparkles,
  Makeup: Paintbrush,
  Nails: Hand,
};
const edits = [
  ...studioPhotos,
  {
    src: "/images/hero.webp",
    title: "The rose glow",
    alt: "An editorial beauty portrait with a pink garden rose and warm, luminous makeup",
  },
  { src: "/images/hair.webp", title: "The soft wave", alt: art.Hair.alt },
  { src: "/images/nails.webp", title: "The petal polish", alt: art.Nails.alt },
];
export function Home({ menu }: { menu: Service[] }) {
  const book = useBook(),
    [filter, setFilter] = useState<Category | "All">("All"),
    [expanded, setExpanded] = useState(false),
    [slide, setSlide] = useState(0);
  const filtered = menu.filter(
      (s) => filter === "All" || s.category === filter,
    ),
    shown = expanded || filter !== "All" ? filtered : filtered.slice(0, 4);
  function choose(cat: Category | "All") {
    setFilter(cat);
    setExpanded(false);
  }
  return (
    <main id="main-content">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <div className="hero-inner">
            <p className="eyebrow hero-brow">
              <i /> BOUTIQUE BEAUTY STUDIO <span>·</span> RATH
            </p>
            <h1 id="hero-title">
              Beauty in
              <br />
              <em>full bloom.</em>
            </h1>
            <p className="hero-desc">
              From a fresh cut to a soft glam finish, find your beauty ritual at
              Mirror Magic in Rath.
            </p>
            <div className="hero-ctas">
              <button className="button primary" onClick={() => book()}>
                <CalendarDays />
                Book an appointment
              </button>
              <a className="text-link" href="#services">
                Explore services
              </a>
            </div>
          </div>
          <Seal />
        </div>
        <div className={"hero-photo slide-" + slide} onPointerMove={tiltPhoto} onPointerLeave={resetTilt}>
          <div className="portrait-mount">
          <img
            key={edits[slide].src}
            src={edits[slide].src}
            className="hero-img"
            alt={edits[slide].alt}
            width="1536"
            height="1024"
            fetchPriority="high"
          />
          </div>
          <div className="lookbook">
            <div>
              <p>{slide < 2 ? "INSIDE THE STUDIO" : "THE LOOKBOOK"}</p>
              <span>{edits[slide].title}</span>
            </div>
            <div
              className="slide-dots"
              role="group"
              aria-label="Lookbook photographs"
            >
              {edits.map((item, i) => (
                <button
                  key={item.title}
                  className={slide === i ? "selected" : ""}
                  onClick={() => setSlide(i)}
                  aria-label={"Show " + item.title}
                  aria-pressed={slide === i}
                >
                  <span />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
      <div className="service-strip" aria-label="Browse treatment categories">
        <div className="strip-inner">
          {categories.map((cat, i) => {
            const Icon = icons[cat];
            return (
              <div className="strip-item" key={cat}>
                <a href="#services" onClick={() => choose(cat)}>
                  <Icon size={23} strokeWidth={1.4} />
                  <span>{art[cat].label}</span>
                </a>
                {i < categories.length - 1 && (
                  <span className="strip-star" aria-hidden="true">
                    ✧
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <section
        className="service-section site-width"
        id="services"
        aria-labelledby="menu-title"
      >
        <div className="menu-header">
          <div>
            <p className="eyebrow">
              <i /> OUR SERVICES
            </p>
            <h2 id="menu-title">
              The beauty <em>menu.</em>
            </h2>
          </div>
          <div className="filters" role="group" aria-label="Filter services">
            {(["All", ...categories] as const).map((cat) => (
              <button
                type="button"
                key={cat}
                onClick={() => choose(cat)}
                className={filter === cat ? "selected" : ""}
                aria-pressed={filter === cat}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <div className="service-grid" aria-live="polite">
          {shown.map((s) => (
            <article className="service-card" key={s.id}>
              <button
                className="service-picture"
                aria-label={"Book " + s.name}
                onClick={() => book({ service: s })}
              >
                <img
                  src={art[s.category].image}
                  alt={art[s.category].alt}
                  width="640"
                  height="440"
                  loading="lazy"
                />
                <span className="photo-category">{s.category}</span>
              </button>
              <div className="card-in">
                <div className="service-meta">
                  <Clock3 size={14} /> {s.duration} min
                </div>
                <h3>{s.name}</h3>
                <p>{s.description}</p>
                <div className="card-action">
                  <button
                    className="text-link"
                    onClick={() => book({ service: s })}
                  >
                    Book service
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
        {!shown.length && (
          <p className="inline-note">
            No services in this category are available to book.
          </p>
        )}
        {filter === "All" && filtered.length > 4 && (
          <div className="more-wrap">
            <button
              className="button outline"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? "Show fewer services" : "View full menu"}
              <ChevronDown className={expanded ? "rotated" : ""} size={16} />
            </button>
          </div>
        )}
        <p className="sample-note">
          Sample service menu. Call the studio to confirm before your
          visit.
        </p>
      </section>
      <section id="studio" className="studio-section">
        <div className="site-width studio-grid">
          <PhotoGallery />
          <div className="studio-copy">
            <p className="eyebrow">
              <i /> OUR STUDIO
            </p>
            <h2>
              A little magic
              <br />
              <em>in Rath.</em>
            </h2>
            <p>
              Mirror Magic Beauty Palour is owned by{" "}
              <strong>{brand.owner}</strong>. You’ll find the studio on Kurra
              Road, near Munsi ji ke kuaa.
            </p>
            <dl className="studio-details">
              <div>
                <dt>
                  <MapPin /> Visit us
                </dt>
                <dd>{brand.address}</dd>
              </div>
              <div>
                <dt>
                  <Phone /> Call the studio
                </dt>
                <dd>
                  <a href={brand.tel}>{brand.phone}</a>
                </dd>
              </div>
              <div>
                <dt>
                  <Clock3 /> Sample hours
                </dt>
                <dd>Tuesday–Sunday, 10 am–7 pm IST</dd>
              </div>
            </dl>
            <div className="studio-links">
              <a
                href={brand.directions}
                target="_blank"
                rel="noreferrer"
                className="button primary"
              >
                <MapPin />
                Get directions
              </a>
              <a
                href={brand.instagram}
                target="_blank"
                rel="noreferrer"
                className="social-link"
              >
                <Instagram />
                Instagram
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
