import type { CurrencyCode } from "@/types";

/**
 * Non-visual site configuration. Nothing here decides how the site looks — that
 * is the design system in `styles/tokens.css` and the live theme the operator
 * edits.
 */

/**
 * THE PUBLIC ORIGIN, AND WHY A MISSING ONE IS A BUILD FAILURE.
 *
 * Every canonical link, every `og:url`, every `og:image`, every URL in
 * `sitemap.xml` and the `host` line in `robots.txt` is built from this one
 * value through `absoluteUrl()`.
 *
 * It used to fall back to `http://localhost:3000` in all environments. That
 * fallback is silent and it is catastrophic: a production deploy without
 * `NEXT_PUBLIC_SITE_URL` builds cleanly, serves correctly, looks perfect — and
 * tells every crawler that the canonical version of every page lives on
 * localhost. The site de-indexes itself and nothing in the build, the logs or
 * the rendered page says a word about it.
 *
 * So the fallback now applies to development only, and a production build
 * without the variable stops. A build error is trivially fixable and is seen;
 * a wrong canonical is neither.
 */
function resolveSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      [
        "NEXT_PUBLIC_SITE_URL is not set.",
        "",
        "It is the origin every canonical, OpenGraph URL, sitemap entry and the",
        "robots.txt host line is built from. Without it a production build would",
        "publish http://localhost:3000 as the canonical origin of every page,",
        "which no crawler can follow and which nothing else would report.",
        "",
        'Set it to the public origin, with no trailing slash, e.g.',
        "  NEXT_PUBLIC_SITE_URL=https://jofit.net",
        "",
        "See website/.env.example.",
      ].join("\n"),
    );
  }

  /* Development only. 3001 rather than 3000 because that is the port this
     project's dev server actually runs on, and a canonical nobody reads is
     still better off being right. */
  return "http://localhost:3001";
}

export const siteConfig = {
  name: "JoFit",
  /** Used for canonical URLs, OpenGraph and the sitemap. See `resolveSiteUrl`. */
  url: resolveSiteUrl(),
  description:
    "Sports commerce, equipment rental, coaching, education and community.",
  defaultLocale: "en",
  /**
   * THE SHIPPED LANGUAGES ARE `LOCALES` IN `src/i18n/locales.ts`, NOT THIS.
   *
   * This field said `["en"]` while the site has shipped Arabic for weeks, and
   * the two never met: `sitemap.ts`, `seo.ts` and the root layout all read
   * `LOCALES`, so the stale value changed no output and simply sat here
   * contradicting the site. It is kept, narrowed to the truth, because config
   * that disagrees with reality is worse than no config — the next person to
   * reach for "the list of languages" must not find a wrong one first.
   */
  locales: ["en", "ar"] as const,
  defaultCurrency: "JOD" satisfies CurrencyCode as CurrencyCode,
  twitterHandle: undefined as string | undefined,
  /**
   * Where staff work. A staff address typed into the storefront's sign-in is
   * pointed here instead of being told it does not exist. Falls back to the
   * admin's dev server; set `NEXT_PUBLIC_ADMIN_URL` for any deployment.
   */
  adminConsoleUrl: process.env.NEXT_PUBLIC_ADMIN_URL?.trim() || "http://localhost:5174",
} as const;

export type SiteConfig = typeof siteConfig;
