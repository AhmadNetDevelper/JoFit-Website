import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonClasses, PageHero, Reveal, Section, SectionHead } from "@/components/ui";
import { contentService, type Author } from "@/features/content";
import { LOCALE_HREFLANG, getFormatters, getTranslator, localePath, resolveLocale } from "@/i18n";
import { breadcrumbJsonLd, jsonLdScriptProps, metadataFromSeo } from "@/lib";
import type { MediaImage } from "@/types";

import { HelpBand } from "../../_components/help-band";
import { UserIcon } from "../../coaches/_components/icons";
import { ArticleCard } from "../_components/article-card";

export async function generateMetadata({ params }: PageProps<"/[locale]/blog/[slug]">) {
  const { locale: raw, slug } = await params;
  const locale = resolveLocale(raw);
  const article = await contentService.getArticleBySlug(slug, locale);
  if (!article) return metadataFromSeo(undefined, { locale, title: "Not found", noIndex: true });

  return metadataFromSeo(article.seo, {
    locale,
    title: article.title,
    description: article.excerpt,
    path: `/blog/${article.slug}`,
    type: "article",
    imageUrl: article.coverImage?.url,
    publishedTime: article.publishedAt,
    modifiedTime: article.updatedAt,
  });
}

/*
 * Some article fixtures have pointed their covers at a grey SVG with the words
 * "article placeholder" printed on it. Framed in the hero it would read as a
 * broken page, so it is treated as no cover. A cover staff upload is a real
 * photograph and is shown.
 */
const PLACEHOLDER = /\/images\/placeholder-[a-z]+\.svg$/;

function realCover(image: MediaImage | undefined): MediaImage | undefined {
  return image && !PLACEHOLDER.test(image.url) ? image : undefined;
}

/**
 * The author's picture, round like every portrait in the formal design. With
 * no avatar on file it is a glyph in the brand colour — never an empty box, and
 * never a broken image.
 */
function AuthorAvatar({ author, size }: { author: Author | null; size: "sm" | "lg" }) {
  const box = size === "sm" ? "size-12" : "size-16";
  if (author?.avatar) {
    return (
      <span className={`relative ${box} shrink-0 overflow-hidden rounded-full bg-canvas ring-2 ring-accent/40`}>
        <Image src={author.avatar.url} alt={author.avatar.alt} fill sizes="64px" className="object-cover object-center" />
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`grid ${box} shrink-0 place-items-center rounded-full bg-primary text-on-primary ring-2 ring-accent/40`}
    >
      <UserIcon size={size === "sm" ? 20 : 26} />
    </span>
  );
}

/**
 * AN ARTICLE — the formal design's detail page, for the journal.
 *
 *   PageHero   category, title, excerpt and the BYLINE — who wrote it, their
 *              picture, when, how long it takes; the article's cover, when it
 *              has a real one, framed in the end column
 *   body       the text at a reading measure, beside a sticky card about the
 *              author and the way back to the journal
 *   related    what to read next, as the journal's own cards
 *   help       the closing band
 *
 * The byline is three separate runs rather than one joined string. Joined, a
 * Latin author name, a date and an Arabic reading time sat in one bidi run and
 * came out as "12 · 2026/08/Nadia Khoury"; apart, each keeps its own order.
 *
 * `body` is shown with its line breaks kept and nothing else: how rich text is
 * rendered is an open decision that belongs to the CMS (`features/content`),
 * and this page does not pre-empt it.
 */
