import type { ReactNode } from "react";

/**
 * The portal's line icons — one stroke weight, drawn on a 16px grid, stroked
 * in `currentColor` so a caller sets the colour. They are the same drawings
 * the header's account menu uses, so a tab reads the same in both places.
 */
export type PortalIconName =
  | "overview"
  | "orders"
  | "sessions"
  | "courses"
  | "rentals"
  | "reviews"
  | "addresses"
  | "preferences"
  | "security"
  | "profile"
  | "jobs"
  | "applications"
  | "company";

function Svg({ size = 16, children }: { size?: number; children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      {children}
    </svg>
  );
}

export function PortalIcon({ name, size }: { name: PortalIconName; size?: number }) {
  switch (name) {
    case "overview":
      return (
        <Svg size={size}>
          <rect x="2" y="2" width="5" height="5" rx="1.2" />
          <rect x="9" y="2" width="5" height="5" rx="1.2" />
          <rect x="2" y="9" width="5" height="5" rx="1.2" />
          <rect x="9" y="9" width="5" height="5" rx="1.2" />
        </Svg>
      );
    case "orders":
      return (
        <Svg size={size}>
          <path d="M3 5h10l-.9 8.2a1 1 0 0 1-1 .8H4.9a1 1 0 0 1-1-.8L3 5Z" />
          <path d="M6 5V4a2 2 0 0 1 4 0v1" />
        </Svg>
      );
    case "sessions":
      return (
        <Svg size={size}>
          <rect x="2" y="3" width="12" height="11" rx="1.6" />
          <path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" />
        </Svg>
      );
    case "courses":
      return (
        <Svg size={size}>
          <path d="M1.5 6 8 3l6.5 3L8 9 1.5 6Z" />
          <path d="M4 7.3v3.4c1.2 1 2.5 1.5 4 1.5s2.8-.5 4-1.5V7.3" />
        </Svg>
      );
    case "rentals":
      return (
        <Svg size={size}>
          <path d="M2 8h12M4 5.5v5M12 5.5v5M1 7v2M15 7v2" />
        </Svg>
      );
    case "reviews":
      return (
        <Svg size={size}>
          <path d="m8 2 1.8 3.8 4.2.5-3.1 2.9.8 4.1L8 11.3l-3.7 2 .8-4.1L2 6.3l4.2-.5L8 2Z" />
        </Svg>
      );
    case "addresses":
      return (
        <Svg size={size}>
          <path d="M8 14.5s-4.5-4-4.5-7.5a4.5 4.5 0 0 1 9 0c0 3.5-4.5 7.5-4.5 7.5Z" />
          <circle cx="8" cy="7" r="1.6" />
        </Svg>
      );
    case "preferences":
      return (
        <Svg size={size}>
          <path d="M2 4.5h7M12 4.5h2M2 11.5h2M7 11.5h7" />
          <circle cx="10.5" cy="4.5" r="1.5" />
          <circle cx="5.5" cy="11.5" r="1.5" />
        </Svg>
      );
    case "security":
      return (
        <Svg size={size}>
          <rect x="3" y="7" width="10" height="7" rx="1.6" />
          <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
        </Svg>
      );
    case "profile":
      return (
        <Svg size={size}>
          <circle cx="8" cy="5.4" r="2.8" />
          <path d="M2.9 13.6a5.1 5.1 0 0 1 10.2 0" />
        </Svg>
      );
    case "jobs":
      return (
        <Svg size={size}>
          <rect x="2" y="5" width="12" height="9" rx="1.6" />
          <path d="M5.5 5V3.5h5V5M2 9h12" />
        </Svg>
      );
    case "applications":
      return (
        <Svg size={size}>
          <path d="M4 1.8h5.5L12.5 5v8.2a1 1 0 0 1-1 1h-7.5a1 1 0 0 1-1-1V2.8a1 1 0 0 1 1-1Z" />
          <path d="M9.5 1.8V5h3M5.5 8.5h5M5.5 11h3.5" />
        </Svg>
      );
    case "company":
      return (
        <Svg size={size}>
          <path d="M2.5 14V3h6v11M8.5 7h5v7M1.5 14h13" />
          <path d="M4.5 5.5h2M4.5 8h2M4.5 10.5h2M10.5 9.5h1M10.5 11.5h1" />
        </Svg>
      );
  }
}

/** The arrow leaves in the reading direction, so it mirrors in Arabic. */
export function SignOutIcon({ size = 16 }: { size?: number }) {
  return (
    <span className="inline-flex rtl:-scale-x-100">
      <Svg size={size}>
        <path d="M6.5 2.5h-3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h3" />
        <path d="M10 5l3 3-3 3M13 8H6" />
      </Svg>
    </span>
  );
}

/**
 * Which icon a tab gets when its frame does not name one. Every portal route
 * the site has is listed, so the customer, coach and employer rails all carry
 * icons without each frame repeating the table.
 */
const BY_HREF: Readonly<Record<string, PortalIconName>> = {
  "/account": "overview",
  "/account/orders": "orders",
  "/account/bookings": "sessions",
  "/account/enrolments": "courses",
  "/account/rentals": "rentals",
  "/account/reviews": "reviews",
  "/account/applications": "applications",
  "/account/addresses": "addresses",
  "/account/preferences": "preferences",
  "/account/settings": "security",
  "/coach": "overview",
  "/coach/sessions": "sessions",
  "/coach/courses": "courses",
  "/coach/reviews": "reviews",
  "/coach/profile": "profile",
  "/coach/settings": "security",
  "/employer": "overview",
  "/employer/jobs": "jobs",
  "/employer/applications": "applications",
  "/employer/profile": "company",
  "/employer/settings": "security",
};

export function iconForHref(href: string): PortalIconName | undefined {
  return BY_HREF[href];
}
