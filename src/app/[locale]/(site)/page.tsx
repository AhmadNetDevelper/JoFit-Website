import Image from "next/image";
import Link from "next/link";

import { JofitLogo } from "@/components/brand/jofit-logo";
import { ArrowIcon, buttonClasses, Container, Reveal, Rosette, Section, SectionHead } from "@/components/ui";
import { accreditations } from "@/config";
import { contentService } from "@/features/content";
import { educationService, type Course } from "@/features/education";
import { getFormatters, getTranslator, localePath, resolveLocale, type Locale, type Translate } from "@/i18n";
import { buildMetadata } from "@/lib";

import { HelpBand } from "./_components/help-band";
import { IntroVideo } from "./_components/intro-video";
import { ArticleCard } from "./blog/_components/article-card";
import { CertificationPath } from "./education/_components/certification-path";

export async function generateMetadata({ params }: PageProps<"/[locale]">) {
  const locale = resolveLocale((await params).locale);
  const t = getTranslator(locale);
  return buildMetadata({
    locale,
    path: "/",
    title: t("home.metaTitle"),
    description: t("home.metaDescription"),
  });
}

/**
 * THE HOME PAGE — rebuilt from scratch on 2026-09-29.
 *
 * The old home page was the BodyShape gym template, verbatim. The client
 * rejected it: JoFit is not a gym, it is the NCSF's agent in Jordan and it sells
 * accredited certifications. So this page is built like a certification body's
 * front door, top to bottom:
 *
 *   hero            who JoFit is, the owner's own words, and the person holding
 *                   the certificate the whole site is about
 *   recognition     the bodies behind that certificate (`config/accreditations`)
 *   intro           the client's introduction film, with its four parts
 *   programmes      the client's six programmes, numbered in their order, each
 *                   on its own photograph with its name in the page's language
 *   offer           "What we offer" and "under the supervision of NCSF's agents
 *                   in Jordan" — the two statements the client sent as posters,
 *                   set as text on the deep band they were designed on
 *   why             four reasons, every one a verified fact or the owner's copy
 *   path            the four steps from enquiry to certificate
 *   journal         the latest articles
 *   help            the team, one tap away
 *
 * NOTHING HERE IS INVENTED. No testimonials (none were supplied), no student
 * counts, no prices (the fixtures' fees are placeholders). The two figures in
 * the hero are counted from the catalogue itself; every programme name and
 * description is the client's (2026-09-29).
 */

/**
 * The client's own order. Their folder numbered Olympic Weightlifting "06", and
 * the certification comes first. A programme the catalogue adds later that is
 * not listed here still shows, after these.
 */
