import Link from "next/link";
import { Suspense } from "react";

import { JofitLogo } from "@/components/brand/jofit-logo";
import { buttonClasses } from "@/components/ui";
import { CartIndicator } from "@/features/cart";
import { getTranslator, localePath, type Locale } from "@/i18n";

import { AccountMenu, type AccountMenuData } from "./account-menu";
import { LanguageSwitch } from "./language-switch";
import { NotificationBell } from "./notification-bell";
import { RouteProgress } from "./route-progress";
import { SiteHeaderMenu } from "./site-header-menu";
import { SiteNav } from "./site-nav";
import { resolveSiteNav } from "./site-nav-data";

/**
 * THE SITE HEADER — the formal redesign of 2026-09-29.
 *
 * It used to float over a gym photograph as a frosted, sheared glass plate,
 * and to render on two stylesheets at once (the site's and the BodyShape
 * template's). Both are gone. It is now two ordinary rows in the page flow:
 *
 *   THE STATEMENT STRIP (40px, deep green, from `lg`): what JoFit is, in one
 *   line — the exclusive and official NCSF agent in Jordan. That is the fact a
 *   visitor to a certification body needs before any menu. Contact, the
 *   language switch and the account sit at its end.
 *
 *   THE BAR (80px, white): the lockup, the navigation, and the tools — search,
 *   notifications, cart, and the one action.
 *
 * STICKY, BUT ONLY THE BAR. The whole header is `sticky` with a NEGATIVE top
 * equal to the strip's height, so on scroll the strip slides away and the bar
 * pins to the top of the window. Sticking the bar alone would not work: a
 * sticky element is held inside its parent, and the parent is this header.
 *
 * Email, phone and opening hours are not in the header, at the owner's request
 * (2026-09-28); they are on the contact page and in the footer.
 *
 * IT STAYS A SERVER COMPONENT. The client leaves — cart count, language link,
 * account, bell, nav panels, phone sheet — are handed finished strings.
 */
