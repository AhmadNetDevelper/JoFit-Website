/*
 * The careers board's icons — inline SVG on a 16-unit grid, the same recipe as
 * `coaches/_components/icons.tsx`: they inherit `currentColor`, so an icon
 * re-tints with the text beside it, and they are `aria-hidden` because every
 * one sits next to a label that already says what it means.
 */
const STROKE = {
  stroke: "currentColor",
  strokeWidth: 1.3,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function Frame({ children, size = 16 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0">
      {children}
    </svg>
  );
}

type IconProps = { size?: number };

export function PinIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <path d="M8 14.5s5-4.2 5-8a5 5 0 1 0-10 0c0 3.8 5 8 5 8Z" {...STROKE} />
      <circle cx="8" cy="6.4" r="1.9" {...STROKE} />
    </Frame>
  );
}

export function BriefcaseIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <rect x="1.8" y="4.6" width="12.4" height="9" {...STROKE} />
      <path d="M5.6 4.6V2.4h4.8v2.2M1.8 8.6h12.4" {...STROKE} />
    </Frame>
  );
}

/** Where the work happens: a building with a door. */
export function BuildingIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <path d="M2.4 14.4V2.4h7.2v12M9.6 6.4h4v8M1.4 14.4h13.2" {...STROKE} />
      <path d="M4.8 5.2h2.4M4.8 8h2.4M5.4 14.4v-2.8h1.2v2.8" {...STROKE} />
    </Frame>
  );
}

/** Experience: three rising bars. */
export function LevelIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <path d="M2.4 13.6v-3.2M6.1 13.6V7.4M9.9 13.6V4.6M13.6 13.6V2.4" {...STROKE} strokeWidth={1.8} />
    </Frame>
  );
}

export function CalendarIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <rect x="1.8" y="3" width="12.4" height="11.2" {...STROKE} />
      <path d="M1.8 6.6h12.4M5 1.6V4.2M11 1.6V4.2" {...STROKE} />
    </Frame>
  );
}

export function ClockIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <circle cx="8" cy="8" r="6.4" {...STROKE} />
      <path d="M8 4.4V8l2.4 1.6" {...STROKE} />
    </Frame>
  );
}

export function UsersIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <circle cx="6" cy="5.4" r="2.4" {...STROKE} />
      <path d="M1.6 13.8c.4-2.6 2.2-4 4.4-4s4 1.4 4.4 4M10.6 3.2a2.4 2.4 0 0 1 0 4.4M12.2 9.9c1.2.5 2 1.8 2.2 3.9" {...STROKE} />
    </Frame>
  );
}

export function ChatIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <path d="M2 3h12v8H7.6L4.4 13.6V11H2V3Z" {...STROKE} />
    </Frame>
  );
}

/** Salary: a note with a coin on it. */
export function WalletIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <rect x="1.6" y="4" width="12.8" height="8.4" {...STROKE} />
      <circle cx="8" cy="8.2" r="1.9" {...STROKE} />
      <path d="M4 6.2v4M12 6.2v4" {...STROKE} />
    </Frame>
  );
}

export function CheckIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <path d="m3 8.4 3.2 3.1L13 4.6" {...STROKE} strokeWidth={1.6} />
    </Frame>
  );
}

export function StarIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <path
        d="m8 1.8 1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.6l-3.8 2 .7-4.3-3.1-3 4.3-.6L8 1.8Z"
        fill="currentColor"
      />
    </Frame>
  );
}

export function SearchIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <circle cx="7" cy="7" r="4.8" {...STROKE} />
      <path d="m10.6 10.6 3.6 3.6" {...STROKE} />
    </Frame>
  );
}

export function MailIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <rect x="1.6" y="3.2" width="12.8" height="9.6" {...STROKE} />
      <path d="m1.8 3.6 6.2 5 6.2-5" {...STROKE} />
    </Frame>
  );
}

export function PhoneIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <path
        d="M3.2 1.8h2.6l1.2 3.1-1.6 1c.8 1.7 2 2.9 3.7 3.7l1-1.6 3.1 1.2v2.6c0 .7-.6 1.3-1.3 1.3C6.6 13.1 2.9 9.4 1.9 4.1c0-.7.6-1.3 1.3-1.3Z"
        {...STROKE}
      />
    </Frame>
  );
}

export function GlobeIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <circle cx="8" cy="8" r="6.4" {...STROKE} />
      <path d="M2 8h12M8 1.6c1.7 1.8 2.6 4 2.6 6.4S9.7 12.6 8 14.4C6.3 12.6 5.4 10.4 5.4 8S6.3 3.4 8 1.6Z" {...STROKE} />
    </Frame>
  );
}

export function DownloadIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <path d="M8 1.8v8.4M4.6 7 8 10.4 11.4 7M2.2 12.2v2h11.6v-2" {...STROKE} />
    </Frame>
  );
}

export function ShieldIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <path d="M8 1.6 13.4 3.6V7.8c0 3.1-2.3 5.6-5.4 6.6-3.1-1-5.4-3.5-5.4-6.6V3.6L8 1.6Z" {...STROKE} />
      <path d="m5.6 8 1.7 1.6 3.1-3.2" {...STROKE} />
    </Frame>
  );
}