const PROGRAMME_ORDER = [
  "certified-personal-trainer",
  "strength-and-conditioning-specialist",
  "sports-nutrition-specialist",
  "sports-injury-prevention-and-rehabilitation",
  "professional-pilates-instructor",
  "olympic-weightlifting",
];
export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const locale = resolveLocale((await params).locale);
  const t = getTranslator(locale);

  const [catalogue, journal] = await Promise.all([
    educationService.listCourses({ locale, pageSize: 200 }),
    contentService.listArticles({ locale, pageSize: 3 }),
  ]);

  const inCategory = (id: string) => catalogue.items.filter((course) => course.categoryIds.includes(id));
  const rank = (course: Course) => {
    const index = PROGRAMME_ORDER.indexOf(course.slug);
    return index === -1 ? PROGRAMME_ORDER.length : index;
  };
  const programmes = [...inCategory("ccat-certifications"), ...inCategory("ccat-specialised")].sort(
    (a, b) => rank(a) - rank(b),
  );

  return (
    <>
      <Hero
        locale={locale}
        t={t}
        certificationCount={inCategory("ccat-certifications").length}
        specialisedCount={inCategory("ccat-specialised").length}
      />
      <Recognition t={t} />
      <Intro locale={locale} t={t} />

      <Section labelledBy="home-programmes">
        <SectionHead
          id="home-programmes"
          eyebrow={t("landing.programmesEyebrow")}
          title={t("landing.programmesTitle")}
          lead={t("landing.programmesLead")}
          actions={
            <Link href={localePath(locale, "/education")} className={buttonClasses({ variant: "outline" })}>
              {t("landing.viewAll")}
            </Link>
          }
        />
        <Reveal stagger as="ul" className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {programmes.map((course, index) => (
            <li key={course.id} className="flex">
              <ProgrammeTile
                course={course}
                index={index}
                locale={locale}
                t={t}
                priority={index < 3}
              />
            </li>
          ))}
        </Reveal>
      </Section>

      <Offer t={t} />

      <Why t={t} />

      <CertificationPath locale={locale} t={t} eyebrow={t("landing.pathEyebrow")} />

      {journal.items.length > 0 ? (
        <Section tone="muted" labelledBy="home-journal">
          <SectionHead
            id="home-journal"
            eyebrow={t("landing.blogEyebrow")}
            title={t("landing.blogTitle")}
            actions={
              <Link href={localePath(locale, "/blog")} className={buttonClasses({ variant: "outline" })}>
                {t("landing.blogLink")}
              </Link>
            }
          />
          <Reveal stagger className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {journal.items.map((article) => (
              <ArticleCard key={article.id} article={article} locale={locale} t={t} />
            ))}
          </Reveal>
        </Section>
      ) : null}

      <HelpBand locale={locale} topic="courses" />
    </>
  );
}

/* ------------------------------------------------------------------------- */

/**
 * THE HERO.
 *
 * The theme's deep green, the certificate linework, and a rosette behind the
 * arch. The figure is the owner's own photograph: a trainer holding an NCSF
 * certificate — the site's promise in one image. Two cards float off the arch:
 * who issues the certificate, and how many programmes there are (counted from
 * the catalogue, not written by hand).
 *
 * Its entrance is CSS (`data-enter`, see `chrome.css`) because it is on screen
 * at first paint; a client-driven entrance would flash.
 */
