import Link from "next/link";
import type { ReactNode } from "react";

import { buttonClasses, Container, PageHero, type Crumb } from "@/components/ui";
import { getTranslator, localePath, type Locale } from "@/i18n";

import { signOutAction } from "./auth-actions";
import { iconForHref, PortalIcon, SignOutIcon, type PortalIconName } from "./portal-icons";
import { TabRail } from "./tab-rail";

/**
 * THE FRAME EVERY SIGNED-IN SCREEN SITS IN — the customer's account, the coach
 * area and the employer area alike.
 *
 * Two bands, in the formal site's order:
 *
 *   hero     the inner-page `PageHero`, compact: breadcrumbs (Home → the area →
 *            the tab), the area as the eyebrow, the page's one `<h1>`, a lead,
 *            and the page's own action. `hero` sits under it — a row of
 *            `HeroFacts`, for a page that has figures worth stating first.
 *   canvas   the faint band, holding two columns from `xl`: the area's tabs as
 *            a card of pills (current = primary) with the sign-out at its foot,
 *            and the page's content cards. Below `xl` the tabs become a strip
 *            above the content — scrolling sideways on a phone, wrapping on a
 *            tablet — so the content keeps the full measure where it is
 *            narrow.
 *
 * The rail is what makes every screen of an area read as one place. Each PAGE
 * renders the shell (not the layout) because only the page knows which tab it
 * is — a server layout is not told the current path.
 */
export interface PortalTab {
  readonly href: string;
  readonly label: string;
  /** A small count beside the label — something waiting. */
  readonly badge?: number;
  /** The tab's icon. Optional: the shell knows one for every portal route. */
  readonly icon?: PortalIconName;
}

export function PortalShell({
  locale,
  eyebrow,
  title,
  lead,
  tabs,
  active,
  signOutLabel,
  navLabel,
  actions,
  hero,
  subpage,
  breadcrumbs,
  children,
}: {
  locale: Locale;
  eyebrow: string;
  title: string;
  lead?: string;
  tabs: readonly PortalTab[];
  /** The tab href this page belongs to. */
  active: string;
  signOutLabel: string;
  /** The area's name: the rail's accessible name and the breadcrumb for the area. */
  navLabel: string;
  /** Page-level actions under the lead, on the deep band — `buttonClasses({ variant: "gold" | "onDark" | "ghostDark" })`. */
  actions?: ReactNode;
  /** Under the hero's text, e.g. `<HeroFacts items={…} />`. Figures counted from data only. */
  hero?: ReactNode;
  /**
   * The last breadcrumb, for a page BELOW a tab (an order under Orders, an
   * application under Applications). The tab's crumb then becomes a link.
   */
  subpage?: string;
  /** Replaces the derived breadcrumb trail entirely. */
  breadcrumbs?: readonly Crumb[];
  children: ReactNode;
}) {
  const t = getTranslator(locale);
  const trail = breadcrumbs ?? deriveCrumbs({ locale, home: t("nav.home"), tabs, active, navLabel, subpage });

  return (
    <>
      <PageHero
        compact
        breadcrumbLabel={t("site.breadcrumb")}
        breadcrumbs={trail}
        eyebrow={eyebrow}
        title={<span dir="auto">{title}</span>}
        lead={lead}
        actions={actions}
      >
        {hero}
      </PageHero>

      <section data-band aria-label={title} className="bg-canvas">
        <Container className="py-8 sm:py-10 xl:py-14">
          <div className="xl:grid xl:grid-cols-[15.5rem_minmax(0,1fr)] xl:items-start xl:gap-10">
            <div className="flex items-start gap-3 xl:sticky xl:top-28 xl:block xl:rounded-3xl xl:border xl:border-line xl:bg-surface xl:p-3 xl:shadow-soft">
              <p aria-hidden="true" className="eyebrow px-3 pt-2 pb-3 text-[13px] max-xl:hidden">
                {navLabel}
              </p>
              <TabRail label={navLabel}>
                {tabs.map((tab) => (
                  <RailLink key={tab.href} locale={locale} tab={tab} current={tab.href === active} />
                ))}
              </TabRail>
              <form action={signOutAction} className="shrink-0 py-1 xl:mt-3 xl:border-t xl:border-line xl:pt-3 xl:pb-0">
                <input type="hidden" name="locale" value={locale} />
                <button
                  type="submit"
                  title={signOutLabel}
                  className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full border border-line bg-surface px-3 text-[14px] font-medium text-body transition-colors hover:border-danger/40 hover:text-danger sm:px-4 xl:h-11 xl:w-full xl:justify-start xl:border-transparent xl:bg-transparent xl:hover:bg-danger-05"
                >
                  <SignOutIcon />
                  <span className="max-sm:sr-only">{signOutLabel}</span>
                </button>
              </form>
            </div>

            <div className="mt-8 min-w-0 xl:mt-0">{children}</div>
          </div>
        </Container>
      </section>
    </>
  );
}

