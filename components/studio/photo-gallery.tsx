"use client";
import { useState, type PointerEvent } from "react";
import { Expand } from "lucide-react";
import { Dialog } from "./dialog";

export const studioPhotos = [
  { src: "/images/styling-mirror.webp", title: "The styling mirror", alt: "A tall gold-lit mirror beneath the studio’s pink ceiling lights" },
  { src: "/images/reception.webp", title: "The reception corner", alt: "Mirror Magic’s reception desk framed by balloons and an arched mirror" },
];

export function tiltPhoto(event: PointerEvent<HTMLElement>) {
  if (event.pointerType === "touch" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const panel = event.currentTarget;
  const rect = panel.getBoundingClientRect();
  panel.style.setProperty("--pitch", ((0.5 - (event.clientY - rect.top) / rect.height) * 8) + "deg");
  panel.style.setProperty("--yaw", (((event.clientX - rect.left) / rect.width - 0.5) * 11) + "deg");
}

export function resetTilt(event: PointerEvent<HTMLElement>) {
  event.currentTarget.style.removeProperty("--pitch");
  event.currentTarget.style.removeProperty("--yaw");
}

export function PhotoGallery() {
  const [active, setActive] = useState<number | null>(null);
  return (
    <div className="print-gallery" onPointerMove={tiltPhoto} onPointerLeave={resetTilt}>
      {studioPhotos.map((photo, index) => (
        <button className="studio-print" key={photo.src} onClick={() => setActive(index)} aria-label={"Enlarge " + photo.title}>
          <img src={photo.src} alt={photo.alt} width={728} height={970} loading="lazy" />
          <span>{photo.title}<Expand size={16} aria-hidden="true" /></span>
        </button>
      ))}
      {active !== null && (
        <Dialog title={studioPhotos[active].title} kicker="Inside Mirror Magic" onClose={() => setActive(null)}>
          <img className="gallery-enlargement" key={active} src={studioPhotos[active].src} alt={studioPhotos[active].alt} />
          <button className="button outline gallery-other" onClick={() => setActive(1 - active)}>View {studioPhotos[1 - active].title.toLowerCase()}</button>
        </Dialog>
      )}
    </div>
  );
}
