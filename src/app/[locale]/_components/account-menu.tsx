"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

import { buttonClasses } from "@/components/ui/button";

import { ACCOUNT_KIND_TONE, AccountKindIcon, type AccountKind } from "./account-kind";

import { signOutAction } from "../(site)/_components/portal/auth-actions";

/**
 * THE ACCOUNT MENU — what "Hi, Hussein" opens.
 *
 * Signed out, it offers the two ways in (sign in, create an account). Signed
 * in, it is the map of the person's own area: every account screen, the
 * account & security page, and signing out, which is a real form posting a
 * Server Action so it works before any JavaScript has loaded.
 *
 * Who is signed in is read from `jofit.account`, the READABLE display cookie
 * (a first name and a role — no credential), for the same reason as before:
 * the header is shared by pre-rendered pages and cannot read the session. The
 * server snapshot is "signed out", so the first paint matches the HTML. The
 * menu only changes what is offered; every screen it links to checks the real
 * httpOnly session on the server.
 *
 * All copy and every href arrive finished from the server.
 *
 */


export type AccountMenuIcon =
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
  | "company";

export interface AccountMenuLink {
  readonly href: string;
  readonly label: string;
  readonly icon: AccountMenuIcon;
}

export interface AccountMenuData {
  readonly locale: "en" | "ar";
  /** "Hi, {name}". */
  readonly greeting: string;
  readonly menuLabel: string;
  readonly signIn: { readonly href: string; readonly label: string };
  readonly signUp: { readonly href: string; readonly label: string };
  /** The signed-out menu: one sign-in door per kind of account. */
  readonly signInOptions: readonly { readonly kind: AccountKind; readonly href: string; readonly label: string }[];
  /** One line under the two buttons when signed out. */
  readonly signedOutText: string;
  readonly roleLabel: { readonly customer: string; readonly coach: string; readonly employer: string };
  readonly customer: readonly AccountMenuLink[];
  readonly coach: readonly AccountMenuLink[];
  /** A gym, club or sports company on the careers board. */
  readonly employer: readonly AccountMenuLink[];
  readonly signOutLabel: string;
}

const DISPLAY_COOKIE = "jofit.account";

interface Display {
  readonly name: string;
  readonly nameAr?: string;
  readonly role: "customer" | "coach" | "employer";
}

function readDisplay(): string {
  const match = document.cookie.split("; ").find((part) => part.startsWith(`${DISPLAY_COOKIE}=`));
  return match ? match.slice(DISPLAY_COOKIE.length + 1) : "";
}

function parse(raw: string): Display | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(decodeURIComponent(raw)) as Display;
    return typeof value.name === "string" && (value.role === "customer" || value.role === "coach" || value.role === "employer")
      ? value
      : null;
  } catch {
    return null;
  }
}

/* Cookies have no change event; signing in or out is a navigation, which
   re-renders this anyway. */
const subscribe = () => () => {};
const signedOut = () => "";

function useDisplay(locale: "en" | "ar") {
  const display = parse(useSyncExternalStore(subscribe, readDisplay, signedOut));
  const name = display ? (locale === "ar" && display.nameAr ? display.nameAr : display.name) : undefined;
  return { display, name };
}