function deriveCrumbs({
  locale,
  home,
  tabs,
  active,
  navLabel,
  subpage,
}: {
  locale: Locale;
  home: string;
  tabs: readonly PortalTab[];
  active: string;
  navLabel: string;
  subpage?: string;
}): Crumb[] {
  const crumbs: Crumb[] = [{ label: home, href: localePath(locale, "/") }];
  const root = tabs[0];
  const current = tabs.find((tab) => tab.href === active);
  const onRoot = !current || current.href === root?.href;

  if (root) {
    crumbs.push({ label: navLabel, href: onRoot && !subpage ? undefined : localePath(locale, root.href) });
  }
  if (current && !onRoot) {
    crumbs.push({ label: current.label, href: subpage ? localePath(locale, current.href) : undefined });
  }
  if (subpage) crumbs.push({ label: subpage });
  return crumbs;
}

/**
 * One tab. A bordered pill in the strip; a full-width row in the `xl` rail,
 * with its icon and any count at the far end. The current tab is filled.
 */
function RailLink({ locale, tab, current }: { locale: Locale; tab: PortalTab; current: boolean }) {
  const icon = tab.icon ?? iconForHref(tab.href);
  return (
    <Link
      href={localePath(locale, tab.href)}
      aria-current={current ? "page" : undefined}
      className={`inline-flex shrink-0 items-center gap-2.5 rounded-full border px-4 py-2 text-[14px] whitespace-nowrap transition-colors xl:w-full xl:py-2.5 ${
        current
          ? "border-primary bg-primary font-semibold text-on-primary shadow-[0_10px_22px_-14px_var(--color-primary)]"
          : "border-line bg-surface font-medium text-ink hover:bg-primary-05 hover:text-primary-dark xl:border-transparent xl:bg-transparent"
      }`}
    >
      {icon ? (
        <span className={`max-xl:hidden ${current ? "text-on-primary" : "text-primary"}`}>
          <PortalIcon name={icon} />
        </span>
      ) : null}
      <span className="min-w-0 xl:flex-1 xl:truncate">{tab.label}</span>
      {tab.badge ? (
        <span
          dir="ltr"
          className={`min-w-5 rounded-full px-1.5 text-center text-[11px] leading-5 font-bold ${
            current ? "bg-white text-primary-dark" : "bg-accent text-deep"
          }`}
        >
          {tab.badge}
        </span>
      ) : null}
    </Link>
  );
}

/** A titled card within a portal page. `lead` is one line under the title. */
export function Panel({
  id,
  title,
  lead,
  action,
  children,
  className = "",
}: {
  id: string;
  title: string;
  lead?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section aria-labelledby={id} className={`rounded-3xl border border-line bg-surface p-6 shadow-soft sm:p-7 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <h2 id={id} className="text-[1.2rem] leading-snug sm:text-[1.3rem]">
          {title}
        </h2>
        {action}
      </div>
      {lead ? <p className="mt-2 max-w-[62ch] text-[14px] leading-relaxed text-body">{lead}</p> : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}

/**
 * A heading inside a portal page, between groups of cards ("Upcoming",
 * "Past"): the gold-dash eyebrow's device at the heading size, with an
 * optional count or action at the far end.
 */
export function PortalSubhead({
  id,
  title,
  aside,
  className = "",
}: {
  id: string;
  title: string;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 ${className}`}>
      <h2 id={id} className="flex items-center gap-3 text-[1.3rem] leading-snug sm:text-[1.45rem]">
        <span aria-hidden="true" className="h-0.5 w-6 shrink-0 rounded-full bg-accent" />
        {title}
      </h2>
      {aside}
    </div>
  );
}