export async function SiteHeader({ locale }: { locale: Locale }) {
  const t = getTranslator(locale);

  /*
   * The REAL site navigation, not the template's demo menu — resolved here, in
   * the Server Component, so what crosses into the client `SiteNav` is the
   * finished list (hrefs already carrying the locale, labels already
   * translated) rather than the navigation tree plus the dictionary. The
   * Courses entry is staff-managed; see `site-nav-data.ts`.
   */
  const items = await resolveSiteNav(locale);
  const bellLabels = {
    title: t("notifications.title"),
    open: t("notifications.open", { count: "{count}" }),
    empty: t("notifications.empty"),
    markAll: t("notifications.markAll"),
  };

  const searchHref = localePath(locale, "/search");
  const signInHref = localePath(locale, "/sign-in");
  const accountHref = localePath(locale, "/account");
  const coachHref = localePath(locale, "/coach");
  const cartHref = localePath(locale, "/cart");
  const ctaHref = localePath(locale, "/quotations");
  const at = (path: string) => localePath(locale, path);

  /*
   * What "Hi, {name}" opens — built once here, in the Server Component, and
   * handed to both the desktop menu and the phone sheet as finished strings.
   * Two lists because a customer and a coach have different areas; the
   * browser picks one from the display cookie's role.
   */
  const accountMenu: AccountMenuData = {
    locale,
    greeting: t("account.headerGreeting", { name: "{name}" }),
    menuLabel: t("account.menu"),
    signIn: { href: signInHref, label: t("signIn.title") },
    signUp: { href: at("/sign-up"), label: t("signIn.createAccount") },
    signInOptions: [
      { kind: "customer", href: signInHref, label: t("signIn.kind.customer") },
      { kind: "coach", href: at("/sign-in/coach"), label: t("signIn.kind.coach") },
      { kind: "employer", href: at("/sign-in/employer"), label: t("signIn.kind.employer") },
    ],
    signedOutText: t("account.menuSignedOut"),
    roleLabel: { customer: t("account.menuCustomer"), coach: t("account.menuCoach"), employer: t("account.menuEmployer") },
    customer: [
      { href: accountHref, label: t("account.overview"), icon: "overview" },
      { href: at("/account/orders"), label: t("account.orders"), icon: "orders" },
      { href: at("/account/bookings"), label: t("account.bookings"), icon: "sessions" },
      { href: at("/account/enrolments"), label: t("account.enrolments"), icon: "courses" },
      { href: at("/account/rentals"), label: t("account.rentals"), icon: "rentals" },
      { href: at("/account/reviews"), label: t("account.reviews"), icon: "reviews" },
      { href: at("/account/addresses"), label: t("account.addresses"), icon: "addresses" },
      { href: at("/account/applications"), label: t("account.applications"), icon: "jobs" },
      { href: at("/account/preferences"), label: t("account.preferences"), icon: "preferences" },
      { href: at("/account/settings"), label: t("account.settings"), icon: "security" },
    ],
    coach: [
      { href: coachHref, label: t("coach.tabToday"), icon: "overview" },
      { href: at("/coach/sessions"), label: t("coach.tabSessions"), icon: "sessions" },
      { href: at("/coach/courses"), label: t("coach.tabCourses"), icon: "courses" },
      { href: at("/coach/reviews"), label: t("coach.tabReviews"), icon: "reviews" },
      { href: at("/coach/profile"), label: t("coach.tabProfile"), icon: "profile" },
      { href: at("/coach/settings"), label: t("coach.tabSettings"), icon: "security" },
    ],
    employer: [
      { href: at("/employer"), label: t("employer.tabDashboard"), icon: "overview" },
      { href: at("/employer/jobs"), label: t("employer.tabJobs"), icon: "jobs" },
      { href: at("/employer/applications"), label: t("employer.tabApplications"), icon: "sessions" },
      { href: at("/employer/profile"), label: t("employer.tabProfile"), icon: "company" },
      { href: at("/employer/settings"), label: t("employer.tabSettings"), icon: "security" },
    ],
    signOutLabel: t("account.signOut"),
  };

  return (
    <header className="sticky top-0 z-50 lg:-top-10">
      {/* `Suspense` because `RouteProgress` reads `useSearchParams()`. */}
      <Suspense fallback={null}>
        <RouteProgress label={t("state.loading")} />
      </Suspense>

      <div className="hidden h-10 bg-deep text-[13px] text-white/70 lg:block">
        <div className="mx-auto flex h-full max-w-page items-center justify-between gap-6 px-8">
          <p className="inline-flex min-w-0 items-center gap-2.5">
            <SealIcon />
            <span className="truncate">{t("site.agencyStrip")}</span>
          </p>
          <div className="flex shrink-0 items-center gap-6">
            <Link href={at("/contact")} className="transition-colors hover:text-white">
              {t("nav.contact")}
            </Link>
            <span aria-hidden="true" className="h-3.5 w-px bg-white/20" />
            <LanguageSwitch
              current={locale}
              icon={<GlobeIcon />}
              className="inline-flex items-center gap-2 transition-colors hover:text-white"
            />
            <AccountMenu
              data={accountMenu}
              icon={<UserIcon />}
              className="inline-flex items-center gap-2 transition-colors hover:text-white"
            />
          </div>
        </div>
      </div>

      <div className="border-b border-line bg-surface/95 shadow-[0_10px_30px_-24px_rgb(9_30_21/0.35)] backdrop-blur-xl">
        {/* `data-hdr-measure` marks the box a dropdown panel may not escape. */}
        <div
          data-hdr-measure
          className="relative mx-auto flex h-18 max-w-page items-center gap-3 px-4 sm:px-6 lg:h-20 lg:gap-7 lg:px-8"
        >
          <Link href={localePath(locale, "/")} aria-label={t("site.name")} className="group flex shrink-0 items-center">
            <JofitLogo
              variant="full"
              animate
              className="h-10 w-auto transition-transform duration-300 group-hover:scale-[1.03] lg:h-12"
            />
          </Link>

          <span aria-hidden="true" className="hidden h-8 w-px bg-line lg:block" />

          <SiteNav items={items} ariaLabel={t("site.name")} expandLabel={t("nav.expand")} />

          <div className="ms-auto flex items-center gap-1 sm:gap-1.5">
            <Link
              href={searchHref}
              aria-label={t("site.search")}
              title={t("site.search")}
              className="hidden size-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-primary-05 hover:text-primary lg:inline-flex"
            >
              <SearchIcon />
            </Link>

            <NotificationBell
              locale={locale}
              labels={bellLabels}
              className="size-10 justify-center rounded-full text-ink transition-colors hover:bg-primary-05 hover:text-primary"
            />

            <CartIndicator
              href={cartHref}
              label={t("site.cart")}
              itemsLabelTemplate={t("site.cartItems", { count: "{count}" })}
              icon={<CartIcon />}
              hideLabel
              className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-[14px] font-semibold text-ink transition-colors hover:bg-primary-05 hover:text-primary"
            />

            <Link href={ctaHref} className={buttonClasses({ className: "ms-2 max-lg:hidden" })}>
              {t("site.quoteCta")}
            </Link>

            <LanguageSwitch
              current={locale}
              className="inline-flex h-10 items-center rounded-full px-3 text-[14px] font-semibold text-ink hover:bg-primary-05 lg:hidden"
            />

            <SiteHeaderMenu
              links={items}
              openLabel={t("site.openMenu")}
              closeLabel={t("site.closeMenu")}
              search={{ href: searchHref, label: t("site.search") }}
              accountMenu={accountMenu}
              cta={{ href: ctaHref, label: t("site.quoteCta") }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}

/* Inline SVG, stroked in `currentColor`, so each icon takes the colour of the
   text it sits beside. */
function SealIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0 text-accent">
      <circle cx="8" cy="7" r="4.6" stroke="currentColor" strokeWidth="1.2" />
      <path d="m6.2 7 1.3 1.3L10 5.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m5.4 10.8-.9 3.7L8 13l3.5 1.5-.9-3.7" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.4" stroke="currentColor" strokeWidth="1.2" />
      <path d="M1.8 8h12.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M8 1.6c1.7 1.8 2.6 4 2.6 6.4S9.7 12.6 8 14.4C6.3 12.6 5.4 10.4 5.4 8S6.3 3.4 8 1.6Z" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="5.4" r="2.8" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2.9 13.6a5.1 5.1 0 0 1 10.2 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="4.6" stroke="currentColor" strokeWidth="1.3" />
      <path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M1.6 2h1.7l1.5 7.2h6.9l1.4-5H4.3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6.2" cy="12.6" r="1.1" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="11.2" cy="12.6" r="1.1" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
