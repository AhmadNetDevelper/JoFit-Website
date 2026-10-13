import Image from "next/image";
import Link from "next/link";

import { ArrowIcon, Rosette } from "@/components/ui";
import type { Article } from "@/features/content";
import { getFormatters, localePath, type Locale, type Translate } from "@/i18n";

/**
 * AN ARTICLE CARD — the journal's entry in the formal design.
 *
 * A framed cover (the article's photograph, or the certificate linework when it
 * has none), the date and reading time, the title and two lines of excerpt.
 * The whole card is one link through the title's `::after`.
 */
export function ArticleCard({ article, locale, t }: { article: Article; locale: Locale; t: Translate }) {
  const { date, number } = getFormatters(locale);
  const href = localePath(locale, `/blog/${article.slug}`);
  const image = article.coverImage;

  return (
    <article className="group relative flex h-full flex-col rounded-3xl border border-line bg-surface p-3 shadow-soft transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-lift">
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-deep">
        {image ? (
          <Image
            src={image.url}
            alt=""
            fill
            sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <span aria-hidden="true" className="absolute inset-0 grid place-items-center text-accent/25">
            <Rosette className="size-56" />
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-3 pt-5 pb-3">
        <p className="flex items-center gap-2 text-[12.5px] text-body/70">
          <time dateTime={article.publishedAt}>
            {date(article.publishedAt)}
          </time>
          <span aria-hidden="true" className="size-1 rounded-full bg-accent" />
          <span>
            <span dir="ltr">{number(article.readingMinutes)}</span> {t("landing.readingMinutes")}
          </span>
        </p>
        <h3 className="mt-3 line-clamp-2 text-[1.1rem] leading-snug">
          <Link href={href} className="after:absolute after:inset-0 after:rounded-3xl after:content-['']">
            {article.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-[14px] leading-relaxed text-body">{article.excerpt}</p>
        <span className="mt-auto inline-flex items-center gap-2 pt-5 text-[14px] font-semibold text-primary">
          {t("landing.readArticle")}
          <ArrowIcon size={14} />
        </span>
      </div>
    </article>
  );
}
