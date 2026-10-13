/*
 * One glyph per quotation subject, plus the two contact channels.
 *
 * 24-unit grid for the subject marks because they are drawn at 28px on a tile,
 * 16-unit for the two that sit inline beside a label. `currentColor` and
 * `aria-hidden` throughout — each one has a name next to it.
 */
const S = {
  stroke: "currentColor",
  strokeWidth: 1.2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function Big({ children, size = 28 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {children}
    </svg>
  );
}

function Small({ children, size = 16 }: { children: React.ReactNode; size?: number }) {
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

/** Gym equipment — a rack with loaded plates. */
export function StackIcon({ size }: { size?: number }) {
  return (
    <Big size={size}>
      <path d="M4.4 4.6v14.8M19.6 4.6v14.8" {...S} />
      <path d="M4.4 9.2h15.2M4.4 14.2h15.2" {...S} />
      <path d="M8.4 7.2v4M15.6 12.2v4" {...S} />
    </Big>
  );
}

/** A facility — a building with a pitch line through it. */
export function BuildingIcon({ size }: { size?: number }) {
  return (
    <Big size={size}>
      <path d="M3.2 20.4V7.6L12 3.4l8.8 4.2v12.8H3.2Z" {...S} />
      <path d="M12 7.8v12.6M7.6 12.4h8.8" {...S} />
      <circle cx="12" cy="14" r="2" {...S} />
    </Big>
  );
}

/** A large order — a stack of boxes. */
export function BoxIcon({ size }: { size?: number }) {
  return (
    <Big size={size}>
      <path d="M3.4 8.2 12 4.4l8.6 3.8v7.6L12 19.6l-8.6-3.8V8.2Z" {...S} />
      <path d="m3.4 8.2 8.6 3.8 8.6-3.8M12 12v7.6" {...S} />
    </Big>
  );
}

/** Custom equipment — layers being specified. */
export function LayersIcon({ size }: { size?: number }) {
  return (
    <Big size={size}>
      <path d="M12 3.6 3.6 7.8 12 12l8.4-4.2L12 3.6Z" {...S} />
      <path d="m3.6 12.2 8.4 4.2 8.4-4.2M3.6 16.4l8.4 4.2 8.4-4.2" {...S} />
    </Big>
  );
}

/** A corporate programme — a group. */
export function UsersIcon({ size }: { size?: number }) {
  return (
    <Big size={size}>
      <circle cx="9" cy="8.2" r="3.2" {...S} />
      <path d="M3.4 19.4c0-3.1 2.5-5.4 5.6-5.4s5.6 2.3 5.6 5.4" {...S} />
      <path d="M16.2 5.6a3 3 0 0 1 0 5.6M17 14.4c2.1.6 3.6 2.5 3.6 5" {...S} />
    </Big>
  );
}

export function MailIcon({ size }: { size?: number }) {
  return (
    <Small size={size}>
      <rect x="1.8" y="3.4" width="12.4" height="9.2" {...S} />
      <path d="m1.8 4.6 6.2 4.2 6.2-4.2" {...S} />
    </Small>
  );
}

export function WhatsappIcon({ size }: { size?: number }) {
  return (
    <Small size={size}>
      <path d="M2.2 13.8 3.1 11a5.9 5.9 0 1 1 2.3 2.2l-3.2.6Z" {...S} />
      <path d="M5.8 6.2c0 2.4 2 4.3 4.3 4.3.5 0 .8-.4.8-.8l-.1-.7-1.3-.4-.6.7a4 4 0 0 1-1.7-1.7l.7-.6-.4-1.3-.7-.1c-.5 0-1 .3-1 .8Z" {...S} />
    </Small>
  );
}
