import Link from "next/link";

import { ArrowIcon, buttonClasses, Rosette } from "@/components/ui";
import { accountService } from "@/features/account";
import { getTranslator, localePath, resolveLocale } from "@/i18n";
import { buildMetadata } from "@/lib";

import { PortalIcon, type PortalIconName } from "../_components/portal/portal-icons";
import { EmptyNote, Panel, PortalNotice, PortalShell, StatusChip } from "../_components/portal/portal-shell";
import { accountFrame, statusLabel } from "./_components/account-frame";
import { OrderRows } from "./_components/order-rows";

export async function generateMetadata({ params }: PageProps<"/[locale]/account">) {
  const locale = resolveLocale((await params).locale);
  return buildMetadata({ locale, path: "/account", title: getTranslator(locale)("account.title"), noIndex: true });
}

/**
 * THE ACCOUNT OVERVIEW — the answer to "what is going on with me and JoFit".
 *
 * Four figures, each a way into the list it counts; then what is coming up
 * next in each domain, the first of them on the deep green; then the latest
 * orders beside the person's own details. The "coming up" cards are the page:
 * a session tomorrow and a cohort next month are the reasons someone signs in,
 * and an order history is the reason they scroll.
 */
export default async function AccountOverviewPage({
  params,
  searchParams,
}: PageProps<"/[locale]/account">) {
  const locale = resolveLocale((await params).locale);
  const isNew = (await searchParams).welcome === "1";
  const { customerId, t, f, shell } = await accountFrame(locale, "/account");
  const overview = await accountService.getOverview(customerId, locale);
  const { profile } = overview;
  const firstName = profile.displayName.split(" ")[0] ?? profile.displayName;
  const initials = profile.displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => Array.from(part)[0] ?? "")
    .join("");

  // orders/sessions/enrolments/rentals: no live total-count source on the
  // overview endpoint (see AccountOverview["counts"] in account/types.ts) —
  // shown as 0 rather than breaking the page; `openOrders`/`reviewsToWrite`
  // below are the figures the live API actually sends.
  const figures: readonly { value: number; label: string; href: string; icon: PortalIconName }[] = [
    { value: overview.counts.orders ?? 0, label: t("account.figureOrders"), href: "/account/orders", icon: "orders" },
    { value: overview.counts.sessions ?? 0, label: t("account.figureSessions"), href: "/account/bookings", icon: "sessions" },
    { value: overview.counts.enrolments ?? 0, label: t("account.figureCourses"), href: "/account/enrolments", icon: "courses" },
    { value: overview.counts.rentals ?? 0, label: t("account.figureRentals"), href: "/account/rentals", icon: "rentals" },
  ];

  const upcoming = [
    overview.nextSession && {
      key: "session",
      icon: "sessions" as const,
      kicker: t("account.nextSession"),
      title: overview.nextSession.coachName,
      detail: `${overview.nextSession.packageName} · ${f.dateTime(overview.nextSession.startsAt)}`,
      status: overview.nextSession.status,
      href: "/account/bookings",
    },
    overview.nextCohort && {
      key: "cohort",
      icon: "courses" as const,
      kicker: t("account.nextCohort"),
      title: overview.nextCohort.courseTitle,
      // No live cohortStartsOn when none is assigned yet (see AccountEnrolment in account/types.ts).
      detail: overview.nextCohort.cohortStartsOn ? t("account.cohortStarts", { date: f.date(overview.nextCohort.cohortStartsOn) }) : "",
      status: overview.nextCohort.status,
      href: "/account/enrolments",
    },
    overview.nextRental && {
      key: "rental",
      icon: "rentals" as const,
      kicker: t("account.nextRental"),
      title: overview.nextRental.itemTitle,
      detail: `${f.date(overview.nextRental.period.from)} – ${f.date(overview.nextRental.period.to)}`,
      status: overview.nextRental.status,
      href: "/account/rentals",
    },
  ].filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  return (
    <PortalShell
      {...shell}
      active="/account"
      title={t("account.greeting", { name: firstName })}
      lead={t("account.overviewLead")}
    >
      {isNew ? <PortalNotice title={t("account.welcomeTitle")} body={t("account.welcomeBody")} /> : null}

      {/* THE FIGURES — counted from the customer's own records. */}
      <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {figures.map((figure) => (
          <li key={figure.label} className="flex">
            <Link
              href={localePath(locale, figure.href)}
              className="group flex w-full flex-col rounded-3xl border border-line bg-surface p-5 shadow-soft transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lift sm:p-6"
            >
              <span className="flex items-center justify-between gap-3">
                <span
                  aria-hidden="true"
                  className="grid size-10 place-items-center rounded-full bg-primary-05 text-primary ring-1 ring-primary/15"
                >
                  <PortalIcon name={figure.icon} />
                </span>
                <span aria-hidden="true" className="text-primary/40 transition-colors group-hover:text-primary">
                  <ArrowIcon />
                </span>
              </span>
              <span className="mt-5 block font-heading text-[2.1rem] leading-none font-bold text-ink">
                <span dir="ltr">{f.number(figure.value)}</span>
              </span>
              <span className="mt-2 block text-[13px] leading-snug text-body">{figure.label}</span>
            </Link>
          </li>
        ))}
      </ul>

      <Panel id="coming-up" title={t("account.comingUp")} className="mt-6">
        {upcoming.length === 0 ? (
          <EmptyNote
            icon="sessions"
            text={t("account.nothingAhead")}
            href={localePath(locale, "/coaches")}
            action={t("account.findCoach")}
          />
        ) : (
          <ul className={`grid gap-4 ${upcoming.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
            {upcoming.map((entry, index) => {
              /* The first thing ahead takes the deep green: the eye lands on it. */
              const lead = index === 0;
              return (
                <li key={entry.key} className="flex">
                  <Link
                    href={localePath(locale, entry.href)}
                    className={`group relative isolate flex w-full flex-col overflow-hidden rounded-2xl p-5 transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 ${
                      lead
                        ? "bg-deep text-white/75 shadow-lift"
                        : "border border-line bg-canvas text-body hover:border-primary/30 hover:bg-surface hover:shadow-soft"
                    }`}
                  >
                    {lead ? (
                      <>
                        <span aria-hidden="true" className="pattern-waves absolute inset-0 -z-10 text-white/5" />
                        <span aria-hidden="true" className="absolute -end-14 -top-14 -z-10 size-44 text-accent/20">
                          <Rosette className="size-full" />
                        </span>
                      </>
                    ) : null}
                    <span className={`inline-flex items-center gap-2 text-[13px] font-semibold ${lead ? "text-accent" : "text-primary"}`}>
                      <PortalIcon name={entry.icon} size={15} />
                      {entry.kicker}
                    </span>
                    <span
                      className={`mt-3 font-heading text-[16.5px] leading-snug font-semibold ${lead ? "text-white" : "text-ink"}`}
                    >
                      {entry.title}
                    </span>
                    <span className="mt-1.5 text-[13.5px] leading-relaxed">{entry.detail}</span>
                    <span className="mt-auto pt-4">
                      <StatusChip status={entry.status} label={statusLabel(t, entry.status)} onDark={lead} />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <section
          aria-labelledby="recent-orders"
          className="overflow-hidden rounded-3xl border border-line bg-surface shadow-soft"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5 sm:px-7">
            <h2 id="recent-orders" className="text-[1.2rem] leading-snug sm:text-[1.3rem]">
              {t("account.recentOrders")}
            </h2>
            {overview.recentOrders.length > 0 ? (
              <Link href={localePath(locale, "/account/orders")} className={buttonClasses({ variant: "outline", size: "sm" })}>
                {t("account.allOrders")}
                <ArrowIcon size={14} />
              </Link>
            ) : null}
          </div>
          {overview.recentOrders.length === 0 ? (
            <div className="px-6 pb-6 sm:px-7 sm:pb-7">
              <EmptyNote icon="orders" text={t("account.noOrders")} href={localePath(locale, "/shop")} action={t("cart.browseShop")} />
            </div>
          ) : (
            <div className="border-t border-line">
              <OrderRows orders={overview.recentOrders} locale={locale} t={t} f={f} preview={false} />
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <Panel id="profile" title={t("account.profile")}>
            <div className="flex items-center gap-4">
              <span
                aria-hidden="true"
                className="grid size-14 shrink-0 place-items-center rounded-full bg-deep-2 font-heading text-[17px] font-bold text-accent ring-1 ring-accent/50 ring-offset-4 ring-offset-surface"
              >
                {initials}
              </span>
              <p className="min-w-0 font-heading text-[16px] leading-snug font-semibold text-ink" dir="auto">
                {profile.displayName}
              </p>
            </div>
            <dl className="mt-6 divide-y divide-line border-y border-line text-[14px]">
              <div className="py-3">
                <dt className="text-[12.5px] text-body/75">{t("signIn.email")}</dt>
                <dd className="mt-0.5 font-medium break-all text-ink">
                  <span dir="ltr">{profile.email}</span>
                </dd>
              </div>
              {profile.phone ? (
                <div className="py-3">
                  <dt className="text-[12.5px] text-body/75">{t("booking.phone")}</dt>
                  <dd className="mt-0.5 font-medium text-ink">
                    <span dir="ltr">{profile.phone}</span>
                  </dd>
                </div>
              ) : null}
              <div className="py-3">
                <dt className="text-[12.5px] text-body/75">{t("account.memberSince")}</dt>
                <dd className="mt-0.5 font-medium text-ink">{f.date(profile.createdAt)}</dd>
              </div>
            </dl>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href={localePath(locale, "/account/settings")} className={buttonClasses({ variant: "soft", size: "sm" })}>
                {t("account.editDetails")}
              </Link>
              <Link href={localePath(locale, "/account/preferences")} className={buttonClasses({ variant: "soft", size: "sm" })}>
                {t("account.editPreferences")}
              </Link>
            </div>
          </Panel>

          {overview.counts.reviewsToWrite > 0 ? (
            <section
              aria-labelledby="review-prompt"
              className="relative isolate overflow-hidden rounded-3xl bg-deep p-6 text-white/75 shadow-lift sm:p-7"
            >
              <span aria-hidden="true" className="pattern-waves absolute inset-0 -z-10 text-white/5" />
              <span aria-hidden="true" className="absolute -end-16 -bottom-16 -z-10 size-48 text-accent/20">
                <Rosette className="size-full" />
              </span>
              <span
                aria-hidden="true"
                className="grid size-10 place-items-center rounded-full bg-white/10 text-accent ring-1 ring-white/15"
              >
                <PortalIcon name="reviews" />
              </span>
              <h2 id="review-prompt" className="mt-5 text-[1.2rem] leading-snug text-white">
                {t("account.reviewPromptTitle")}
              </h2>
              <p className="mt-2 text-[14px] leading-relaxed text-white/70">
                {t("account.reviewPromptBody", { count: f.number(overview.counts.reviewsToWrite) })}
              </p>
              <Link
                href={localePath(locale, "/account/reviews")}
                className={buttonClasses({ variant: "gold", size: "sm", className: "mt-5" })}
              >
                {t("account.writeReview")}
              </Link>
            </section>
          ) : null}
        </aside>
      </div>
    </PortalShell>
  );
}
