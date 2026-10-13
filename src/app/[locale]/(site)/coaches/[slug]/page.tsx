import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { buttonClasses, PageHero, Reveal, Section, SectionHead } from "@/components/ui";
import { accountService } from "@/features/account";
import { authService } from "@/features/auth";
import { coachesService } from "@/features/coaches";
import { reviewsService } from "@/features/reviews";
import { sportsService } from "@/features/sports";
import { getFormatters, getTranslator, localePath, resolveLocale } from "@/i18n";
import { addDays, breadcrumbJsonLd, isAppError, jsonLdScriptProps, metadataFromSeo, toIsoDate } from "@/lib";
import type { MediaImage } from "@/types";

import { HelpBand } from "../../_components/help-band";
import { CoachCard } from "../_components/coach-card";
import {
  CertificateIcon,
  ChatIcon,
  CheckIcon,
  ClockIcon,
  GlobeIcon,
  LanguagesIcon,
  MedalIcon,
  PinIcon,
  UserIcon,
} from "../_components/icons";
import { RatingStars } from "../_components/rating";
import { BookingFlow, type BookingDayView, type BookingPackageView } from "./booking-flow";
import { CoachGallery, type GalleryImageView } from "./gallery";

/** How far ahead a coach's calendar is published. */
const HORIZON_DAYS = 14;

export async function generateMetadata({ params }: PageProps<"/[locale]/coaches/[slug]">) {
  const { locale: raw, slug } = await params;
  const locale = resolveLocale(raw);
  const coach = await coachesService.getCoachBySlug(slug, locale);
  if (!coach) return metadataFromSeo(undefined, { locale, title: "Not found", noIndex: true });

  return metadataFromSeo(coach.seo, {
    locale,
    title: coach.name,
    description: coach.headline,
    path: `/coaches/${coach.slug}`,
    type: "profile",
    imageUrl: coach.avatar?.url,
  });
}

/**
 * A COACH PROFILE — the formal detail recipe.
 *
 *   PageHero   who this is (specialisations, name, headline, rating) with the
 *              FACTS CARD in the end column: the portrait as a seal, the first
 *              credential, experience, sessions, response time, how sessions
 *              run, the entry price and the booking action
 *   profile    the bio and the certifications as credential rows, beside a
 *              sticky aside with sports, languages, venue and availability
 *   gallery    the coach's photographs, on the one deep band (only if any)
 *   booking    the five-step wizard
 *   reviews    the score and what people wrote
 *   others     three more from the roster
 *   help       the closing band
 *
 * The wizard is a Client Component and is handed FINISHED STRINGS: prices,
 * clock faces, weekday names, every label. The dictionary, the money helpers
 * and `Intl` stay here, on the server. That is the same rule every other
 * interactive leaf in this codebase follows, and on this page it has a second
 * payoff — the times rendered server-side are the venue's, so they cannot
 * disagree with whatever zone the visitor's laptop is set to.
 */
