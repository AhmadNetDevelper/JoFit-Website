import Link from "next/link";
import { Suspense, type ReactNode } from "react";

import { ArrowIcon, buttonClasses, PageHero, Reveal, Section, SectionHead } from "@/components/ui";
import {
  SEARCH_SCOPES,
  SearchBox,
  searchService,
  type SearchHitKind,
  type SearchScope,
} from "@/features/search";
import {
  getFormatters,
  getTranslator,
  localePath,
  resolveLocale,
  type Locale,
  type Translate,
  type TranslationKey,
} from "@/i18n";
import { buildMetadata, buildQueryString, readParam, resolveSearchParams } from "@/lib";

import { ArticleIcon, BagIcon, CalendarIcon, CapIcon, SearchIcon, WhistleIcon } from "./_components/icons";
import { ResultRow } from "./_components/result-row";

export async function generateMetadata({ params }: PageProps<"/[locale]/search">) {
  const locale = resolveLocale((await params).locale);
  // Search results are personal and low-value to crawlers.
  return buildMetadata({
    locale,
    path: "/search",
    title: getTranslator(locale)("search.title"),
    noIndex: true,
  });
}

/** Group labels are UI copy, so they live in the dictionary, not the service. */
const GROUP_LABEL_KEYS: Readonly<Record<SearchHitKind, TranslationKey>> = {
  product: "search.groupProducts",
  rental: "search.groupRentals",
  coach: "search.groupCoaches",
  course: "search.groupCourses",
  article: "search.groupArticles",
};

const GROUP_ICON: Readonly<Record<SearchHitKind, (size: number) => ReactNode>> = {
  product: (size) => <BagIcon size={size} />,
  rental: (size) => <CalendarIcon size={size} />,
  coach: (size) => <WhistleIcon size={size} />,
  course: (size) => <CapIcon size={size} />,
  article: (size) => <ArticleIcon size={size} />,
};

/** A group's kind maps to the scope that shows only that kind. */
const GROUP_SCOPE: Readonly<Record<SearchHitKind, SearchScope>> = {
  product: "products",
  rental: "rentals",
  coach: "coaches",
  course: "courses",
  article: "articles",
};

/** Scope → the label and glyph for its filter pill. */
const SCOPE_META: Readonly<Record<SearchScope, { labelKey: TranslationKey; icon: ReactNode }>> = {
  all: { labelKey: "search.scopeAll", icon: <SearchIcon size={14} /> },
  products: { labelKey: "search.groupProducts", icon: <BagIcon size={14} /> },
  rentals: { labelKey: "search.groupRentals", icon: <CalendarIcon size={14} /> },
  coaches: { labelKey: "search.groupCoaches", icon: <WhistleIcon size={14} /> },
  courses: { labelKey: "search.groupCourses", icon: <CapIcon size={14} /> },
  articles: { labelKey: "search.groupArticles", icon: <ArticleIcon size={14} /> },
};

function resolveScope(value: string | undefined): SearchScope {
  return SEARCH_SCOPES.find((scope) => scope === value) ?? "all";
}

/**
 * SEARCH — the one page whose hero IS a control.
 *
 * A compact `PageHero` whose main element is the field itself, set large on the
 * deep band with the scope pills beneath it — and no figures, because counting
 * the catalogue is not what a searcher came to find out. Under it, one of three
 * states, all designed:
 *
 *   NO TERM   not an empty page but a starting point: the five domains as
 *             doors, so somebody who does not know what to type can still leave
 *             this page usefully.
 *   NO HITS   says what was searched, offers the one thing that actually helps
 *             (widening a scoped search back to everything), and then the same
 *             doors — "Nothing found" with no way forward is a dead end.
 *   RESULTS   grouped by domain, every row one design, each group headed with
 *             its own count; on wide screens a rail of the groups for jumping.
 */
