/*
 * The coach area's icons — inline SVG on a 16-unit grid, the same recipe as
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

/** A request waiting: a tray with something in it. */
export function InboxIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <path d="M1.8 9.2 3.6 2.8h8.8l1.8 6.4v4H1.8v-4Z" {...STROKE} />
      <path d="M1.8 9.2h3.6l.9 1.8h3.4l.9-1.8h3.6" {...STROKE} />
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

/** Delivered: a check in a ring. */
export function DoneIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <circle cx="8" cy="8" r="6.4" {...STROKE} />
      <path d="m5.2 8.2 2 1.9 3.6-3.9" {...STROKE} />
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

export function StarIcon({ size }: IconProps) {
  return (
    <Frame size={size}>
      <path d="m8 1.8 1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.6l-3.8 2 .7-4.3-3.1-3 4.3-.6L8 1.8Z" fill="currentColor" />
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