export default async function ArticlePage({ params }: PageProps<"/[locale]/blog/[slug]">) {
  const { locale: raw, slug } = await params;
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);
  const { date, number } = getFormatters(locale);

  const article = await contentService.getArticleBySlug(slug, locale);
  if (!article) notFound();

  const [author, related, categories] = await Promise.all([
    contentService.getAuthorById(article.authorId, locale),
    contentService.listRelatedArticles(article.id, locale),
    contentService.listCategories(locale),
  ]);

  const cover = realCover(article.coverImage);
  const category = categories.find((entry) => article.categoryIds.includes(entry.id));
  const readingTime = t("blog.readingTime", { minutes: number(article.readingMinutes) });

  return (
    <>
      {/* Structured data is built per entity by the domain that owns it. */}
      <script
        {...jsonLdScriptProps({
          "@context": "https://schema.org",
          "@type": "Article",
          inLanguage: LOCALE_HREFLANG[locale],
          headline: article.title,
          description: article.excerpt,
          datePublished: article.publishedAt,
          dateModified: article.updatedAt ?? article.publishedAt,
          author: author ? { "@type": "Person", name: author.name } : undefined,
        })}
      />
      <script
        {...jsonLdScriptProps(
          breadcrumbJsonLd(locale, [
            { name: t("site.name"), path: "/" },
            { name: t("blog.title"), path: "/blog" },
            { name: article.title, path: `/blog/${article.slug}` },
          ]),
        )}
      />

      <PageHero
        breadcrumbLabel={t("site.breadcrumb")}
        breadcrumbs={[
          { label: t("nav.home"), href: localePath(locale, "/") },
          { label: t("blog.title"), href: localePath(locale, "/blog") },
          ...(category ? [{ label: category.name, href: localePath(locale, `/blog/categories/${category.slug}`) }] : []),
          { label: article.title },
        ]}
        eyebrow={category?.name}
        title={article.title}
        lead={article.excerpt}
        aside={
          cover ? (
            <div className="relative mx-auto aspect-4/3 w-full max-w-[30rem] overflow-hidden rounded-3xl ring-1 ring-white/15 shadow-lift">
              <Image src={cover.url} alt={cover.alt ?? ""} fill priority sizes="(min-width: 1024px) 480px, 100vw" className="object-cover" />
              <span aria-hidden="true" className="absolute inset-3 rounded-2xl border border-accent/40" />
            </div>
          ) : undefined
        }
      >
        {/* THE BYLINE. The name is a proper noun, rendered as written. */}
        <div className="inline-flex max-w-full items-center gap-4 rounded-2xl bg-white/6 py-3 ps-3 pe-6 ring-1 ring-white/10 backdrop-blur-sm">
          <AuthorAvatar author={author} size="sm" />
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-white" dir="auto">
              {author?.name ?? t("site.name")}
            </p>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[13px] text-white/60">
              <time dateTime={article.publishedAt}>{date(article.publishedAt)}</time>
              <span aria-hidden="true" className="size-1 rounded-full bg-accent" />
              <span>{readingTime}</span>
            </p>
          </div>
        </div>
      </PageHero>

      <Section labelledBy="article-body">
        <h2 id="article-body" className="sr-only">
          {article.title}
        </h2>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-20">
          <article className="max-w-[68ch]">
            <p className="text-[1.1rem] leading-[1.9] whitespace-pre-line text-body">
              {article.body}
            </p>
            <p className="mt-12 flex flex-wrap items-center gap-3 border-t border-line pt-6">
              <Link href={localePath(locale, "/blog")} className={buttonClasses({ variant: "outline", size: "sm" })}>
                {t("article.allArticles")}
              </Link>
              {category ? (
                <Link
                  href={localePath(locale, `/blog/categories/${category.slug}`)}
                  className="rounded-full bg-primary-05 px-3.5 py-1.5 text-[13px] font-medium text-primary-dark transition-colors hover:bg-primary hover:text-on-primary"
                >
                  {category.name}
                </Link>
              ) : null}
            </p>
          </article>

          {author ? (
            <aside
              aria-labelledby="article-author"
              className="h-fit rounded-3xl border border-line bg-canvas p-6 lg:sticky lg:top-28"
            >
              <p className="text-[12.5px] font-semibold text-accent-strong">{t("blog.byline")}</p>
              <div className="mt-4 flex items-center gap-4">
                <AuthorAvatar author={author} size="lg" />
                <h2 id="article-author" className="min-w-0 text-[1.05rem] leading-snug">
                  {t("article.aboutAuthor", { name: author.name })}
                </h2>
              </div>
              {author.bio ? <p className="mt-4 text-[14px] leading-relaxed text-body">{author.bio}</p> : null}
            </aside>
          ) : null}
        </div>
      </Section>

      {related.length > 0 ? (
        <Section tone="muted" labelledBy="related-articles">
          <SectionHead
            id="related-articles"
            eyebrow={t("landing.blogEyebrow")}
            title={t("blog.related")}
            actions={
              <Link href={localePath(locale, "/blog")} className={buttonClasses({ variant: "outline" })}>
                {t("article.allArticles")}
              </Link>
            }
          />
          <Reveal stagger as="ul" className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((entry) => (
              <li key={entry.id} className="flex">
                <ArticleCard article={entry} locale={locale} t={t} />
              </li>
            ))}
          </Reveal>
        </Section>
      ) : null}

      <HelpBand locale={locale} />
    </>
  );
}
