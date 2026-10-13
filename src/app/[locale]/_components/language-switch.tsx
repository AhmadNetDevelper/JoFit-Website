"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { LOCALE_LABELS, localePath, stripLocale, type Locale } from "@/i18n";

/**
 * The language switch: ONE link, to the page you are on, in the other language.
 *
 * It replaces a two-link version that listed both locales and marked the
 * current one. Naming the language you are already reading is a label, not a
 * control, and it cost the bar a second item it did not need.
 *
 * It is a real link, not a control that mutates state: each language has its
 * own URL, so the switch has to be crawlable, shareable, and workable with
 * JavaScript off. The label is the endonym of the language it LEADS to, so it
 * is legible to someone who cannot read the page they are on.
 *
 * Client-side only because it needs the current path to rebuild it under the
 * other locale — that is the whole reason this is not part of the header's
 * server render.
 */
export function LanguageSwitch({
  current,
  className,
  icon,
}: {
  current: Locale;
  className?: string;
  /** Rendered before the label. A node, not a flag, so the header owns the
      icon set and this component stays ignorant of it. */
  icon?: ReactNode;
}) {
  const other: Locale = current === "ar" ? "en" : "ar";
  const basePath = stripLocale(usePathname());

  return (
    <Link
      href={localePath(other, basePath)}
      hrefLang={other}
      lang={other}
      className={className}
      onClick={() => {
        /*
         * Remembered so a later visit to `/` lands in the language that was
         * picked; the middleware reads this cookie. 400 days is the browser
         * cap for a cookie set from script.
         */
        document.cookie = `jofit.locale=${other}; path=/; max-age=34560000; samesite=lax`;
      }}
    >
      {icon}
      {LOCALE_LABELS[other]}
    </Link>
  );
}