function Hero({
  locale,
  t,
  certificationCount,
  specialisedCount,
}: {
  locale: Locale;
  t: Translate;
  certificationCount: number;
  specialisedCount: number;
}) {
  const { number } = getFormatters(locale);

  return (
    <section data-band aria-labelledby="home-hero" className="relative isolate overflow-hidden bg-deep text-white">
      <span aria-hidden="true" className="pattern-waves absolute inset-0 -z-10 text-white/[0.035]" />
      <span
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(50rem_32rem_at_78%_30%,color-mix(in_srgb,var(--color-primary)_55%,transparent),transparent_70%)] rtl:bg-[radial-gradient(50rem_32rem_at_22%_30%,color-mix(in_srgb,var(--color-primary)_55%,transparent),transparent_70%)]"
      />
      <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-accent/60 to-transparent" />

      <Container className="grid items-center gap-14 pt-14 pb-16 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:pt-20 lg:pb-24">
        <div>
          <p className="eyebrow" data-tone="dark" data-enter style={{ ["--d" as string]: 0 }}>
            {t("landing.heroEyebrow")}
          </p>
          <h1
            id="home-hero"
            data-enter
            style={{ ["--d" as string]: 1 }}
            className="mt-6 text-[2.6rem] leading-[1.08] text-white sm:text-6xl lg:text-[4.1rem]"
          >
            {t("landing.heroTitleLead")} <span className="text-accent">{t("landing.heroTitleAccent")}</span>
          </h1>
          <p data-enter style={{ ["--d" as string]: 2 }} className="mt-7 max-w-xl text-[1.08rem] leading-relaxed text-white/75">
            {t("landing.heroBody")}
          </p>
          <p data-enter style={{ ["--d" as string]: 3 }} className="mt-4 max-w-xl text-white/55">
            {t("landing.heroNote")}
          </p>
          <div data-enter style={{ ["--d" as string]: 4 }} className="mt-10 flex flex-wrap items-center gap-3">
            <Link href={localePath(locale, "/education")} className={buttonClasses({ variant: "gold", size: "lg" })}>
              {t("landing.heroPrimary")}
            </Link>
            <Link href={localePath(locale, "/contact")} className={buttonClasses({ variant: "ghostDark", size: "lg" })}>
              {t("landing.heroSecondary")}
            </Link>
          </div>
        </div>

        <div data-enter="scale" style={{ ["--d" as string]: 2 }} className="relative mx-auto w-full max-w-[27rem] lg:max-w-[30rem]">
          {/* The rosette turns behind the arch, a halo around the photograph. */}
          <span aria-hidden="true" className="absolute start-1/2 top-[-12%] size-[130%] -translate-x-1/2 text-accent/15 rtl:translate-x-1/2">
            <Rosette className="spin-slow size-full" />
          </span>
          {/* The arch: a tall frame with a rounded head, lined in gold — a coach leading a class. */}
          <div className="relative aspect-[5/6] overflow-hidden rounded-t-[999px] rounded-b-[2.25rem] bg-deep-2 shadow-lift ring-1 ring-white/10">
            <Image
              src="/images/hero/hero-coaching.webp"
              alt=""
              fill
              priority
              sizes="(min-width: 1024px) 480px, 90vw"
              className="object-cover object-[20%_50%]"
            />
            <span aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-deep/75 via-deep/10 to-primary/10" />
            <span aria-hidden="true" className="absolute inset-3 rounded-t-[999px] rounded-b-[1.75rem] border border-accent/50" />
          </div>

          <div className="relative mx-auto mt-5 flex max-w-[15.5rem] items-center gap-3 rounded-2xl bg-white p-3.5 pe-5 text-deep shadow-lift sm:absolute sm:top-[5%] sm:-start-12 sm:mx-0 sm:mt-0 lg:-start-14">
            <Image
              src="/images/partners/ncsf-seal.png"
              alt={t("site.ncsfSealAlt")}
              width={96}
              height={96}
              className="size-12 shrink-0"
            />
            <div className="min-w-0">
              <p className="font-heading text-[14px] leading-tight font-semibold text-ink">{t("landing.heroSealTitle")}</p>
              <p className="mt-0.5 text-[12px] leading-snug text-body">{t("landing.heroSealBody")}</p>
            </div>
          </div>

          <dl className="relative mx-auto mt-3 grid w-fit grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/15 shadow-lift ring-1 ring-white/15 backdrop-blur-md sm:absolute sm:-end-8 sm:bottom-[9%] sm:mx-0 sm:mt-0">
            <div className="bg-deep-2/80 px-4 py-3">
              <dd className="font-heading text-3xl font-bold text-accent" dir="ltr">
                {number(certificationCount)}
              </dd>
              <dt className="mt-1 text-[12px] leading-tight text-white/70">{t("landing.heroCountCerts")}</dt>
            </div>
            <div className="bg-deep-2/80 px-4 py-3">
              <dd className="font-heading text-3xl font-bold text-accent" dir="ltr">
                {number(specialisedCount)}
              </dd>
              <dt className="mt-1 text-[12px] leading-tight text-white/70">{t("landing.heroCountCourses")}</dt>
            </div>
          </dl>
        </div>
      </Container>
    </section>
  );
}

/**
 * RECOGNITION — the bodies behind the certificate, directly under the hero.
 * Logos sit in greyscale and take their colour on hover, so the row reads as
 * one quiet band rather than three competing brands.
 */
const LOGO_HEIGHT = { seal: "h-14", wordmark: "h-9", badge: "h-11" } as const;

