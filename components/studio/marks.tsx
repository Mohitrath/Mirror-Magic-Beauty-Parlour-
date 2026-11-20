export function MirrorMark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 52 58"
      fill="none"
      aria-hidden="true"
    >
      <g
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="rotate(-25 25 30)"
      >
        <path d="M10 23C10 11 16.8 4 24 4s14 7 14 19c0 9-5.6 17-11.6 19l-.3 9c0 2.3-1 3.9-2.4 3.9s-2.5-1.6-2.5-3.9l-.4-9C14.5 40 10 32 10 23Z" />
        <ellipse cx="24" cy="22.5" rx="10.6" ry="14.4" />
        <path d="m21 25 6-8m-2 11 4-5M21 44h5" />
      </g>
      <g stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
        <path d="M41 3c0 5-1 6-5 7 4 0 5 2 5 6 1-5 2-6 6-6-4-1-5-2-6-7Z" />
      </g>
    </svg>
  );
}
export function BrandMark() {
  return (
    <span className="brand">
      <MirrorMark className="brand-mirror" />
      <span className="brand-type">
        <span>Mirror Magic</span>
        <small>BEAUTY PALOUR</small>
      </span>
    </span>
  );
}
export function Seal() {
  return (
    <svg className="seal" viewBox="0 0 120 120" aria-hidden="true">
      <path
        d="M60 2 67 6 75 4 81 10 89 10 93 17 101 20 103 28 110 33 110 41 116 48 113 56 117 64 112 71 112 79 105 84 102 92 94 95 89 102 81 103 74 109 66 108 59 113 52 109 44 111 37 105 29 104 25 97 17 94 15 86 8 81 8 73 3 66 6 58 3 50 8 43 8 35 15 30 18 22 26 19 31 12 39 11 45 6 53 7Z"
        fill="#f5d9ce"
        stroke="#793a4d"
        strokeWidth=".75"
      />
      <defs>
        <path
          id="seal-ring"
          d="M 60,60 m -40,0 a 40,40 0 1,1 80,0 a 40,40 0 1,1 -80,0"
        />
      </defs>
      <text
        fill="#673145"
        fontSize="8.5"
        fontFamily="Arial, sans-serif"
        letterSpacing="2.2"
      >
        <textPath href="#seal-ring" textLength="249">
          MIRROR MAGIC • BEAUTY PALOUR •{" "}
        </textPath>
      </text>
      <circle
        cx="60"
        cy="60"
        r="32"
        fill="none"
        stroke="#a66c79"
        strokeWidth=".65"
      />
      <g
        transform="translate(39 39)"
        stroke="#793a4d"
        strokeWidth="1.3"
        fill="none"
      >
        {Array.from({ length: 8 }, (_, i) => (
          <path
            key={i}
            transform={"rotate(" + 45 * i + " 21 21)"}
            d="M20 19c-8-4-9-13-5-14 4-1 8 7 5 14Z"
          />
        ))}
        <circle cx="21" cy="21" r="2.3" />
      </g>
    </svg>
  );
}
export function Instagram({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.6" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