/** The rows: the same list in the popover and in the phone menu. */
function MenuBody({
  data,
  display,
  name,
  onNavigate,
  dense,
}: {
  data: AccountMenuData;
  display: Display | null;
  name?: string;
  onNavigate: () => void;
  /** The phone sheet: no header block, tighter rows. */
  dense?: boolean;
}) {
  const pathname = usePathname();

  if (!display) {
    return (
      <div className={dense ? "flex flex-wrap gap-3" : "p-5"}>
        {dense ? null : (
          <p className="mb-4 text-[13.5px] leading-relaxed text-body">{data.signedOutText}</p>
        )}
        <ul className={dense ? "flex w-full flex-col gap-2" : "mb-4 flex flex-col gap-2"}>
          {/* One door per kind of account, each in its own colour with its own
              mark, so the three are never mistaken for one another. */}
          {data.signInOptions.map((option) => (
            <li key={option.href}>
              <Link
                href={option.href}
                onClick={onNavigate}
                className={buttonClasses({
                  variant: ACCOUNT_KIND_TONE[option.kind].button,
                  size: "sm",
                  className: "w-full justify-start gap-2.5 ps-2",
                })}
              >
                <span className="grid size-6 place-items-center rounded-full bg-white/20">
                  <AccountKindIcon kind={option.kind} size={14} />
                </span>
                {option.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2.5">
          <Link
            href={data.signUp.href}
            onClick={onNavigate}
            className={buttonClasses({ variant: "outline", size: "sm" })}
          >
            {data.signUp.label}
          </Link>
        </div>
      </div>
    );
  }

  const links = data[display.role];

  return (
    <>
      {dense ? null : (
        <div className="border-b border-line bg-canvas px-5 py-4">
          <p className="text-[12px] font-semibold text-primary">
            {data.roleLabel[display.role]}
          </p>
          <p className="mt-1 font-heading text-[16px] font-semibold text-ink" dir="auto">
            {name ? data.greeting.replace("{name}", name) : null}
          </p>
        </div>
      )}
      <ul className={dense ? "grid gap-0.5 sm:grid-cols-2" : "p-2"}>
        {links.map((link) => {
          /* A link is "here" on its own page and, for all but the overview, on
             the pages under it (an order under Orders). */
          const here =
            pathname === link.href ||
            (!/\/(account|coach|employer)$/.test(link.href) && pathname.startsWith(`${link.href}/`));
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={onNavigate}
                aria-current={here ? "page" : undefined}
                className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] transition-colors hover:bg-primary-05 hover:text-primary-dark ${
                  here
                    ? "bg-primary-05 font-semibold text-primary-dark before:absolute before:inset-y-2 before:start-0 before:w-[3px] before:rounded-full before:bg-primary"
                    : "font-medium text-title"
                }`}
              >
                <span className={here ? "text-primary" : "text-body/60"}>
                  <MenuIcon name={link.icon} />
                </span>
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <form
        action={signOutAction}
        className={dense ? "mt-2 border-t border-line pt-2" : "border-t border-line p-2"}
      >
        <input type="hidden" name="locale" value={data.locale} />
        <button
          type="submit"
          className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-start text-[14px] font-semibold text-danger transition-colors hover:bg-danger-05"
        >
          <SignOutIcon />
          {data.signOutLabel}
        </button>
      </form>
    </>
  );
}

/** The header's account control: a button that opens the menu under it. */
export function AccountMenu({
  data,
  icon,
  className,
}: {
  data: AccountMenuData;
  icon?: ReactNode;
  className?: string;
}) {
  const { display, name } = useDisplay(data.locale);
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const root = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  /* A navigation closes it; so do an outside click and Escape, as every menu
     on the site does. The route is compared, not subscribed to, so this stays
     a plain render rather than an effect that sets state. */
  const [openedOn, setOpenedOn] = useState(pathname);
  if (open && openedOn !== pathname) {
    setOpen(false);
    setOpenedOn(pathname);
  }

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        root.current?.querySelector("button")?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="true"
        onClick={() => {
          setOpenedOn(pathname);
          setOpen((value) => !value);
        }}
        className={`cursor-pointer ${className ?? ""}`}
      >
        {icon}
        <span dir="auto">{display && name ? data.greeting.replace("{name}", name) : data.signIn.label}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          aria-hidden="true"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>

      <nav
        id={panelId}
        aria-label={data.menuLabel}
        hidden={!open}
        className="absolute end-0 top-full z-50 mt-3 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-line bg-surface text-start text-[14px] leading-normal text-body shadow-lift"
      >
        <MenuBody data={data} display={display} name={name} onNavigate={() => setOpen(false)} />
      </nav>
    </div>
  );
}

/** The same menu, laid out inline in the phone menu's sheet. */
export function AccountMenuList({ data, onNavigate }: { data: AccountMenuData; onNavigate: () => void }) {
  const { display, name } = useDisplay(data.locale);
  return (
    <nav aria-label={data.menuLabel} className="w-full">
      {display && name ? (
        <p className="mb-2 font-heading text-[15px] font-semibold text-ink" dir="auto">
          {data.greeting.replace("{name}", name)}
        </p>
      ) : null}
      <MenuBody data={data} display={display} name={name} onNavigate={onNavigate} dense />
    </nav>
  );
}

/* ------------------------------------------------------------------- icons */

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function MenuIcon({ name }: { name: AccountMenuIcon }) {
  switch (name) {
    case "overview":
      return (
        <Svg>
          <rect x="2" y="2" width="5" height="5" />
          <rect x="9" y="2" width="5" height="5" />
          <rect x="2" y="9" width="5" height="5" />
          <rect x="9" y="9" width="5" height="5" />
        </Svg>
      );
    case "orders":
      return (
        <Svg>
          <path d="M3 5h10l-1 9H4L3 5Z" />
          <path d="M6 5V4a2 2 0 0 1 4 0v1" />
        </Svg>
      );
    case "sessions":
      return (
        <Svg>
          <rect x="2" y="3" width="12" height="11" />
          <path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" />
        </Svg>
      );
    case "courses":
      return (
        <Svg>
          <path d="M1.5 6 8 3l6.5 3L8 9 1.5 6Z" />
          <path d="M4 7.3v3.4c1.2 1 2.5 1.5 4 1.5s2.8-.5 4-1.5V7.3" />
        </Svg>
      );
    case "rentals":
      return (
        <Svg>
          <path d="M2 8h12M4 5.5v5M12 5.5v5M1 7v2M15 7v2" />
        </Svg>
      );
    case "reviews":
      return (
        <Svg>
          <path d="m8 2 1.8 3.8 4.2.5-3.1 2.9.8 4.1L8 11.3l-3.7 2 .8-4.1L2 6.3l4.2-.5L8 2Z" />
        </Svg>
      );
    case "addresses":
      return (
        <Svg>
          <path d="M8 14.5s-4.5-4-4.5-7.5a4.5 4.5 0 0 1 9 0c0 3.5-4.5 7.5-4.5 7.5Z" />
          <circle cx="8" cy="7" r="1.6" />
        </Svg>
      );
    case "preferences":
      return (
        <Svg>
          <path d="M2 4.5h7M12 4.5h2M2 11.5h2M7 11.5h7" />
          <circle cx="10.5" cy="4.5" r="1.5" />
          <circle cx="5.5" cy="11.5" r="1.5" />
        </Svg>
      );
    case "security":
      return (
        <Svg>
          <rect x="3" y="7" width="10" height="7" />
          <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
        </Svg>
      );
    case "jobs":
      return (
        <Svg>
          <rect x="2" y="5" width="12" height="9" />
          <path d="M5.5 5V3.5h5V5M2 9h12" />
        </Svg>
      );
    case "company":
      return (
        <Svg>
          <path d="M2.5 14V3h6v11M8.5 7h5v7M1.5 14h13" />
          <path d="M4.5 5.5h2M4.5 8h2M4.5 10.5h2M10.5 9.5h1M10.5 11.5h1" />
        </Svg>
      );
    case "profile":
      return (
        <Svg>
          <circle cx="8" cy="5.4" r="2.8" />
          <path d="M2.9 13.6a5.1 5.1 0 0 1 10.2 0" />
        </Svg>
      );
  }
}

/* The arrow points out of the reading direction, so it mirrors in Arabic. */
function SignOutIcon() {
  return (
    <span className="inline-flex rtl:-scale-x-100">
      <Svg>
        <path d="M6.5 2.5h-4v11h4" />
        <path d="M10 5l3 3-3 3M13 8H6" />
      </Svg>
    </span>
  );
}