export default async function CoachPage({ params }: PageProps<"/[locale]/coaches/[slug]">) {
  const { locale: raw, slug } = await params;
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);
  const { date, money, number, time, weekday } = getFormatters(locale);

  const coach = await coachesService.getCoachBySlug(slug, locale);
  if (!coach) notFound();

  /* A signed-in customer's details prefill the booking step. */
  const session = await authService.getSession();
  const signedInCustomer = session?.account.role === "customer" ? session.account : null;
  const contactDefaults = signedInCustomer
    ? await accountService
        .getOverview(signedInCustomer.customerId!, locale)
        .then((overview) => ({
          name: overview.profile.displayName,
          email: overview.profile.email,
          phone: overview.profile.phone ?? "",
        }))
    : undefined;

  const today = toIsoDate(new Date());
  const [sports, slots, reviews, others] = await Promise.all([
    sportsService.getManyByIds(coach.sportIds, locale),
    coachesService.listAvailability(coach.id, { from: today, to: addDays(today, HORIZON_DAYS - 1) }),
    reviewsService.list({ locale, target: { type: "coach", id: coach.id }, pageSize: 3 }),
    /* Three more from the same roster, for the visitor this coach is not for. */
    coachesService.listCoaches({ locale, sort: "rating-desc", pageSize: 4 }),
  ]);

  const coachHref = localePath(locale, `/coaches/${coach.slug}`);
  const browseHref = localePath(locale, "/coaches");

  /* --------------------------------------------------------------------- */
  /* The wizard's view model. Every value below is a finished string.       */
  /* --------------------------------------------------------------------- */

  const packageViews: BookingPackageView[] = coach.packages.map((entry) => ({
    id: entry.id,
    name: entry.name,
    description: entry.description,
    priceLabel: money(entry.price),
    compareAtLabel: entry.compareAtPrice ? money(entry.compareAtPrice) : undefined,
    perSessionLabel:
      entry.sessionCount > 1
        ? t("booking.packagePerSession", {
            price: money({
              amount: Math.round(entry.price.amount / entry.sessionCount),
              currency: entry.price.currency,
            }),
          })
        : undefined,
    durationLabel: t("booking.packageMinutes", { count: number(entry.durationMinutes) }),
    sessionsLabel:
      entry.sessionCount > 1
        ? t("booking.packageSessions", { count: number(entry.sessionCount) })
        : undefined,
    modeLabel:
      entry.mode === "online" ? t("booking.packageOnline") : t("booking.packageInPerson"),
    isOnline: entry.mode === "online",
  }));

  /*
   * Every day in the horizon gets a tile, including the empty ones.
   *
   * Listing only the days that have hours would silently skip Fridays and make
   * the strip look like a fortnight of consecutive days when it is not. A
   * visible closed day is information; a missing one is a lie about the week.
   */
  const dayViews: BookingDayView[] = Array.from({ length: HORIZON_DAYS }, (_, offset) => {
    const day = addDays(today, offset);
    const onDay = slots.filter((slot) => slot.startsAt.slice(0, 10) === day);
    const free = onDay.filter((slot) => !slot.isBooked).length;

    return {
      date: day,
      weekday: weekday(day),
      dayNumber: number(Number(day.slice(8, 10))),
      statusLabel:
        onDay.length === 0
          ? t("booking.dateClosed")
          : free === 0
            ? t("booking.dateFull")
            : t("booking.dateFree", { count: number(free) }),
      isDisabled: free === 0,
      slots: onDay.map((slot) => ({
        id: slot.id,
        timeLabel: time(slot.startsAt),
        isBooked: slot.isBooked,
      })),
    };
  });

  /*
   * THE SERVER ACTION.
   *
   * It closes over plain strings only. `t` is a function and cannot be captured
   * by an inline action — see the same note in `sign-in/page.tsx` — so the one
   * message it may need is resolved out here first.
   *
   * It returns a result rather than throwing: a thrown error inside an action
   * becomes an opaque digest in production and the visitor learns nothing.
   */
  const genericError = t("booking.errorGeneric");
  const coachId = coach.id;

  async function book(input: {
    packageId: string;
    slotId: string;
    name: string;
    email: string;
    phone: string;
    goal: string;
  }) {
    "use server";
    try {
      /* WHO PAYS comes from the server session, never from the form: a signed-in
         customer's booking lands on their account; a guest's still reaches the
         coach. Read here, inside the action, because the action is an endpoint
         of its own and the page that drew the form proves nothing. */
      const session = await authService.getSession();
      const booking = await coachesService.createBooking(
        {
          coachId,
          packageId: input.packageId,
          slotId: input.slotId,
          contact: { name: input.name, email: input.email, phone: input.phone },
          goal: input.goal || undefined,
          customerId: session?.account.role === "customer" ? session.account.customerId : undefined,
        },
        locale,
      );

      const formatters = getFormatters(locale);
      return {
        ok: true as const,
        booking: {
          reference: booking.reference,
          packageName: booking.packageName,
          whenLabel: formatters.dateTime(booking.slot.startsAt),
          totalLabel: formatters.money(booking.total),
        },
      };
    } catch (error) {
      /* An `AppError` carries a message written for a person — "that time has
         just been taken" is more use than "something went wrong". */
      return { ok: false as const, message: isAppError(error) ? error.message : genericError };
    }
  }

  const cheapest = coach.packages.reduce<(typeof coach.packages)[number] | undefined>(
    (lowest, entry) => (lowest && lowest.price.amount <= entry.price.amount ? lowest : entry),
    undefined,
  );

  /* The facts a visitor checks before reading a word of the bio. */
  const facts: readonly { icon: ReactNode; label: string; value: ReactNode }[] = [
    {
      icon: <MedalIcon size={16} />,
      label: t("coaches.experience"),
      value: t("coaches.years", { count: number(coach.yearsOfExperience) }),
    },
    {
      icon: <CheckIcon size={16} />,
      label: t("coaches.sessionsDone"),
      value: <span dir="ltr">{number(coach.completedSessions)}</span>,
    },
    {
      icon: <ChatIcon size={16} />,
      label: t("coaches.responseLabel"),
      value: t("coaches.respondsIn", { count: number(coach.responseTimeHours) }),
    },
    {
      icon: coach.isRemoteAvailable ? <GlobeIcon size={16} /> : <UserIcon size={16} />,
      label: t("coaches.deliveryLabel"),
      value: coach.isRemoteAvailable ? t("coaches.remoteBadge") : t("coaches.inPersonBadge"),
    },
  ];

  /*
   * THE GALLERY, as staff ordered it — the first photograph is the cover.
   * Videos are kept on the record by the admin but not drawn here: the grid
   * and the lightbox show photographs.
   */
  const photos: GalleryImageView[] = coach.gallery
    .filter((entry): entry is MediaImage => entry.kind === "image")
    .map((entry) => ({ id: entry.id, url: entry.url, alt: entry.alt }));
  const photoTotal = number(photos.length);
  const galleryCopy = {
    dialog: t("coachGallery.dialog", { name: coach.name }),
    open: photos.map((photo, index) => {
      const label = t("coachGallery.open", { current: number(index + 1), total: photoTotal });
      return photo.alt ? `${label} — ${photo.alt}` : label;
    }),
    counter: photos.map((_, index) =>
      t("coachGallery.counter", { current: number(index + 1), total: photoTotal }),
    ),
    close: t("coachGallery.close"),
    previous: t("coachGallery.previous"),
    next: t("coachGallery.next"),
  };

  const ratingLabel = `${t("coaches.ratingValue", { rating: number(coach.rating.average) })}, ${t("coaches.reviewsCount", { count: number(coach.rating.count) })}`;
  const credential = coach.certifications[0];
  const moreCoaches = others.items.filter((entry) => entry.id !== coach.id).slice(0, 3);

  return (
    <>
      <script
        {...jsonLdScriptProps(
          breadcrumbJsonLd(locale, [
            { name: t("site.name"), path: "/" },
            { name: t("coaches.title"), path: "/coaches" },
            { name: coach.name, path: `/coaches/${coach.slug}` },
          ]),
        )}
      />

      {/* ---------------------------------------------------------------- */}
      {/* WHO THIS IS                                                       */}
      {/* ---------------------------------------------------------------- */}
      <PageHero
        breadcrumbLabel={t("site.breadcrumb")}
        breadcrumbs={[
          { label: t("nav.home"), href: localePath(locale, "/") },
          { label: t("coaches.title"), href: browseHref },
          { label: coach.name },
        ]}
        eyebrow={coach.specializations.join(" · ") || t("coaches.eyebrow")}
        title={coach.name}
        lead={coach.headline}
        actions={
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-[14px] text-white/75">
            {coach.rating.count > 0 ? (
              <span className="inline-flex items-center gap-2.5">
                <RatingStars value={coach.rating.average} label={ratingLabel} size={16} tone="dark" />
                <span className="font-heading text-lg font-bold text-white" dir="ltr">
                  {coach.rating.average.toFixed(1)}
                </span>
                <span className="text-white/55">{t("coaches.reviewsCount", { count: number(coach.rating.count) })}</span>
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5">
              <span className="text-accent">
                <PinIcon size={15} />
              </span>
              {coach.location.name}
            </span>
          </div>
        }
        aside={
          <div className="rounded-3xl bg-white p-4 text-ink shadow-lift">
            {/* The portrait as a seal on a strip of the hero's own ground. */}
            <div className="relative isolate flex items-center gap-4 overflow-hidden rounded-2xl bg-deep-2 p-4 text-white/75">
              <span aria-hidden="true" className="pattern-waves absolute inset-0 -z-10 text-white/5" />
              <span className="relative block size-20 shrink-0 rounded-full bg-white/10 p-1 ring-1 ring-accent/50">
                <span className="relative block size-full overflow-hidden rounded-full bg-deep">
                  {coach.avatar ? (
                    <Image
                      src={coach.avatar.url}
                      alt={coach.avatar.alt}
                      fill
                      priority
                      sizes="80px"
                      className="object-cover object-center"
                    />
                  ) : null}
                </span>
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 text-[12px] font-semibold text-accent">
                  <CertificateIcon size={14} />
                  {t("coaches.certifications")}
                </span>
                {credential ? (
                  <>
                    <span className="mt-1 line-clamp-2 block font-heading text-[14.5px] leading-snug font-semibold text-white">
                      <bdi>{credential.name}</bdi>
                    </span>
                    <span className="mt-0.5 block text-[12.5px] text-white/60">
                      {t("coaches.certifiedBy", { issuer: credential.issuedBy })}
                    </span>
                  </>
                ) : (
                  <span className="mt-1 block text-[13px] text-white/60">{t("coaches.noCertifications")}</span>
                )}
              </span>
            </div>

            <dl className="mt-2 divide-y divide-line px-2">
              {facts.map((fact) => (
                <div key={fact.label} className="flex items-start gap-3 py-3.5">
                  <dt className="flex w-36 shrink-0 items-center gap-2 text-[13px] text-body">
                    <span aria-hidden="true" className="text-primary">
                      {fact.icon}
                    </span>
                    {fact.label}
                  </dt>
                  <dd className="min-w-0 text-[14px] font-semibold text-ink">{fact.value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-1 grid gap-2.5 px-2 pb-2">
              {cheapest ? (
                <p className="pb-1 text-[13px] text-body">
                  {t("coaches.fromPrice", { price: money(cheapest.price) })}
                  <span className="text-body/50"> · </span>
                  {t("booking.packageMinutes", { count: number(cheapest.durationMinutes) })}
                </p>
              ) : null}
              <a href="#booking" className={buttonClasses({ size: "lg", className: "w-full" })}>
                {t("coaches.bookSession")}
              </a>
              <Link href={localePath(locale, "/contact")} className={buttonClasses({ variant: "outline", className: "w-full" })}>
                {t("coaches.ctaAction")}
              </Link>
            </div>
          </div>
        }
      />

      {/* ---------------------------------------------------------------- */}
      {/* WHAT THEY DO, AND WHAT THEY HOLD                                  */}
      {/* ---------------------------------------------------------------- */}
      <Section labelledBy="coach-about">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
          <div>
            <SectionHead
              id="coach-about"
              eyebrow={t("coaches.profileEyebrow")}
              title={t("coaches.about", { name: coach.name })}
            />
            <p className="mt-6 max-w-[66ch] text-[1.05rem] leading-[1.9] text-body" dir="auto">
              {coach.bio}
            </p>

            {coach.certifications.length > 0 ? (
              <>
                <h2 id="coach-certifications" className="mt-16 text-[1.75rem] leading-tight sm:text-[2rem]">
                  {t("coaches.certifications")}
                </h2>
                <Reveal stagger as="ul" className="mt-8 space-y-3">
                  {coach.certifications.map((certification) => (
                    <li
                      key={certification.id}
                      className="flex items-center gap-5 rounded-3xl border border-line bg-surface p-5 shadow-soft"
                    >
                      <span
                        aria-hidden="true"
                        className="grid size-12 shrink-0 place-items-center rounded-full bg-deep text-accent ring-1 ring-accent/40 ring-offset-2 ring-offset-surface"
                      >
                        <CertificateIcon size={20} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-heading text-[16px] leading-snug font-semibold text-ink">
                          <bdi>{certification.name}</bdi>
                        </span>
                        <span className="mt-1 block text-[14px] text-body">
                          {t("coaches.certifiedBy", { issuer: certification.issuedBy })}
                        </span>
                      </span>
                      {certification.issuedAt ? (
                        <span className="shrink-0 text-end text-[12.5px] text-body/70 max-sm:hidden">
                          {t("coaches.issuedOn", { date: date(certification.issuedAt) })}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </Reveal>
              </>
            ) : null}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
            {sports.length > 0 ? (
              <SideCard icon={<MedalIcon size={15} />} title={t("field.sports")}>
                <ul className="flex flex-wrap gap-2">
                  {sports.map((sport) => (
                    <li key={sport.id}>
                      <Link
                        href={localePath(locale, `/sports/${sport.slug}`)}
                        className="inline-block rounded-full bg-primary-05 px-3 py-1.5 text-[13px] font-medium text-primary-dark transition-colors hover:bg-primary hover:text-on-primary"
                      >
                        {sport.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </SideCard>
            ) : null}

            <SideCard icon={<LanguagesIcon size={15} />} title={t("coaches.languages")}>
              <ul className="space-y-1.5">
                {coach.languages.map((language) => (
                  <li key={language} className="flex items-center gap-2 text-[14px] text-body">
                    <span className="text-primary">
                      <CheckIcon size={13} />
                    </span>
                    {language}
                  </li>
                ))}
              </ul>
            </SideCard>

            <SideCard icon={<PinIcon size={15} />} title={t("coaches.location")}>
              <p className="text-[14px] text-body">
                {coach.location.name}
                <span className="block text-[13px] text-body/70">{coach.location.city}</span>
              </p>
            </SideCard>

            <SideCard icon={<ClockIcon size={15} />} title={t("coaches.availability")}>
              <p className="text-[14px] text-body">{t("booking.dateLead")}</p>
              <a
                href="#booking"
                className="mt-3 inline-block text-[13px] font-semibold text-primary-dark underline-offset-4 hover:underline"
              >
                {t("coaches.seeTimes")}
              </a>
            </SideCard>
          </aside>
        </div>
      </Section>

      {/* ---------------------------------------------------------------- */}
      {/* WHAT A SESSION LOOKS LIKE                                         */}
      {/* ---------------------------------------------------------------- */}
      {/* The page's one deep band, and only when there are photographs: an
          empty gallery is no gallery. */}
      {photos.length > 0 ? (
        <Section tone="deep" labelledBy="coach-gallery">
          <SectionHead
            id="coach-gallery"
            tone="dark"
            title={t("coachGallery.title")}
            lead={t("coachGallery.lead", { name: coach.name })}
          />
          <div className="mt-10">
            <CoachGallery images={photos} copy={galleryCopy} />
          </div>
        </Section>
      ) : null}

      {/* ---------------------------------------------------------------- */}
      {/* WHEN YOU CAN SEE THEM                                             */}
      {/* ---------------------------------------------------------------- */}
      <Section id="booking" tone="muted" labelledBy="coach-booking" className="scroll-mt-28">
        <SectionHead
          id="coach-booking"
          eyebrow={t("coaches.availability")}
          title={t("booking.title")}
          lead={t("booking.lead")}
        />

        <div className="mt-10">
          {packageViews.length === 0 ? (
            <p className="rounded-3xl border border-line bg-surface px-6 py-12 text-center text-[15px] text-body shadow-soft">
              {t("booking.packageNone")}
            </p>
          ) : (
            <BookingFlow
              coachName={coach.name}
              coachHref={coachHref}
              browseHref={browseHref}
              packages={packageViews}
              days={dayViews}
              action={book}
              contactDefaults={contactDefaults}
              accountLink={
                signedInCustomer
                  ? { href: localePath(locale, "/account/bookings"), label: t("account.seeBooking") }
                  : undefined
              }
              copy={{
                title: t("booking.title"),
                lead: t("booking.lead"),
                stepOf: [
                  t("booking.stepOf", { current: number(1), total: number(5) }),
                  t("booking.stepOf", { current: number(2), total: number(5) }),
                  t("booking.stepOf", { current: number(3), total: number(5) }),
                  t("booking.stepOf", { current: number(4), total: number(5) }),
                  t("booking.stepOf", { current: number(5), total: number(5) }),
                ],
                steps: [
                  t("booking.stepPackage"),
                  t("booking.stepDate"),
                  t("booking.stepTime"),
                  t("booking.stepDetails"),
                  t("booking.stepReview"),
                ],
                back: t("booking.back"),
                next: t("booking.next"),
                change: t("booking.change"),
                confirm: t("booking.confirm"),
                confirming: t("booking.confirming"),
                packageTitle: t("booking.packageTitle"),
                dateTitle: t("booking.dateTitle"),
                dateLead: t("booking.dateLead"),
                timeTitle: t("booking.timeTitle"),
                timeLead: t("booking.timeLead"),
                timeTaken: t("booking.timeTaken"),
                timeNone: t("booking.timeNone"),
                detailsTitle: t("booking.detailsTitle"),
                detailsLead: t("booking.detailsLead"),
                name: t("booking.name"),
                namePlaceholder: t("booking.namePlaceholder"),
                email: t("booking.email"),
                emailPlaceholder: t("booking.emailPlaceholder"),
                phone: t("booking.phone"),
                phonePlaceholder: t("booking.phonePlaceholder"),
                goal: t("booking.goal"),
                goalOptional: t("booking.goalOptional"),
                goalPlaceholder: t("booking.goalPlaceholder"),
                reviewTitle: t("booking.reviewTitle"),
                reviewCoach: t("booking.reviewCoach"),
                reviewSession: t("booking.reviewSession"),
                reviewWhen: t("booking.reviewWhen"),
                reviewWho: t("booking.reviewWho"),
                reviewGoal: t("booking.reviewGoal"),
                reviewTotal: t("booking.reviewTotal"),
                payLater: t("booking.payLater"),
                doneTitle: t("booking.doneTitle"),
                doneBody: t("booking.doneBody", {
                  name: coach.name,
                  hours: number(coach.responseTimeHours),
                }),
                reference: t("booking.reference"),
                doneAnother: t("booking.doneAnother"),
                doneBrowse: t("booking.doneBrowse"),
                errorRequired: t("booking.errorRequired"),
                errorEmail: t("booking.errorEmail"),
                errorPhone: t("booking.errorPhone"),
                errorGeneric: genericError,
              }}
            />
          )}
        </div>
      </Section>

      {/* ---------------------------------------------------------------- */}
      {/* WHAT PEOPLE SAY                                                   */}
      {/* ---------------------------------------------------------------- */}
      {reviews.items.length > 0 ? (
        <Section labelledBy="coach-reviews">
          <SectionHead id="coach-reviews" title={t("reviews.title", { label: t("reviews.labelCoach") })} />
          <div className="mt-10 grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-12">
            {/* The score and the writing are two different things: the score
                is every rating, the cards are the ones people wrote up. */}
            <div className="relative isolate overflow-hidden rounded-3xl bg-deep p-7 text-white lg:self-start">
              <span aria-hidden="true" className="pattern-waves absolute inset-0 -z-10 text-white/5" />
              <p className="font-heading text-[3rem] leading-none font-bold text-white" dir="ltr">
                {coach.rating.average.toFixed(1)}
              </p>
              <p className="mt-3">
                <RatingStars value={coach.rating.average} label={ratingLabel} size={16} tone="dark" />
              </p>
              <p className="mt-6 text-[13px] text-white/65">
                {t("coaches.reviewsCount", { count: number(coach.rating.count) })}
              </p>
            </div>

            <Reveal stagger as="ul" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {reviews.items.map((review) => (
                <li key={review.id} className="flex">
                  <article className="flex h-full w-full flex-col rounded-3xl border border-line bg-surface p-6 shadow-soft">
                    <RatingStars
                      value={review.rating}
                      label={t("reviews.outOf", { rating: number(review.rating) })}
                      size={14}
                    />
                    {review.title ? (
                      <h3 className="mt-4 text-[16px]" dir="auto">
                        {review.title}
                      </h3>
                    ) : null}
                    <p className="mt-2 text-[14px] leading-relaxed text-body" dir="auto">
                      {review.body}
                    </p>
                    <p className="mt-auto pt-5 text-[13px] font-semibold text-ink" dir="auto">
                      {review.author.displayName}
                    </p>
                  </article>
                </li>
              ))}
            </Reveal>
          </div>
        </Section>
      ) : null}

      {/* ---------------------------------------------------------------- */}
      {/* WHO ELSE                                                          */}
      {/* ---------------------------------------------------------------- */}
      {moreCoaches.length > 0 ? (
        <Section tone="muted" labelledBy="coach-more">
          <SectionHead
            id="coach-more"
            eyebrow={t("coaches.eyebrow")}
            title={t("coaches.moreTitle")}
            actions={
              <Link href={browseHref} className={buttonClasses({ variant: "outline" })}>
                {t("coaches.backToList")}
              </Link>
            }
          />
          <Reveal stagger as="ul" className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {moreCoaches.map((entry) => (
              <li key={entry.id} className="flex">
                <CoachCard coach={entry} locale={locale} t={t} />
              </li>
            ))}
          </Reveal>
        </Section>
      ) : null}

      <HelpBand locale={locale} topic="coaches" />
    </>
  );
}

function SideCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-line bg-surface p-5 shadow-soft">
      <h3 className="mb-3 flex items-center gap-2 font-sans text-[13px] font-semibold text-ink">
        <span aria-hidden="true" className="grid size-7 place-items-center rounded-full bg-primary-05 text-primary">
          {icon}
        </span>
        {title}
      </h3>
      {children}
    </div>
  );
}
