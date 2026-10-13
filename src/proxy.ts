import { NextResponse, type NextRequest } from "next/server";

import { DEFAULT_LOCALE, LOCALES, isLocale } from "@/i18n/locales";

const LOCALE_COOKIE = "jofit.locale";

/**
 * Next 16 renamed the `middleware` file convention to `proxy`; this is the same
 * edge hook under its current name.
 *
 * Every page lives under a locale prefix, so a request without one has to be
 * sent somewhere.
 *
 * Order of preference: a previously chosen language (cookie), then the browser's
 * `Accept-Language`, then English. The redirect is 307 — temporary — because the
 * right target depends on who is asking, and a permanent redirect would be
 * cached and pin every later visitor to the first visitor's language.
 */
function negotiate(request: NextRequest): string {
  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(cookie)) return cookie;

  const header = request.headers.get("accept-language") ?? "";
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { tag: (tag ?? "").split("-")[0]?.toLowerCase() ?? "", quality: Number(q ?? 1) };
    })
    .filter((entry) => entry.tag !== "")
    .sort((a, b) => b.quality - a.quality);

  return ranked.find((entry) => isLocale(entry.tag))?.tag ?? DEFAULT_LOCALE;
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasLocale = LOCALES.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (hasLocale) return NextResponse.next();

  const locale = negotiate(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url, 307);
}

export const config = {
  // Everything except Next internals, API routes and files with an extension
  // (robots.txt, sitemap.xml, images) — those must not be locale-prefixed.
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
