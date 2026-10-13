/*
 * Inline SVG, not an icon font — the same reasoning as the header's set.
 *
 * Inline means they inherit `currentColor`, so an icon re-tints with the text
 * beside it rather than carrying a colour of its own.
 *
 * All of them are 16×16 on a 16-unit grid and are `aria-hidden`: every one sits
 * next to a label, so a name here would be read twice.
 */
const STROKE = {
  stroke: "currentColor",
  strokeWidth: 1.3,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function Frame({ children, size = 16 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      {children}
    </svg>
  );
}

export function PinIcon({ size }: { size?: number }) {
  return (
    <Frame size={size}>
      <path d="M8 14.5s5-4.2 5-8a5 5 0 1 0-10 0c0 3.8 5 8 5 8Z" {...STROKE} />
      <circle cx="8" cy="6.4" r="1.9" {...STROKE} />
    </Frame>
  );
}

export function ClockIcon({ size }: { size?: number }) {
  return (
    <Frame size={size}>
      <circle cx="8" cy="8" r="6.4" {...STROKE} />
      <path d="M8 4.4V8l2.4 1.6" {...STROKE} />
    </Frame>
  );
}

export function GlobeIcon({ size }: { size?: number }) {
  return (
    <Frame size={size}>
      <circle cx="8" cy="8" r="6.4" {...STROKE} />
      <path d="M2 8h12M8 1.6c1.7 1.8 2.6 4 2.6 6.4S9.7 12.6 8 14.4C6.3 12.6 5.4 10.4 5.4 8S6.3 3.4 8 1.6Z" {...STROKE} />
    </Frame>
  );
}

export function MedalIcon({ size }: { size?: number }) {
  return (
    <Frame size={size}>
      <circle cx="8" cy="10" r="4.1" {...STROKE} />
      <path d="M5.6 6.3 4 1.6h8l-1.6 4.7" {...STROKE} />
    </Frame>
  );
}

export function ChatIcon({ size }: { size?: number }) {
  return (
    <Frame size={size}>
      <path d="M14 9.2a2.3 2.3 0 0 1-2.3 2.3H5.4L2 14.2V4.1a2.3 2.3 0 0 1 2.3-2.3h7.4A2.3 2.3 0 0 1 14 4.1Z" {...STROKE} />
    </Frame>
  );
}

export function CheckIcon({ size }: { size?: number }) {
  return (
    <Frame size={size}>
      <path d="m3 8.4 3.4 3.3L13 4.6" {...STROKE} strokeWidth={1.8} />
    </Frame>
  );
}

export function CalendarIcon({ size }: { size?: number }) {
  return (
    <Frame size={size}>
      <rect x="2" y="3.2" width="12" height="11" rx="1.4" {...STROKE} />
      <path d="M2 6.6h12M5.4 1.6v3M10.6 1.6v3" {...STROKE} />
    </Frame>
  );
}

export function UserIcon({ size }: { size?: number }) {
  return (
    <Frame size={size}>
      <circle cx="8" cy="5.4" r="2.9" {...STROKE} />
      <path d="M2.6 14.4a5.4 5.4 0 0 1 10.8 0" {...STROKE} />
    </Frame>
  );
}

export function SearchIcon({ size }: { size?: number }) {
  return (
    <Frame size={size}>
      <circle cx="7.2" cy="7.2" r="4.9" {...STROKE} />
      <path d="m10.8 10.8 3.4 3.4" {...STROKE} />
    </Frame>
  );
}

/** A certificate with its seal — what a credential row leads with. */
export function CertificateIcon({ size }: { size?: number }) {
  return (
    <Frame size={size}>
      <path d="M9.6 12.6H3.2A1.4 1.4 0 0 1 1.8 11.2V3.4A1.4 1.4 0 0 1 3.2 2h9.6a1.4 1.4 0 0 1 1.4 1.4v2.4" {...STROKE} />
      <path d="M4.6 5.2h6.8M4.6 7.8h3.4" {...STROKE} />
      <circle cx="12" cy="9.6" r="2.2" {...STROKE} />
      <path d="m10.9 11.5-.6 3 1.7-.9 1.7.9-.6-3" {...STROKE} />
    </Frame>
  );
}

/** Two speech bubbles: the languages a coach works in. */
export function LanguagesIcon({ size }: { size?: number }) {
  return (
    <Frame size={size}>
      <path d="M9.6 6.4V3.2A1.4 1.4 0 0 0 8.2 1.8H3.2a1.4 1.4 0 0 0-1.4 1.4v3.4a1.4 1.4 0 0 0 1.4 1.4h.6v2l2.4-2" {...STROKE} />
      <path d="M7.8 8.4a1.4 1.4 0 0 1 1.4-1.4h3.6a1.4 1.4 0 0 1 1.4 1.4v2.8a1.4 1.4 0 0 1-1.4 1.4h-.4v1.8l-2.2-1.8h-1a1.4 1.4 0 0 1-1.4-1.4Z" {...STROKE} />
    </Frame>
  );
}

/**
 * The one icon that is filled rather than stroked: a hollow star at 12px reads
 * as a smudge, and the rating chip depends on it being legible small.
 */
export function StarIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" className="shrink-0">
      <path
        d="m8 1.6 1.94 3.94 4.35.63-3.15 3.07.74 4.33L8 11.53 4.12 13.57l.74-4.33L1.71 6.17l4.35-.63Z"
        fill="currentColor"
      />
    </svg>
  );
}