export default async function SearchPage({ params, searchParams }: PageProps<"/[locale]/search">) {
  const [{ locale: raw }, search] = await Promise.all([params, resolveSearchParams(searchParams)]);
  const locale = resolveLocale(raw);
  const t = getTranslator(locale);
  const { number } = getFormatters(locale);

  const term = readParam(search, "q") ?? "";
  const scope = resolveScope(readParam(search, "scope"));
  const results = await searchService.search({ term, scope, locale });

  const base = localePath(locale, "/search");
  const scopeLink = (next: SearchScope) =>
    `${base}${buildQueryString({ q: term, scope: next === "all" ? undefined : next })}`;

  return (
    <>
      <PageHero
        compact
        breadcrumbLabel={t("site.breadcrumb")}
        breadcrumbs={[{ label: t("nav.home"), href: localePath(locale, "/") }, { label: t("search.title") }]}
        eyebrow={t("search.title")}
        title={t("search.heroTitle")}
        lead={t("search.heroLead")}
      >
        {/*
          THE FIELD. `SearchBox` is the feature's own client component (it owns
          the debounced input and writes the term to the URL, and draws the
          pill); the leading glyph is laid over its start edge from here.
        */}
        <div className="relative max-w-2xl">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 start-5 z-10 flex h-14 items-center text-body/55"
          >
            <SearchIcon size={20} />
          </span>
          {/* `useSearchParams` needs a Suspense boundary during static
              rendering. The fallback mirrors the field's own height so the
              band does not jump when it hydrates. */}
          <Suspense fallback={<div className="h-14 w-full rounded-full bg-white/10" />}>
            <SearchBox
              scope={scope === "all" ? undefined : scope}
              basePath={base}
              labels={{ label: t("search.label"), placeholder: t("search.placeholder") }}
            />
          </Suspense>
        </div>

        <ul className="mt-5 flex flex-wrap items-center gap-2">
          {SEARCH_SCOPES.map((entry) => {
            const active = entry === scope;
            return (
              <li key={entry}>
                <Link
                  href={scopeLink(entry)}
                  aria-pressed={active}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-medium transition-colors ${
                    active
                      ? "border-accent bg-accent text-deep"
                      : "border-white/20 text-white/80 hover:border-white/50 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {SCOPE_META[entry].icon}
                  {t(SCOPE_META[entry].labelKey)}
                </Link>
              </li>
            );
          })}
        </ul>

        {term !== "" ? (
          <p role="status" className="mt-6 text-[14px] text-white/70">
            {t("search.resultCount", { count: number(results.total), term })}
          </p>
        ) : null}
      </PageHero>

      {term === "" ? (
        <Section tone="muted" labelledBy="search-doors">
          <SectionHead id="search-doors" title={t("search.doorsTitle")} lead={t("search.doorsLead")} />
          <SearchDoors locale={locale} t={t} className="mt-12" />
        </Section>
      ) : results.groups.length === 0 ? (
        <Section tone="muted" labelledBy="search-none">
          <div className="mx-auto max-w-xl rounded-3xl border border-line bg-surface px-6 py-14 text-center shadow-soft sm:px-10">
            <span
              aria-hidden="true"
              className="mx-auto grid size-16 place-items-center rounded-full bg-primary-05 text-primary ring-1 ring-primary/15 ring-offset-4 ring-offset-surface"
            >
              <SearchIcon size={26} />
            </span>

            <h2 id="search-none" className="mt-7 text-[1.45rem] leading-snug" dir="auto">
              {t("search.noResults", { term })}
            </h2>
            <p className="mx-auto mt-3 max-w-[42ch] text-[15px] leading-relaxed text-body">
              {/* Scoped searches fail far more often than unscoped ones, so the
                  advice changes with the state rather than being one generic
                  line that is wrong half the time. */}
              {scope === "all" ? t("search.noResultsBody") : t("search.noResultsScoped")}
            </p>

            {scope === "all" ? null : (
              <Link href={`${base}${buildQueryString({ q: term })}`} className={buttonClasses({ className: "mt-8" })}>
                {t("search.widenScope")}
              </Link>
            )}
          </div>

          <h3 className="mt-16 text-center font-heading text-[1.1rem] font-semibold text-ink">{t("search.noResultsDoors")}</h3>
          <SearchDoors locale={locale} t={t} className="mt-8" />
        </Section>
      ) : (
        <Section tone="muted" labelledBy="search-results-title">
          <h2 id="search-results-title" className="sr-only">
            {t("search.title")}
          </h2>

          <div className={results.groups.length > 1 ? "grid gap-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12" : ""}>
            {/* THE RAIL — only when there is more than one group to jump
                between; one group needs no table of contents. */}
            {results.groups.length > 1 ? (
              <nav aria-label={t("search.jumpTitle")} className="max-lg:hidden lg:sticky lg:top-28 lg:self-start">
                <p className="eyebrow">{t("search.jumpTitle")}</p>
                <ul className="mt-5 space-y-1.5">
                  {results.groups.map((group) => (
                    <li key={group.kind}>
                      <a
                        href={`#group-${group.kind}`}
                        className="flex items-center gap-3 rounded-full px-3 py-2 text-[14px] font-medium text-ink transition-colors hover:bg-surface"
                      >
                        <span aria-hidden="true" className="text-primary">
                          {GROUP_ICON[group.kind](15)}
                        </span>
                        <span className="min-w-0 flex-1 truncate">{t(GROUP_LABEL_KEYS[group.kind])}</span>
                        <span className="rounded-full bg-surface px-2 py-0.5 text-[12px] font-semibold text-body ring-1 ring-line">
                          <span dir="ltr">{number(group.total)}</span>
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ) : null}

            <div className="space-y-14">
              {results.groups.map((group) => (
                <section key={group.kind} id={`group-${group.kind}`} aria-labelledby={`group-${group.kind}-title`} className="scroll-mt-28">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className="grid size-9 place-items-center rounded-full bg-surface text-primary ring-1 ring-primary/15"
                      >
                        {GROUP_ICON[group.kind](16)}
                      </span>
                      <h2 id={`group-${group.kind}-title`} className="text-[1.35rem] leading-snug">
                        {t(GROUP_LABEL_KEYS[group.kind])}
                      </h2>
                    </div>
                    <p className="text-[13px] text-body">{t("search.groupCount", { count: number(group.total) })}</p>
                  </div>

                  <Reveal stagger as="ul" className="mt-5 space-y-3">
                    {group.hits.map((hit) => (
                      <li key={`${hit.kind}-${hit.item.id}`}>
                        <ResultRow hit={hit} locale={locale} t={t} />
                      </li>
                    ))}
                  </Reveal>

                  {/* A group shows a handful and says so. Narrowing the search
                      to that section is more use than paginating five
                      different things at once. */}
                  {group.total > group.hits.length ? (
                    <p className="mt-5">
                      <Link href={scopeLink(GROUP_SCOPE[group.kind])} className={buttonClasses({ variant: "soft", size: "sm" })}>
                        {t("search.seeAllInGroup", {
                          label: t(GROUP_LABEL_KEYS[group.kind]),
                          count: number(group.total),
                        })}
                        <ArrowIcon size={14} />
                      </Link>
                    </p>
                  ) : null}
                </section>
              ))}
            </div>
          </div>
        </Section>
      )}
    </>
  );
}

/**
 * THE FIVE DOORS — where each domain lives, for "nothing typed yet" and for
 * "nothing found". Real routes rather than a scope filter: somebody who does
 * not know what to search for wants the catalogue, not an empty result set
 * scoped to it.
 */
function SearchDoors({ locale, t, className = "" }: { locale: Locale; t: Translate; className?: string }) {
  const doors: { href: string; kind: SearchHitKind }[] = [
    { href: "/education", kind: "course" },
    { href: "/coaches", kind: "coach" },
    { href: "/shop", kind: "product" },
    { href: "/blog", kind: "article" },
    { href: "/rental", kind: "rental" },
  ];

  return (
    <Reveal stagger as="ul" className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-5 ${className}`}>
      {doors.map((door) => (
        <li key={door.href} className="flex">
          <Link
            href={localePath(locale, door.href)}
            className="group flex w-full items-center gap-4 rounded-3xl border border-line bg-surface p-5 shadow-soft transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-lift lg:flex-col lg:items-start lg:p-6"
          >
            <span
              aria-hidden="true"
              className="grid size-12 shrink-0 place-items-center rounded-full bg-primary-05 text-primary ring-1 ring-primary/15 ring-offset-4 ring-offset-surface"
            >
              {GROUP_ICON[door.kind](20)}
            </span>
            <span className="min-w-0 flex-1 font-heading text-[1.05rem] font-semibold text-ink lg:mt-3">
              {t(GROUP_LABEL_KEYS[door.kind])}
            </span>
            <span
              aria-hidden="true"
              className="grid size-9 shrink-0 place-items-center rounded-full border border-line text-primary transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-on-primary lg:self-end"
            >
              <ArrowIcon size={14} />
            </span>
          </Link>
        </li>
      ))}
    </Reveal>
  );
}
