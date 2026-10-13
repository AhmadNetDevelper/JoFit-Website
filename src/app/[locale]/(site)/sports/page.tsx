import Image from "next/image";
import Link from "next/link";

import { ArrowIcon, buttonClasses, HeroFacts, PageHero, Reveal, Rosette, Section, SectionHead } from "@/components/ui";
import { coachesService } from "@/features/coaches";
import { educationService } from "@/features/education";
import { rentalService } from "@/features/rental";
import { shopService } from "@/features/shop";
import { sportsService } from "@/features/sports";
import { getFormatters, getTranslator, localePath, resolveLocale } from "@/i18n";
import { buildMetadata } from "@/lib";

import { HelpBand } from "../_components/help-band";
import { BagIcon, CalendarIcon, CapIcon, SportGlyph, WhistleIcon } from "./_components/icons";

export async function generateMetadata({ params }: PageProps<"/[locale]/sports">) {
  const locale = resolveLocale((await params).locale);
  const t = getTranslator(locale);
  return buildMetadata({
    locale,
    path: "/sports",
    title: t("sports.title"),
    description: t("sports.description"),
  });
}

/**
 * SPORT IS THE SITE'S CROSS-CUTTING AXIS — the formal listing recipe, where
 * every card is a DOOR rather than a product.
 *
 *   PageHero   what the page is for; four figures COUNTED from the catalogues
 *   doors      one card per sport: its glyph in an icon well, its line, and the
 *              four counts behind the door — kit, hire, coaches, courses
 *   ways       what a sport opens onto, on the deep band with gold seals
 *   help       the closing band
 *
 * Every other index answers "what do you sell" — this one answers "what do I
 * play", which is the question a visitor actually arrives with. So each card
 * has to show that choosing a sport gets you kit AND a court AND a coach AND a
 * qualification.
 *
 * ---------------------------------------------------------------------------
 * WHY FOUR CALLS AND NOT FORTY-FOUR.
 *
 * Eleven sports times four domains is forty-four queries to put a count on
 * every card. Instead each domain is asked once for its whole catalogue and the
 * totals are tallied here by sport id — which is what an HTTP adapter would
 * have to do too, since no backend exposes "count everything grouped by a
 * taxonomy that four services share".
 */
