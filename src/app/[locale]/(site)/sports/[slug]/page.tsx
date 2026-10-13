import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowIcon, buttonClasses, HeroFacts, PageHero, Reveal, Section, SectionHead } from "@/components/ui";
import { coachesService } from "@/features/coaches";
import { educationService } from "@/features/education";
import { rentalService } from "@/features/rental";
import { shopService } from "@/features/shop";
import { sportsService } from "@/features/sports";
import { getFormatters, getTranslator, localePath, resolveLocale } from "@/i18n";
import { buildQueryString, metadataFromSeo } from "@/lib";

import { HelpBand } from "../../_components/help-band";
import { BagIcon, CalendarIcon, CapIcon, SportGlyph, WhistleIcon } from "../_components/icons";

export async function generateMetadata({ params }: PageProps<"/[locale]/sports/[slug]">) {
  const { locale: raw, slug } = await params;
  const locale = resolveLocale(raw);
  const sport = await sportsService.getBySlug(slug, locale);
  if (!sport) return metadataFromSeo(undefined, { locale, title: "Not found", noIndex: true });

  return metadataFromSeo(sport.seo, {
    locale,
    title: sport.name,
    description: sport.description,
    path: `/sports/${sport.slug}`,
  });
}

/**
 * ONE SPORT, AND EVERY WAY IN.
 *
 * A sport hub cuts across domains by passing one slug to four independent
 * services — the page that proves the sports taxonomy is genuinely shared
 * rather than duplicated per domain. On the formal recipe:
 *
 *   PageHero   the sport, its four totals COUNTED from the services, and in
 *              the end column its seal — or its photograph, once staff have
 *              uploaded one (`Sport.image`)
 *   doors      four panels (courses, coaches, kit, hire), each listing what
 *              is there and linking to that index already filtered to this
 *              sport, so "see all" lands on a real result set
 *   others     the other sports, as a row of pills
 *   help       the closing band
 *
 * Everything renders on the server; the route ships no JavaScript of its own
 * beyond the scroll reveal.
 */
