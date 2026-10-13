import Link from "next/link";

import { buttonClasses, inputClasses } from "@/components/ui";
import type { ArticleCategory } from "@/features/content";
import { localePath, type Locale, type Translate } from "@/i18n";

/**
 * THE JOURNAL'S RAIL — the catalogue's filter panel, for articles.
 *
 * The same white panel rising over the hero's foot that the course catalogue
 * uses: a search box, the categories as pills, and the count. Shared by the
 * index and every category page, so moving between them feels like one page
 * with a filter changed rather than two pages.
 *
 * Every control is a link or a GET form; there is no state. The search always
 * goes to the index — it is the one place that searches — carrying the tags and
 * categories already in force as hidden fields, so searching never silently
 * clears them. No link carries `page`.
 */
const pill = (active: boolean) =>
  `inline-flex rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
    active
      ? "border-primary bg-primary text-on-primary"
      : "border-line bg-surface text-body hover:border-primary/40 hover:text-primary-dark"
  }`;

export function JournalRail({
  locale,
  t,
  categories,
  activeSlugs,
  search,
  tagSlugs = [],
  shown,
  total,
}: {
  locale: Locale;
  t: Translate;
  categories: readonly ArticleCategory[];
  /** The categories in force — the page's own on a category page. */
  activeSlugs: readonly string[];
  search?: string;
  tagSlugs?: readonly string[];
  /** Already formatted. */
  shown: string;
  total: string;
}) {
  const base = localePath(locale, "/blog");
  const filtered = Boolean(search) || activeSlugs.length > 0 || tagSlugs.length > 0;

  return (
    <section aria-label={t("blog.categories")} className="bg-canvas pb-2">
      <div className="mx-auto w-full max-w-page px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-8 rounded-3xl border border-line bg-surface p-5 shadow-lift sm:p-7 lg:-mt-10">
          <form action={base} method="get" className="flex flex-wrap items-center gap-3">
            <label htmlFor="journal-search" className="sr-only">
              {t("blog.searchLabel")}
            </label>
            <div className="relative min-w-0 flex-1">
              <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 start-4 flex items-center text-body/50">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                  <circle cx="11" cy="11" r="6.5" />
                  <path d="m16 16 4 4" />
                </svg>
              </span>
              <input
                id="journal-search"
                type="search"
                name="q"
                defaultValue={search ?? ""}
                placeholder={t("blog.searchPlaceholder")}
                className={inputClasses("rounded-full ps-12")}
              />
            </div>
            {activeSlugs.map((slug) => (
              <input key={slug} type="hidden" name="category" value={slug} />
            ))}
            {tagSlugs.map((slug) => (
              <input key={slug} type="hidden" name="tag" value={slug} />
            ))}
            <button type="submit" className={buttonClasses({ size: "lg", className: "h-12" })}>
              {t("blog.searchAction")}
            </button>
          </form>

          <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-2">
            <p className="w-24 shrink-0 text-[13px] font-semibold text-ink">{t("blog.filterCategory")}</p>
            <ul className="flex flex-wrap gap-2">
              <li>
                <Link href={base} aria-current={activeSlugs.length === 0 ? "page" : undefined} className={pill(activeSlugs.length === 0)}>
                  {t("blog.filterAll")}
                </Link>
              </li>
              {categories.map((category) => {
                const active = activeSlugs.includes(category.slug);
                return (
                  <li key={category.id}>
                    <Link
                      href={localePath(locale, `/blog/categories/${category.slug}`)}
                      aria-current={active ? "page" : undefined}
                      className={pill(active)}
                    >
                      {category.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <p className="mt-6 border-t border-line pt-5 text-[13px] text-body">
            {t("blog.showingCount", { shown, total })}
            {filtered ? (
              <>
                {" · "}
                <Link href={base} className="font-semibold text-primary-dark underline-offset-4 hover:underline">
                  {t("education.filterClear")}
                </Link>
              </>
            ) : null}
          </p>
        </div>
      </div>
    </section>
  );
}
