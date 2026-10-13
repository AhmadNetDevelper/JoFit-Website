import type { MetadataRoute } from "next";

import { siteConfig } from "@/config";
import { LOCALES } from "@/i18n";
import { absoluteUrl } from "@/lib";

/**
 * Transactional and personal areas must never be indexed — in either language,
 * which is why the disallow list is expanded per locale rather than written once.
 */
const PRIVATE_PATHS = ["/cart", "/checkout", "/account", "/search"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: LOCALES.flatMap((locale) =>
          PRIVATE_PATHS.map((path) => `/${locale}${path}`),
        ),
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteConfig.url,
  };
}
