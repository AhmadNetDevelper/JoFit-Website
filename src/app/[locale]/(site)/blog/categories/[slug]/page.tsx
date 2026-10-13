import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonClasses, PageHero, Reveal, Section } from "@/components/ui";
import { contentService } from "@/features/content";
import { getFormatters, getTranslator, localePath, resolveLocale } from "@/i18n";
import { breadcrumbJsonLd, jsonLdScriptProps, metadataFromSeo } from "@/lib";

import { HelpBand } from "../../../_components/help-band";
import { ArticleCard } from "../../_components/article-card";
import { JournalRail } from "../../_components/journal-rail";

export async function generateMetadata({ params }: PageProps<"/[locale]/blog/categories/[slug]">) {
  const { locale: raw, slug } = await params;
  const locale = resolveLocale(raw);
  const category = await contentService.getCategoryBySlug(slug, locale);
  if (!category) return metadataFromSeo(undefined, { locale, title: "Not found", noIndex: true });

  return metadataFromSeo(category.seo, {
    locale,
    title: category.name,
    description: category.description,
    path: `/blog/categories/${category.slug}`,
  });
}

/**
 * A JOURNAL CATEGORY — the index narrowed to one subject, with the same rail
 * (this category pressed), the same cards and the same closing band, so the
 * two read as one journal with a filter changed.
 */
export default async function BlogCategoryPage({ params }: PageProps<"/[locale]/blog/categories/[slug]">) {
  const { locale: raw, slug } = await params;
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);
  const { number } = getFormatters(locale);

  const category = await contentService.getCategoryBySlug(slug, locale);
  if (!category) notFound();

  const [result, categories] = await Promise.all([
    contentService.listArticles({ locale, categorySlugs: [category.slug] }),
    contentService.listCategories(locale),
  ]);

  return (
    <>
      <script
        {...jsonLdScriptProps(
          breadcrumbJsonLd(locale, [
            { name: t("site.name"), path: "/" },
            { name: t("blog.title"), path: "/blog" },
            { name: category.name, path: `/blog/categories/${category.slug}` },
          ]),
        )}
      />

      <PageHero
        breadcrumbLabel={t("site.breadcrumb")}
        breadcrumbs={[
          { label: t("nav.home"), href: localePath(locale, "/") },
          { label: t("blog.title"), href: localePath(locale, "/blog") },
          { label: category.name },
        ]}
        eyebrow={t("blog.categories")}
        title={category.name}
        lead={category.description}
      />

      <div data-band>
        <JournalRail
          locale={locale}
          t={t}
          categories={categories}
          activeSlugs={[category.slug]}
          shown={number(result.items.length)}
          total={number(result.meta.totalItems)}
        />
      </div>

      <Section tone="muted" className="pt-10 sm:pt-12 lg:pt-14">
        <h2 className="sr-only">{category.name}</h2>
        {result.items.length === 0 ? (
          <div className="mx-auto max-w-xl rounded-3xl border border-line bg-surface px-6 py-16 text-center shadow-soft">
            <p className="font-heading text-[1.4rem] font-bold text-ink">{t("blog.emptyCategory")}</p>
            <Link href={localePath(locale, "/blog")} className={buttonClasses({ className: "mt-8" })}>
              {t("article.allArticles")}
            </Link>
          </div>
        ) : (
          <Reveal stagger as="ul" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((article) => (
              <li key={article.id} className="flex">
                <ArticleCard article={article} locale={locale} t={t} />
              </li>
            ))}
          </Reveal>
        )}
      </Section>

      <HelpBand locale={locale} />
    </>
  );
}
