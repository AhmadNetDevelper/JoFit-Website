import Link from "next/link";

import { buttonClasses, HeroFacts, PageHero, Reveal, Section } from "@/components/ui";
import { contentService } from "@/features/content";
import { getFormatters, getTranslator, localePath, resolveLocale } from "@/i18n";
import {
  buildMetadata,
  buildQueryString,
  readNumberParam,
  readParam,
  readParams,
  resolveSearchParams,
} from "@/lib";

import { HelpBand } from "../_components/help-band";
import { ArticleCard } from "./_components/article-card";
import { JournalRail } from "./_components/journal-rail";

export async function generateMetadata({ params }: PageProps<"/[locale]/blog">) {
  const locale = resolveLocale((await params).locale);
  const t = getTranslator(locale);
  return buildMetadata({
    locale,
    path: "/blog",
    title: t("blog.title"),
    description: t("blog.description"),
  });
}

/**
 * THE JOURNAL — the formal design's listing page, for articles.
 *
 *   PageHero   the journal, with four figures COUNTED from every published
 *              article (not from the current search, which would be reporting
 *              the filter rather than the journal)
 *   rail       search, categories and the count, rising over the hero's foot
 *   grid       the journal's own article cards
 *   help       the closing band — a reader who got here from a training
 *              article is a reader who may want the course behind it
 *
 * Search, category and tag all live in the URL, so a search is shareable and
 * Back undoes it; the page renders on the server.
 */
export default async function BlogPage({ params, searchParams }: PageProps<"/[locale]/blog">) {
  const [{ locale: raw }, search] = await Promise.all([params, resolveSearchParams(searchParams)]);
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);
  const { date, number } = getFormatters(locale);

  const state = {
    q: readParam(search, "q"),
    categorySlugs: readParams(search, "category"),
    tagSlugs: readParams(search, "tag"),
  };

  const [result, everything, categories] = await Promise.all([
    contentService.listArticles({
      locale,
      search: state.q,
      page: readNumberParam(search, "page"),
      categorySlugs: state.categorySlugs,
      tagSlugs: state.tagSlugs,
    }),
    contentService.listArticles({ locale, pageSize: 200 }),
    contentService.listCategories(locale),
  ]);

  const latest = everything.items[0];
  const minutes = everything.items.reduce((sum, article) => sum + article.readingMinutes, 0);

  const pageLink = (target: number) =>
    `${localePath(locale, "/blog")}${buildQueryString({
      q: state.q,
      category: [...state.categorySlugs],
      tag: [...state.tagSlugs],
      page: target > 1 ? target : undefined,
    })}`;

  return (
    <>
      <PageHero
        breadcrumbLabel={t("site.breadcrumb")}
        breadcrumbs={[{ label: t("nav.home"), href: localePath(locale, "/") }, { label: t("blog.title") }]}
        eyebrow={t("landing.blogEyebrow")}
        title={t("landing.blogTitle")}
        lead={t("blog.description")}
      >
        <HeroFacts
          items={[
            { label: t("blog.statArticles"), value: <span dir="ltr">{number(everything.meta.totalItems)}</span> },
            { label: t("blog.statCategories"), value: <span dir="ltr">{number(categories.length)}</span> },
            { label: t("blog.statMinutes"), value: <span dir="ltr">{number(minutes)}</span> },
            /* A locale-formatted date: no `dir` (Arabic dates carry RTL marks). */
            { label: t("blog.statLatest"), value: latest ? date(latest.publishedAt) : "—" },
          ]}
        />
      </PageHero>

      <div data-band>
        <JournalRail
          locale={locale}
          t={t}
          categories={categories}
          activeSlugs={state.categorySlugs}
          search={state.q}
          tagSlugs={state.tagSlugs}
          shown={number(result.items.length)}
          total={number(result.meta.totalItems)}
        />
      </div>

      <Section tone="muted" className="pt-10 sm:pt-12 lg:pt-14">
        <h2 className="sr-only">{t("blog.title")}</h2>
        {result.items.length === 0 ? (
          <div className="mx-auto max-w-xl rounded-3xl border border-line bg-surface px-6 py-16 text-center shadow-soft">
            <span
              aria-hidden="true"
              className="mx-auto grid size-14 place-items-center rounded-full bg-primary-05 text-primary ring-1 ring-primary/15"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <circle cx="11" cy="11" r="6.5" />
                <path d="m16 16 4 4" />
              </svg>
            </span>
            <p className="mt-5 font-heading text-[1.4rem] font-bold text-ink">{t("blog.empty")}</p>
            <p className="mx-auto mt-3 max-w-[46ch] text-[15px] text-body">{t("blog.emptyBody")}</p>
            <Link href={localePath(locale, "/blog")} className={buttonClasses({ className: "mt-8" })}>
              {t("blog.clear")}
            </Link>
          </div>
        ) : (
          <>
            <Reveal stagger as="ul" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {result.items.map((article) => (
                <li key={article.id} className="flex">
                  <ArticleCard article={article} locale={locale} t={t} />
                </li>
              ))}
            </Reveal>

            {result.meta.totalPages > 1 ? (
              <nav aria-label={t("blog.title")} className="mt-12 flex items-center justify-center gap-2">
                {Array.from({ length: result.meta.totalPages }, (_, index) => index + 1).map((target) => {
                  const current = target === result.meta.page;
                  return (
                    <Link
                      key={target}
                      href={pageLink(target)}
                      aria-current={current ? "page" : undefined}
                      className={`inline-flex size-11 items-center justify-center rounded-full border text-[14px] font-semibold transition-colors ${
                        current
                          ? "border-primary bg-primary text-on-primary"
                          : "border-line bg-surface text-body hover:border-primary/40 hover:text-primary-dark"
                      }`}
                    >
                      <span dir="ltr">{number(target)}</span>
                    </Link>
                  );
                })}
              </nav>
            ) : null}
          </>
        )}
      </Section>

      <HelpBand locale={locale} />
    </>
  );
}