function Recognition({ t }: { t: Translate }) {
  return (
    <section data-band aria-labelledby="home-recognition" className="border-b border-line bg-surface">
      <Container className="flex flex-col items-start gap-8 py-10 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl lg:max-w-sm">
          <p id="home-recognition" className="eyebrow">
            {t("landing.recognisedEyebrow")}
          </p>
          <p className="mt-2.5 text-[15px] leading-relaxed text-body">{t("landing.recognisedBody")}</p>
        </div>
        <ul className="flex flex-wrap items-center gap-x-8 gap-y-6">
          {accreditations.map((logo) => (
            <li key={logo.id}>
              <Image
                src={logo.src}
                alt={logo.altKey ? t(logo.altKey) : logo.alt}
                width={logo.width}
                height={logo.height}
                className={`${LOGO_HEIGHT[logo.shape]} w-auto opacity-75 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0`}
              />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/**
 * MEET JOFIT — the client's introduction film ("تعريف جو فت", 2026-10-12).
 *
 * The title, the lead and the four parts are the film's own words, so nothing
 * here says more than the film does. The chapter starts were read off the film
 * frame by frame; if the film is re-cut, re-read them.
 *
 * Three files, all cut from the client's 4K original (`/videos`):
 *   jofit-intro.mp4           the film, 720×1280 H.264 with faststart
 *   jofit-intro-poster.webp   its 34.5-second frame: the presenter and the logo
 *   jofit-intro-teaser.mp4    the silent seven-second trailer the frame loops
 *                             (+ `-teaser.webp`, its first frame)
 *
 * The film is spoken in Arabic, which the English badge says.
 */
const INTRO_DURATION = 39;

function Intro({ locale, t }: { locale: Locale; t: Translate }) {
  return (
    <Section tone="muted" labelledBy="home-intro" className="overflow-hidden">
      <IntroVideo
        head={<SectionHead id="home-intro" eyebrow={t("landing.introEyebrow")} title={t("landing.introTitle")} lead={t("landing.introLead")} />}
        film="/videos/jofit-intro.mp4"
        poster="/videos/jofit-intro-poster.webp"
        trailer="/videos/jofit-intro-teaser.mp4"
        trailerPoster="/videos/jofit-intro-teaser.webp"
        duration={INTRO_DURATION}
        chapters={[
          { start: 0, title: t("landing.introChapter1Title"), body: t("landing.introChapter1Body") },
          { start: 7, title: t("landing.introChapter2Title"), body: t("landing.introChapter2Body") },
          { start: 13, title: t("landing.introChapter3Title"), body: t("landing.introChapter3Body") },
          { start: 25, title: t("landing.introChapter4Title"), body: t("landing.introChapter4Body") },
        ]}
        browseHref={localePath(locale, "/education")}
        contactHref={localePath(locale, "/contact")}
        copy={{
          watch: t("landing.introPlay"),
          badge: t("landing.introBadge"),
          sealAlt: t("site.ncsfSealAlt"),
          sealTitle: t("landing.introChapter2Title"),
          sealBody: t("landing.heroSealBody"),
          dialog: t("landing.introDialog"),
          eyebrow: t("landing.introEyebrow"),
          close: t("landing.introClose"),
          play: t("landing.introResume"),
          pause: t("landing.introPause"),
          mute: t("landing.introMute"),
          unmute: t("landing.introUnmute"),
          fullscreen: t("landing.introFullscreen"),
          timeline: t("landing.introTimeline"),
          chapters: t("landing.introChapters"),
          chapterPlay: t("landing.introChapterPlay"),
          replay: t("landing.introReplay"),
          endTitle: t("landing.introEndTitle"),
          endBody: t("landing.introEndBody"),
          browse: t("landing.heroPrimary"),
          contact: t("landing.heroSecondary"),
        }}
      />
    </Section>
  );
}

/**
 * ONE PROGRAMME, AS A TILE.
 *
 * The client's photograph fills it, under a deep wash that rises from the foot
 * so the text always sits on dark; the number is set in gold at the head, the
 * way the client numbered them. Its name is in the page's language only. A programme without a photograph would take the action
 * green with the linework and the rosette, as its course cover does. The whole
 * tile is one link (the title's `::after`).
 */
function ProgrammeTile({
  course,
  index,
  locale,
  t,
  priority,
}: {
  course: Course;
  index: number;
  locale: Locale;
  t: Translate;
  priority: boolean;
}) {
  const { number } = getFormatters(locale);
  const image = course.media.find((entry) => entry.kind === "image");

  return (
    <article className="group relative isolate flex min-h-[28rem] w-full flex-col justify-end overflow-hidden rounded-3xl bg-deep text-white shadow-soft transition-[transform,box-shadow] duration-500 focus-within:ring-2 focus-within:ring-accent hover:-translate-y-1 hover:shadow-lift sm:min-h-[31rem]">
      {image ? (
        <Image
          src={image.url}
          alt=""
          fill
          priority={priority}
          sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
          className="-z-20 object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.06]"
        />
      ) : (
        <span aria-hidden="true" className="absolute inset-0 -z-20 bg-primary">
          <span className="pattern-waves absolute inset-0 text-white/[0.08]" />
          <span className="absolute -end-24 -top-20 size-96 text-white/20 transition-transform duration-[1.4s] ease-out group-hover:rotate-45">
            <Rosette className="size-full" />
          </span>
        </span>
      )}
      {/* The wash sits under the text only: the photograph keeps its own
          colour above it. (A photo drowned in green is the look the client
          turned down.) A lighter, neutral one at the head holds the gold
          number on a bright photo — the Reformer studio is nearly white. */}
      <span
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-linear-to-t from-deep from-15% via-deep/75 via-50% to-transparent to-80%"
      />
      <span aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-1/3 bg-linear-to-b from-black/45 to-transparent" />
      <span
        aria-hidden="true"
        className="absolute inset-3 rounded-[1.25rem] border border-white/15 transition-colors duration-500 group-hover:border-accent/60"
      />
      <span aria-hidden="true" className="absolute start-8 top-7 font-heading text-[2.75rem] leading-none font-bold text-accent" dir="ltr">
        {number(index + 1).padStart(2, "0")}
      </span>

      <div className="p-8 pt-28">
        <h3 className="text-[1.5rem] leading-snug text-white">
          <Link
            href={localePath(locale, `/education/courses/${course.slug}`)}
            className="outline-none after:absolute after:inset-0 after:rounded-3xl after:content-['']"
          >
            {course.title}
          </Link>
        </h3>
        {/* The client's whole sentence, never clipped: it is the description. */}
        <p className="mt-3 text-[14.5px] leading-relaxed text-white/80">{course.summary}</p>
        <span aria-hidden="true" className="mt-6 inline-flex items-center gap-2 text-[14px] font-semibold text-accent">
          {t("landing.programmeLink")}
          <span className="transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1">
            <ArrowIcon />
          </span>
        </span>
      </div>
    </article>
  );
}

/**
 * WHAT WE OFFER, AND WHO STANDS BEHIND IT.
 *
 * The client sent both as posters: "ماذا نقدم؟" with its three lines, and "تحت
 * إشراف وإدارة وكلاء NCSF في الأردن — م. محمد إبداح". Posters are pictures of
 * words — unreadable to a screen reader, untranslatable, blurry on a large
 * screen — so the words are set here as text, on the deep green and gold the
 * posters were designed in. Nothing is added to them.
 */
function Offer({ t }: { t: Translate }) {
  const items = [
    { text: t("landing.offer1"), icon: "certificate" as const },
    { text: t("landing.offer2"), icon: "workshop" as const },
    { text: t("landing.offer3"), icon: "lecture" as const },
  ];

  return (
    <Section tone="deep" labelledBy="home-offer">
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16">
        <div>
          <SectionHead id="home-offer" tone="dark" eyebrow={t("landing.offerEyebrow")} title={t("landing.offerTitle")} />
          <Reveal stagger as="ul" className="mt-10 space-y-4">
            {items.map((item, index) => (
              <li
                key={item.icon}
                className="flex items-center gap-5 rounded-3xl border border-white/10 bg-white/[0.04] p-5 transition-colors duration-300 hover:border-accent/40 hover:bg-white/[0.07] sm:p-6"
              >
                <span className="grid size-14 shrink-0 place-items-center rounded-full bg-accent/15 text-accent ring-1 ring-accent/30">
                  <OfferIcon kind={item.icon} />
                </span>
                <p className="min-w-0 flex-1 font-heading text-[1.1rem] leading-snug font-semibold text-white sm:text-[1.2rem]">
                  {item.text}
                </p>
                <span aria-hidden="true" className="font-heading text-[1.1rem] font-bold text-accent/45" dir="ltr">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </li>
            ))}
          </Reveal>
        </div>

        <Reveal>
          <figure className="relative isolate mx-auto max-w-[30rem] overflow-hidden rounded-[2rem] bg-deep-2 px-8 py-12 text-center shadow-lift ring-1 ring-accent/35 sm:px-12">
            <span aria-hidden="true" className="absolute start-1/2 top-1/2 -z-10 size-[34rem] -translate-x-1/2 -translate-y-1/2 text-accent/[0.12] rtl:translate-x-1/2">
              <Rosette className="spin-slow size-full" />
            </span>
            <span aria-hidden="true" className="absolute inset-3 rounded-[1.5rem] border border-accent/30" />

            <JofitLogo variant="full" className="jf-logo-lift mx-auto h-14 w-auto" />
            <p className="mt-9 font-heading text-[1.65rem] leading-[1.45] font-bold text-accent sm:text-[1.9rem]">
              {t("landing.supervisionLead")}
            </p>
            <span aria-hidden="true" className="mx-auto mt-7 flex max-w-[14rem] items-center gap-3 text-accent/70">
              <span className="h-px flex-1 bg-current" />
              <span className="size-2 rotate-45 border border-current" />
              <span className="h-px flex-1 bg-current" />
            </span>
            <figcaption className="mt-6 font-heading text-[1.2rem] font-semibold text-white">{t("landing.supervisionName")}</figcaption>
            <Image
              src="/images/partners/ncsf-seal.png"
              alt={t("site.ncsfSealAlt")}
              width={96}
              height={96}
              className="mx-auto mt-8 size-16 rounded-full bg-white p-1 shadow-soft"
            />
          </figure>
        </Reveal>
      </div>
    </Section>
  );
}

function OfferIcon({ kind }: { kind: "certificate" | "workshop" | "lecture" }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {kind === "certificate" ? (
        <>
          <rect x="3" y="4" width="18" height="12" rx="1.5" />
          <path d="M7 8h10M7 11h6" />
          <circle cx="16.5" cy="16.5" r="2.5" />
          <path d="m15.2 18.6-.7 3.4 2-1 2 1-.7-3.4" />
        </>
      ) : kind === "workshop" ? (
        <>
          <rect x="3" y="7" width="18" height="12" rx="2" />
          <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 12.5h18M11 12.5v2h2v-2" />
        </>
      ) : (
        <>
          <rect x="3" y="3.5" width="18" height="11" rx="1.5" />
          <path d="M7 8h6M7 11h4M12 14.5V18M8 21l4-3 4 3" />
        </>
      )}
    </svg>
  );
}

/**
 * WHY JOFIT — four facts beside a certificate.
 *
 * The certificate is an ILLUSTRATION, drawn in CSS: paper, a double gold rule,
 * the rosette as a watermark, and the council's seal as the issuer. It carries
 * no name and no number, because it is not anyone's certificate — it is what
 * the course leads to.
 */
function Why({ t }: { t: Translate }) {
  const points = [
    { title: t("landing.why1Title"), body: t("landing.why1Body"), icon: "agent" as const },
    { title: t("landing.why2Title"), body: t("landing.why2Body"), icon: "globe" as const },
    { title: t("landing.why3Title"), body: t("landing.why3Body"), icon: "book" as const },
    { title: t("landing.why4Title"), body: t("landing.why4Body"), icon: "path" as const },
  ];

  return (
    <Section tone="muted" labelledBy="home-why">
      <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div>
          <SectionHead id="home-why" eyebrow={t("landing.whyEyebrow")} title={t("landing.whyTitle")} lead={t("landing.whyLead")} />
          <Reveal stagger as="ul" className="mt-10 grid gap-5 sm:grid-cols-2">
            {points.map((point) => (
              <li key={point.title} className="rounded-3xl border border-line bg-surface p-6 shadow-soft">
                <span className="grid size-14 place-items-center rounded-full bg-primary-05 text-primary ring-1 ring-primary/15 ring-offset-4 ring-offset-surface">
                  <WhyIcon kind={point.icon} />
                </span>
                <h3 className="mt-5 text-[1.05rem] leading-snug">{point.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-body">{point.body}</p>
              </li>
            ))}
          </Reveal>
        </div>

        <Reveal>
          <Certificate t={t} />
        </Reveal>
      </div>
    </Section>
  );
}

function Certificate({ t }: { t: Translate }) {
  return (
    <figure className="relative mx-auto max-w-[27rem] lg:rotate-[-2deg]">
      <span aria-hidden="true" className="absolute inset-0 translate-x-4 translate-y-4 rounded-[1.75rem] bg-primary/15 rtl:-translate-x-4" />
      <div className="relative isolate overflow-hidden rounded-[1.75rem] bg-[color-mix(in_srgb,var(--color-surface)_94%,var(--color-accent))] px-8 pt-10 pb-8 text-center shadow-lift ring-1 ring-accent/30">
        <span aria-hidden="true" className="absolute start-1/2 top-1/2 -z-10 size-[26rem] -translate-x-1/2 -translate-y-1/2 text-accent/[0.16] rtl:translate-x-1/2">
          <Rosette className="size-full" />
        </span>
        <span aria-hidden="true" className="absolute inset-3 rounded-[1.25rem] border-2 border-accent/45" />
        <span aria-hidden="true" className="absolute inset-[1.15rem] rounded-2xl border border-accent/30" />

        <JofitLogo variant="mark" className="mx-auto h-10 w-auto" />
        <p className="mt-5 text-[12px] font-semibold tracking-wide text-accent-strong">{t("landing.certificateKicker")}</p>
        <p className="mt-2 font-heading text-[1.6rem] leading-tight font-bold text-ink">{t("landing.certificateTitle")}</p>

        <div aria-hidden="true" className="mx-auto mt-7 space-y-2.5">
          <span className="mx-auto block h-px w-3/4 bg-ink/15" />
          <span className="mx-auto block h-px w-1/2 bg-ink/10" />
        </div>

        <p className="mx-auto mt-6 max-w-[16rem] text-[13px] leading-relaxed text-body">{t("landing.certificateIssuer")}</p>

        <div className="mt-7 flex items-end justify-between">
          <span aria-hidden="true" className="block h-px w-24 bg-ink/20" />
          <Image
            src="/images/partners/ncsf-seal.png"
            alt={t("site.ncsfSealAlt")}
            width={96}
            height={96}
            className="size-20 drop-shadow-[0_6px_14px_rgb(0_0_0/0.18)]"
          />
          <span aria-hidden="true" className="block h-px w-24 bg-ink/20" />
        </div>
      </div>
      <figcaption className="sr-only">{t("landing.certificateIssuer")}</figcaption>
    </figure>
  );
}

function WhyIcon({ kind }: { kind: "agent" | "globe" | "book" | "path" }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {kind === "agent" ? (
        <>
          <circle cx="12" cy="10" r="6" />
          <path d="m9.5 10 1.8 1.8L15 8.2" />
          <path d="m8.2 14.8-1.4 6.2L12 18.8l5.2 2.2-1.4-6.2" />
        </>
      ) : kind === "globe" ? (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" />
        </>
      ) : kind === "book" ? (
        <>
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z" />
          <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5A2.5 2.5 0 0 1 4 20.5ZM9 8h7M9 11.5h5" />
        </>
      ) : (
        <>
          <circle cx="5.5" cy="18.5" r="2" />
          <circle cx="18.5" cy="5.5" r="2" />
          <path d="M7.5 18.5H15a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h7.5" />
        </>
      )}
    </svg>
  );
}
