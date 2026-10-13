import type { ButtonVariant } from "@/components/ui/button";

/**
 * THE THREE KINDS OF ACCOUNT, EACH WITH ITS OWN COLOUR AND MARK.
 *
 * A customer, a coach and an employer each have their own sign-in door, and
 * the client asked that the three never be mistaken for one another. So each
 * kind owns one of the palette's three grounds — the brand green, the gold,
 * the deep green — and one glyph, and every place a door is offered (the
 * header menu, the sign-in screens, the "other doors" row) draws them from
 * here rather than deciding again.
 *
 * Shared by Server and Client Components: no hooks, no `"use client"`, only
 * classes and SVG.
 */
export type AccountKind = "customer" | "coach" | "employer";

export const ACCOUNT_KINDS: readonly AccountKind[] = ["customer", "coach", "employer"];

export interface AccountKindTone {
  /** The filled pill for this door. */
  readonly button: ButtonVariant;
  /** The round badge that carries the glyph. */
  readonly badge: string;
  /** A quiet chip: the kind's colour as a tint with its dark text. */
  readonly chip: string;
  /** A solid stripe or hairline in the kind's colour. */
  readonly stripe: string;
  /** The kind's colour as text (an eyebrow, an icon). */
  readonly text: string;
}

export const ACCOUNT_KIND_TONE: Record<AccountKind, AccountKindTone> = {
  customer: {
    button: "primary",
    badge: "bg-primary text-on-primary",
    chip: "bg-primary-10 text-primary-dark",
    stripe: "bg-primary",
    text: "text-primary-dark",
  },
  coach: {
    button: "gold",
    badge: "bg-accent text-deep",
    chip: "bg-accent-20 text-accent-strong",
    stripe: "bg-accent",
    text: "text-accent-strong",
  },
  employer: {
    button: "deep",
    badge: "bg-deep text-white",
    chip: "bg-deep/10 text-deep",
    stripe: "bg-deep",
    text: "text-deep",
  },
};

/** A person, a whistle, a briefcase. */
export function AccountKindIcon({ kind, size = 18 }: { kind: AccountKind; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (kind === "coach") {
    return (
      <svg {...common}>
        <circle cx="9" cy="14.5" r="5" />
        <path d="M13.2 11.5 20 8.5v3.2l-6.2 2.3" />
        <path d="M17 9.8v2.4" />
        <circle cx="9" cy="14.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (kind === "employer") {
    return (
      <svg {...common}>
        <rect x="3" y="7.5" width="18" height="12" rx="2.5" />
        <path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5" />
        <path d="M3 12.5h18" />
        <path d="M10.5 12v2h3v-2" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="8.5" r="3.8" />
      <path d="M4.5 20.5c.8-3.9 3.9-6 7.5-6s6.7 2.1 7.5 6" />
    </svg>
  );
}
