import type { ComponentProps, ReactNode } from "react";

/**
 * THE BUTTON — a pill.
 *
 * The old template's button was a sheared parallelogram trailing an offcut.
 * The client rejected it with the rest of the gym look; a certification body's
 * controls are calm and familiar, so this is a rounded pill in the brand green,
 * with no capitals and no tracking (Arabic has neither).
 *
 * Exported as classes as well as a component, because most actions here are
 * links, and a link that looks like a button should not have to become one.
 *
 * Variants, and where each belongs:
 *   primary   the one action on a light surface
 *   outline   the second action beside it
 *   soft      a quiet action inside a card or a filter row
 *   gold      the one action on a deep-green band
 *   deep      the deep green as a filled pill on a light surface (the employer door)
 *   onDark    white, on a deep band, when gold is already in use
 *   ghostDark the second action on a deep band
 */
const VARIANTS = {
  primary:
    "bg-primary text-on-primary shadow-[0_10px_24px_-12px_var(--color-primary)] hover:bg-primary-hover hover:shadow-[0_14px_28px_-12px_var(--color-primary)]",
  outline: "border border-primary/35 text-primary-dark hover:border-primary hover:bg-primary-05",
  soft: "bg-primary-05 text-primary-dark hover:bg-primary-10",
  gold: "bg-accent text-deep shadow-[0_10px_24px_-12px_var(--color-accent)] hover:brightness-105",
  deep: "bg-deep text-white shadow-[0_10px_24px_-12px_var(--color-deep)] hover:bg-deep-2",
  onDark: "bg-white text-deep hover:bg-white/90",
  ghostDark: "border border-white/30 text-white hover:border-white/60 hover:bg-white/10",
} as const;

const SIZES = {
  /* 44px minimum at `md`, so the target is thumb-sized on a phone. */
  sm: "h-9 px-4 text-[13px]",
  md: "h-11 px-6 text-[15px]",
  lg: "h-13 px-8 text-base",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;
export type ButtonSize = keyof typeof SIZES;

export function buttonClasses({
  variant = "primary",
  size = "md",
  className = "",
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return [
    "relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap",
    "transition-[background-color,border-color,box-shadow,color,filter] duration-200",
    "disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    className,
  ].join(" ");
}

export function Button({
  variant,
  size,
  className,
  children,
  ...props
}: ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}) {
  return (
    <button {...props} className={buttonClasses({ variant, size, className })}>
      {children}
    </button>
  );
}

/** The arrow that trails a "learn more" — mirrored in Arabic. */
export function ArrowIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="shrink-0 rtl:-scale-x-100"
    >
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