export default async function SportPage({ params }: PageProps<"/[locale]/sports/[slug]">) {
  const { locale: raw, slug } = await params;
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);
  const { number } = getFormatters(locale);

  const sport = await sportsService.getBySlug(slug, locale);
  if (!sport) notFound();

  const [products, rentals, coaches, courses, sports] = await Promise.all([
    shopService.listProducts({ locale, sportSlugs: [sport.slug], pageSize: 4 }),
    rentalService.listItems({ locale, sportSlugs: [sport.slug], pageSize: 4 }),
    coachesService.listCoaches({ locale, sportSlugs: [sport.slug], pageSize: 4 }),
    educationService.listCourses({ locale, sportSlugs: [sport.slug], pageSize: 4 }),
    sportsService.list({ locale }),
  ]);

  /* `?sport=` is the filter every index reads, so each "see all" is one hop. */
  const filtered = (path: string) => `${localePath(locale, path)}${buildQueryString({ sport: [sport.slug] })}`;

  /* The qualification first: it is what this site exists to sell. */
  const sections = [
    {
      id: "sport-courses",
      heading: t("sports.courses"),
      icon: <CapIcon size={20} />,
      total: courses.meta.totalItems,
      all: filtered("/education"),
      items: courses.items.map((item) => ({
        id: item.id,
        title: item.title,
        line: item.summary,
        href: localePath(locale, `/education/courses/${item.slug}`),
      })),
    },
    {
      id: "sport-coaches",
      heading: t("sports.coaches"),
      icon: <WhistleIcon size={20} />,
      total: coaches.meta.totalItems,
      all: filtered("/coaches"),
      items: coaches.items.map((item) => ({
        id: item.id,
        title: item.name,
        line: item.headline,
        href: localePath(locale, `/coaches/${item.slug}`),
      })),
    },
    {
      id: "sport-products",
      heading: t("sports.equipment"),
      icon: <BagIcon size={20} />,
      total: products.meta.totalItems,
      all: filtered("/shop"),
      items: products.items.map((item) => ({
        id: item.id,
        title: item.title,
        line: item.summary,
        href: localePath(locale, `/shop/products/${item.slug}`),
      })),
    },
    {
      id: "sport-rentals",
      heading: t("sports.rentals"),
      icon: <CalendarIcon size={20} />,
      total: rentals.meta.totalItems,
      all: filtered("/rental"),
      items: rentals.items.map((item) => ({
        id: item.id,
        title: item.title,
        line: item.summary,
        href: localePath(locale, `/rental/items/${item.slug}`),
      })),
    },
  ];

  const others = sports.filter((entry) => entry.id !== sport.id);

  return (
    <>
      <PageHero
        breadcrumbLabel={t("site.breadcrumb")}
        breadcrumbs={[
          { label: t("nav.home"), href: localePath(locale, "/") },
          { label: t("sports.title"), href: localePath(locale, "/sports") },
          { label: sport.name },
        ]}
        eyebrow={t("sportDetail.eyebrow")}
        title={sport.name}
        lead={sport.description}
        aside={
          sport.image ? (
            <div className="rounded-3xl bg-white/[0.06] p-3 ring-1 ring-white/15 backdrop-blur">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                <Image
                  src={sport.image.url}
                  alt={sport.image.alt}
                  fill
                  priority
                  sizes="(min-width: 1024px) 440px, 100vw"
                  className="object-cover object-center"
                />
              </div>
            </div>
          ) : (
            /* The sport's seal: its glyph in gold inside two engraved rings — a
               medal, not a photograph. The hero's own rosette turns behind it,
               so it draws none of its own. Wide screens only; on a phone it
               would push the figures a screen further down. */
            <div aria-hidden="true" className="relative mx-auto grid aspect-square w-full max-w-[17rem] place-items-center max-lg:hidden">
              <span className="absolute inset-0 rounded-full border border-accent/25" />
              <span className="absolute inset-4 rounded-full border border-dashed border-accent/20" />
              <span className="relative grid size-[68%] place-items-center rounded-full bg-deep-2 text-accent shadow-lift ring-1 ring-accent/50 ring-offset-8 ring-offset-deep">
                <SportGlyph iconKey={sport.iconKey} size={84} />
              </span>
            </div>
          )
        }
      >
        {/* The four doors counted. A bare noun under each figure, and
            `dir="ltr"` on the figure alone (pitfalls #6, #9). */}
        <HeroFacts
          items={sections.map((section) => ({
            label: section.heading,
            value: <span dir="ltr">{number(section.total)}</span>,
          }))}
        />
      </PageHero>

      {/*
        THE FOUR DOORS. Every panel is drawn even when it is empty — "no coaches
        for this sport yet" is information, and a missing panel is not.
      */}
      <Section labelledBy="sport-ways">
        <SectionHead
          id="sport-ways"
          title={t("sportDetail.waysTitle", { sport: sport.name })}
          lead={t("sportDetail.waysLead")}
        />

        {/* `grid-cols-1`, not the implicit column: an implicit track is `auto`
            wide, and a truncated one-line title is as wide as its whole text —
            it pushed a phone's page 400px sideways. */}
        <Reveal stagger as="ul" className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {sections.map((section) => (
            <li key={section.id} className="flex min-w-0">
              <section
                aria-labelledby={section.id}
                className="flex h-full w-full min-w-0 flex-col rounded-3xl border border-line bg-surface p-6 shadow-soft sm:p-7"
              >
                <div className="flex items-center gap-4">
                  <span
                    aria-hidden="true"
                    className="grid size-12 shrink-0 place-items-center rounded-full bg-primary-05 text-primary ring-1 ring-primary/15"
                  >
                    {section.icon}
                  </span>
                  <h3 id={section.id} className="min-w-0 flex-1 text-[1.2rem] leading-snug">
                    {section.heading}
                  </h3>
                  <span className="shrink-0 rounded-full bg-canvas px-3 py-1 font-heading text-[14px] font-bold text-ink">
                    <span dir="ltr">{number(section.total)}</span>
                  </span>
                </div>

                {section.items.length > 0 ? (
                  <ul className="mt-6 divide-y divide-line border-y border-line">
                    {section.items.map((item) => (
                      <li key={item.id}>
                        <Link href={item.href} className="group/item flex items-center justify-between gap-4 py-3.5">
                          <span className="min-w-0">
                            <span className="block truncate text-[15px] font-semibold text-ink transition-colors group-hover/item:text-primary-dark">
                              {item.title}
                            </span>
                            <span className="mt-0.5 block truncate text-[13px] text-body/80">{item.line}</span>
                          </span>
                          <span className="grid size-8 shrink-0 place-items-center rounded-full text-primary transition-colors group-hover/item:bg-primary-05">
                            <ArrowIcon size={15} />
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-6 rounded-2xl bg-canvas px-5 py-6 text-[14px] text-body">{t("sportDetail.empty")}</p>
                )}

                {/* The footer sits on the panel's floor, so two panels in a row
                    end on one line whatever their lists do. */}
                <p className="mt-auto pt-6">
                  <Link
                    href={section.all}
                    aria-label={t("sportDetail.seeAllOf", { section: section.heading, sport: sport.name })}
                    className={buttonClasses({ variant: "soft", size: "sm" })}
                  >
                    {t("sportDetail.seeAll")}
                    <ArrowIcon size={14} />
                  </Link>
                </p>
              </section>
            </li>
          ))}
        </Reveal>
      </Section>

      {/* THE OTHER SPORTS — a row of names, not a grid: this page is one sport,
          and the way out is a rail of pills, each with its own glyph. */}
      {others.length > 0 ? (
        <Section tone="muted" labelledBy="sport-others">
          <SectionHead
            id="sport-others"
            title={t("sportDetail.othersTitle")}
            actions={
              <Link href={localePath(locale, "/sports")} className={buttonClasses({ variant: "outline" })}>
                {t("sportDetail.allSports")}
              </Link>
            }
          />
          <nav aria-labelledby="sport-others" className="mt-10">
            <ul className="flex flex-wrap gap-3">
              {others.map((entry) => (
                <li key={entry.id}>
                  <Link
                    href={localePath(locale, `/sports/${entry.slug}`)}
                    className="inline-flex items-center gap-2.5 rounded-full border border-line bg-surface py-2 ps-2 pe-4 text-[14px] font-medium text-ink shadow-soft transition-colors hover:border-primary/40 hover:text-primary-dark"
                  >
                    <span aria-hidden="true" className="grid size-8 place-items-center rounded-full bg-primary-05 text-primary">
                      <SportGlyph iconKey={entry.iconKey} size={18} />
                    </span>
                    {entry.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </Section>
      ) : null}

      <HelpBand locale={locale} />
    </>
  );
}