export default async function SportsPage({ params }: PageProps<"/[locale]/sports">) {
  const locale = resolveLocale(await params.then((p) => p.locale));
  const t = getTranslator(locale);
  const { number } = getFormatters(locale);

  const [sports, products, rentals, coaches, courses] = await Promise.all([
    sportsService.list({ locale }),
    shopService.listProducts({ locale, pageSize: 200 }),
    rentalService.listItems({ locale, pageSize: 200 }),
    coachesService.listCoaches({ locale, pageSize: 200 }),
    educationService.listCourses({ locale, pageSize: 200 }),
  ]);

  /** How many of each domain mention a given sport. */
  function tally(items: readonly { sportIds: readonly string[] }[]) {
    const counts = new Map<string, number>();
    for (const item of items) {
      for (const id of item.sportIds) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return counts;
  }

  const byProduct = tally(products.items);
  const byRental = tally(rentals.items);
  const byCoach = tally(coaches.items);
  const byCourse = tally(courses.items);

  const rows = sports.map((sport) => ({
    sport,
    counts: [
      { value: byCourse.get(sport.id) ?? 0, label: t("sports.courses") },
      { value: byCoach.get(sport.id) ?? 0, label: t("sports.coaches") },
      { value: byProduct.get(sport.id) ?? 0, label: t("sports.equipment") },
      { value: byRental.get(sport.id) ?? 0, label: t("sports.rentals") },
    ],
  }));

  /*
   * PHOTOGRAPHS, WHEN THERE ARE ANY.
   *
   * A sport carries a photo only once staff upload one (`Sport.image`). The
   * moment any sport has one, EVERY card grows the same framed plate — the
   * others get the drawn plate in it — because a grid where one card is 200px
   * taller than its neighbours is a broken grid. With none, the cards are the
   * icon-well doors alone.
   */
  const withPhotos = sports.some((sport) => sport.image);

  const ways = [
    { icon: <CapIcon size={24} />, title: t("sports.wayCourse"), body: t("sports.wayCourseBody") },
    { icon: <WhistleIcon size={24} />, title: t("sports.wayCoach"), body: t("sports.wayCoachBody") },
    { icon: <BagIcon size={24} />, title: t("sports.wayShop"), body: t("sports.wayShopBody") },
    { icon: <CalendarIcon size={24} />, title: t("sports.wayRental"), body: t("sports.wayRentalBody") },
  ];

  return (
    <>
      <PageHero
        breadcrumbLabel={t("site.breadcrumb")}
        breadcrumbs={[{ label: t("nav.home"), href: localePath(locale, "/") }, { label: t("sports.title") }]}
        eyebrow={t("sports.eyebrow")}
        title={t("sports.heroTitle")}
        lead={t("sports.heroLead")}
      >
        <HeroFacts
          items={[
            { label: t("sports.statSports"), value: <span dir="ltr">{number(sports.length)}</span> },
            { label: t("sports.courses"), value: <span dir="ltr">{number(courses.meta.totalItems)}</span> },
            { label: t("sports.coaches"), value: <span dir="ltr">{number(coaches.meta.totalItems)}</span> },
            { label: t("sports.equipment"), value: <span dir="ltr">{number(products.meta.totalItems)}</span> },
          ]}
        />
      </PageHero>

      <Section tone="muted" labelledBy="sports-doors">
        <h2 id="sports-doors" className="sr-only">
          {t("sports.title")}
        </h2>

        <Reveal stagger as="ul" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map(({ sport, counts }) => (
            <li key={sport.id} className="flex">
              <article
                className={`group relative flex h-full w-full flex-col rounded-3xl border border-line bg-surface shadow-soft transition-[transform,box-shadow,border-color] duration-300 focus-within:border-primary/40 hover:-translate-y-1 hover:border-primary/25 hover:shadow-lift ${withPhotos ? "p-3" : "p-6 sm:p-7"}`}
              >
                {withPhotos ? (
                  /* The framed plate: the sport's photograph when staff have
                     uploaded one, otherwise the drawn plate — the rosette behind
                     the glyph, on the canvas. */
                  <div className="relative aspect-[16/9] shrink-0 overflow-hidden rounded-2xl bg-canvas">
                    {sport.image ? (
                      <Image
                        src={sport.image.url}
                        alt={sport.image.alt}
                        fill
                        sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
                        className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                      />
                    ) : (
                      <span aria-hidden="true" className="absolute inset-0 isolate grid place-items-center">
                        <span className="pattern-waves absolute inset-0 -z-10 text-primary/[0.045]" />
                        <span className="absolute start-1/2 top-1/2 -z-10 aspect-square h-[120%] -translate-x-1/2 -translate-y-1/2 text-accent/[0.16] rtl:translate-x-1/2">
                          <Rosette className="size-full" />
                        </span>
                        <span className="grid place-items-center rounded-full bg-surface p-5 text-primary shadow-soft ring-1 ring-primary/15">
                          <SportGlyph iconKey={sport.iconKey} size={40} />
                        </span>
                      </span>
                    )}
                  </div>
                ) : null}

                <div className={withPhotos ? "flex flex-1 flex-col px-3 pt-5 pb-3" : "contents"}>
                  {/* The featured mark rides in the header row beside the well, so
                      a card without one keeps the same title height. */}
                  <div className="flex items-center gap-4">
                    <span
                      aria-hidden="true"
                      className="grid size-14 shrink-0 place-items-center rounded-full bg-primary-05 text-primary ring-1 ring-primary/15 ring-offset-4 ring-offset-surface"
                    >
                      <SportGlyph iconKey={sport.iconKey} size={28} />
                    </span>
                    {sport.isFeatured ? (
                      <span className="rounded-full bg-accent-10 px-2.5 py-1 text-[12px] font-semibold text-accent-strong ring-1 ring-accent/25">
                        {t("sports.featured")}
                      </span>
                    ) : null}
                    <span
                      aria-hidden="true"
                      className="ms-auto grid size-10 shrink-0 place-items-center rounded-full border border-line text-primary transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-on-primary"
                    >
                      <ArrowIcon />
                    </span>
                  </div>

                  <h3 className="mt-6 text-[1.25rem] leading-snug">
                    <Link
                      href={localePath(locale, `/sports/${sport.slug}`)}
                      className="after:absolute after:inset-0 after:rounded-3xl after:content-['']"
                    >
                      {sport.name}
                    </Link>
                  </h3>

                  {/* Two lines reserved where cards share a row, so the count strips
                      line up; a phone's single column has nothing to line up with. */}
                  <p className="mt-2 line-clamp-2 text-[14px] sm:min-h-[2.9rem] leading-relaxed text-body">
                    {sport.description}
                  </p>

                  {/*
                    THE COUNTS ARE THE POINT OF THE CARD: a sport with "4 courses,
                    3 coaches, 9 products, 2 courts" is a door with the room
                    visible through it. A zero is shown rather than hidden — it is
                    information, and a strip that changes length breaks the grid.
                    Each is a figure over a bare noun, for Arabic agreement.
                  */}
                  <div className="mt-auto pt-6">
                    <dl className="grid grid-cols-4 gap-px overflow-hidden rounded-2xl bg-line ring-1 ring-line">
                      {counts.map((entry) => (
                        <div key={entry.label} className="flex flex-col bg-canvas px-1.5 py-3 text-center">
                          <dt
                            className={`order-2 mt-1 truncate text-[11.5px] ${entry.value === 0 ? "text-body/45" : "text-body"}`}
                          >
                            {entry.label}
                          </dt>
                          <dd
                            className={`order-1 font-heading text-[1.15rem] leading-none font-bold ${entry.value === 0 ? "text-body/35" : "text-ink"}`}
                          >
                            <span dir="ltr">{number(entry.value)}</span>
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </Reveal>

        {/* The way out for the reader whose sport is not on the list. */}
        <div className="mt-12 flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-center sm:gap-6">
          <p className="text-[15px] text-body">
            <span id="sports-cta" className="font-heading font-semibold text-ink">
              {t("sports.ctaTitle")}
            </span>{" "}
            {t("sports.ctaBody")}
          </p>
          <Link
            href={localePath(locale, "/contact")}
            aria-describedby="sports-cta"
            className={buttonClasses({ variant: "outline" })}
          >
            {t("sports.ctaAction")}
          </Link>
        </div>
      </Section>

      {/*
        WHAT A SPORT OPENS ONTO — unnumbered, because these are four doors and
        not four steps, so the seals carry an icon where the path's carry a
        figure. The qualification first: it is what this site exists to sell.
      */}
      <Section tone="deep" labelledBy="sports-ways">
        <SectionHead id="sports-ways" tone="dark" align="center" title={t("sports.waysTitle")} lead={t("sports.waysLead")} />
        <Reveal stagger as="ul" className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {ways.map((way) => (
            <li key={way.title} className="text-center">
              <span
                aria-hidden="true"
                className="mx-auto grid size-16 place-items-center rounded-full bg-deep-2 text-accent ring-1 ring-accent/50 ring-offset-4 ring-offset-deep"
              >
                {way.icon}
              </span>
              <h3 className="mt-6 text-[1.2rem] text-white">{way.title}</h3>
              <p className="mx-auto mt-2.5 max-w-[30ch] text-[14.5px] leading-relaxed text-white/65">{way.body}</p>
            </li>
          ))}
        </Reveal>
      </Section>

      <HelpBand locale={locale} />
    </>
  );
}
