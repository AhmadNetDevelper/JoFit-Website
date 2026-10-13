/*
 * The employer area's icons — inline SVG on a 16-unit grid, the same recipe as
 * `careers/_components/icons.tsx`: they inherit `currentColor`, so an icon
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

export function BriefcaseIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <rect x="1.8" y="4.6" width="12.4" height="9" rx="1.4" {...STROKE} />
      <path d="M5.6 4.6V2.4h4.8v2.2M1.8 8.6h12.4" {...STROKE} />
    </Frame>
  );
}

/** Waiting on JoFit's review: an hourglass. */
export function HourglassIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <path d="M4 1.8h8M4 14.2h8M4.8 1.8c0 3 3.2 3.8 3.2 6.2S4.8 11.2 4.8 14.2M11.2 1.8c0 3-3.2 3.8-3.2 6.2s3.2 3.2 3.2 6.2" {...STROKE} />
    </Frame>
  );
}

/** A draft: a page with a pencil. */
export function DraftIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <path d="M9.6 1.8H3.4v12.4h9.2V8" {...STROKE} />
      <path d="m7.4 9.6.4-2.2 5-5 1.8 1.8-5 5-2.2.4Z" {...STROKE} />
    </Frame>
  );
}

/** Someone new: a person with a plus. */
export function PersonPlusIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <circle cx="6.4" cy="5.2" r="2.6" {...STROKE} />
      <path d="M1.6 14c.4-2.8 2.4-4.4 4.8-4.4s4.4 1.6 4.8 4.4M12.6 4.2v4M10.6 6.2h4" {...STROKE} />
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

export function SearchIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <circle cx="7" cy="7" r="4.8" {...STROKE} />
      <path d="m10.6 10.6 3.6 3.6" {...STROKE} />
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

export function LockIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <rect x="3" y="7" width="10" height="7" rx="1.4" {...STROKE} />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" {...STROKE} />
    </Frame>
  );
}

export function MailIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <rect x="1.6" y="3.2" width="12.8" height="9.6" rx="1.4" {...STROKE} />
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

export function ShieldIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <path d="M8 1.6 13.4 3.6V7.8c0 3.1-2.3 5.6-5.4 6.6-3.1-1-5.4-3.5-5.4-6.6V3.6L8 1.6Z" {...STROKE} />
      <path d="m5.6 8 1.7 1.6 3.1-3.2" {...STROKE} />
    </Frame>
  );
}

/** Something to read before going on: an exclamation in a ring. */
export function AlertIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <circle cx="8" cy="8" r="6.4" {...STROKE} />
      <path d="M8 4.6v4.2" {...STROKE} strokeWidth={1.6} />
      <circle cx="8" cy="11.2" r="0.6" fill="currentColor" />
    </Frame>
  );
}

export function CalendarIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <rect x="1.8" y="3" width="12.4" height="11.2" rx="1.6" {...STROKE} />
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

/** The back link's arrow: pointing to where the reader came from, in either direction. */
export function BackArrowIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0 rtl:-scale-x-100">
      <path d="M13 8H3M7 4 3 8l4 4" {...STROKE} strokeWidth={1.6} />
    </svg>
  );
}