/**
 * A lifecycle status as a word, in the reader's language, with colour as the
 * second channel. Customer-facing, so — unlike the admin — it IS translated.
 */
export type StatusTone = "waiting" | "moving" | "done" | "stopped";

const TONES: Readonly<Record<StatusTone, string>> = {
  waiting: "bg-accent-20 text-accent-strong",
  moving: "bg-primary-10 text-primary-dark",
  done: "bg-primary text-on-primary",
  stopped: "bg-danger-05 text-danger",
};

/* The same four on a deep band, where the light tints would vanish. */
const DARK_TONES: Readonly<Record<StatusTone, string>> = {
  waiting: "bg-accent/20 text-accent",
  moving: "bg-white/12 text-white",
  done: "bg-accent text-deep",
  stopped: "bg-white/12 text-white",
};

export function toneOf(status: string): StatusTone {
  switch (status) {
    case "pending":
      return "waiting";
    case "confirmed":
    case "processing":
    case "shipped":
    case "collected":
    case "active":
      return "moving";
    case "completed":
    case "returned":
    case "approved":
      return "done";
    default:
      return "stopped";
  }
}

export function StatusChip({
  label,
  status,
  onDark = false,
  className = "",
}: {
  label: string;
  status: string;
  /** On a deep-green surface. */
  onDark?: boolean;
  className?: string;
}) {
  const tone = toneOf(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] leading-none font-semibold whitespace-nowrap ${
        (onDark ? DARK_TONES : TONES)[tone]
      } ${className}`}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  );
}

/**
 * A one-off confirmation at the top of a page — "your account is ready",
 * "your seat is reserved" — after an action that redirected here. It is a
 * live status, so it is read out on arrival.
 */
export function PortalNotice({
  title,
  body,
  className = "",
}: {
  title: string;
  body?: ReactNode;
  className?: string;
}) {
  return (
    <div role="status" className={`mb-6 flex gap-4 rounded-3xl border border-primary/25 bg-surface p-5 shadow-soft sm:p-6 ${className}`}>
      <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-on-primary">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="m4.5 9.4 3 3 6-6.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <div className="min-w-0 pt-0.5">
        <p className="font-heading text-[1.05rem] leading-snug font-semibold text-ink">{title}</p>
        {body ? <p className="mt-1 text-[14px] leading-relaxed text-body">{body}</p> : null}
      </div>
    </div>
  );
}

/** An empty panel is an invitation, not a shrug: a sentence and somewhere to go. */
export function EmptyNote({
  text,
  href,
  action,
  icon,
}: {
  text: string;
  href?: string;
  action?: string;
  icon?: PortalIconName;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-line bg-surface px-6 py-12 text-center">
      <span
        aria-hidden="true"
        className="mx-auto grid size-12 place-items-center rounded-full bg-primary-05 text-primary ring-1 ring-primary/15"
      >
        {icon ? <PortalIcon name={icon} size={20} /> : <EmptyIcon />}
      </span>
      <p className="mx-auto mt-4 max-w-[46ch] text-[15px] leading-relaxed text-body">{text}</p>
      {href && action ? (
        <Link href={href} className={buttonClasses({ variant: "outline", size: "sm", className: "mt-6" })}>
          {action}
        </Link>
      ) : null}
    </div>
  );
}

function EmptyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M3 11.5 5.2 4.6a1.5 1.5 0 0 1 1.4-1.1h6.8a1.5 1.5 0 0 1 1.4 1.1L17 11.5" strokeLinejoin="round" />
      <path
        d="M3 11.5h4l1 2h4l1-2h4v3.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 15v-3.5Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}
