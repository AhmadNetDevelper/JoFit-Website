import { siteConfig } from "@/config";
import { LOCALE_HREFLANG, localePath, type Locale } from "@/i18n";

import { absoluteUrl } from "./url";

/**
 * JSON-LD BUILDERS.
 *
 * `jsonLdScriptProps` in `seo.ts` serialises whatever it is handed; this file
 * is what decides WHAT to hand it. The two are separate because the serialiser
 * is infrastructure and the schema choices below are claims about a real
 * business — and a claim needs somewhere it can be read and checked.
 *
 * ---------------------------------------------------------------------------
 * EVERY FIELD HERE IS A FACT SOMEBODY CAN BE HELD TO.
 *
 * Structured data is not decoration: a search engine will show these values to
 * people as an address, a price, a rating or an opening time, and a wrong one
 * is a wrong answer given confidently in a place the business does not control.
 *
 * So the rule is the same one the rest of this codebase follows — nothing is
 * asserted that is not known. There is no `openingHoursSpecification` beyond
 * the hours the client actually gave, no `priceRange`, no `aggregateRating`
 * invented from mock fixtures, and no street address, because JoFit has given
 * a city and not a street. An absent field costs a little rich-result
 * eligibility. A wrong one sends somebody to the wrong door.
 */

/** Verified 2026-09-17, from the client. Changing these changes public claims. */
const CONTACT = {
  email: "info@jofit.net",
  telephone: "+962772116067",
  city: "Amman",
  country: "JO",
  instagram: "https://www.instagram.com/jofit_co",
} as const;

/**
 * The site-wide identity, emitted once in the shared layout.
 *
 * `SportsActivityLocation` rather than the bare `Organization`: it is a
 * subtype of `LocalBusiness`, which is what lets the address, the telephone
 * and the opening hours mean anything to a search engine, and it is true —
 * JoFit runs courses at a place in Amman.
 *
 * The NCSF relationship is expressed with `memberOf`, NOT `parentOrganization`.
 * JoFit is the council's exclusive agent in Jordan; it is not a subsidiary, and
 * `parentOrganization` would assert an ownership that does not exist.
 */
export function organizationJsonLd(locale: Locale, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    "@id": `${absoluteUrl("/")}#organization`,
    name: siteConfig.name,
    description,
    url: absoluteUrl(localePath(locale, "/")),
    logo: absoluteUrl("/images/logo/logo.png"),
    image: absoluteUrl("/brand/og-default.jpg"),
    email: CONTACT.email,
    telephone: CONTACT.telephone,
    inLanguage: [LOCALE_HREFLANG.en, LOCALE_HREFLANG.ar],
    address: {
      "@type": "PostalAddress",
      addressLocality: CONTACT.city,
      addressCountry: CONTACT.country,
      /* No `streetAddress`: the client has given a city and not a street, and a
         guessed one is an address people would drive to. */
    },
    /*
     * Sunday to Thursday, 09:00–17:00 — exactly what the client stated. Friday
     * and Saturday are simply absent rather than asserted as closed, which is
     * what the absence of a specification already means in schema.org.
     */
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
        opens: "09:00",
        closes: "17:00",
      },
    ],
    sameAs: [CONTACT.instagram],
    memberOf: {
      "@type": "Organization",
      name: "National Council on Strength & Fitness",
      alternateName: "NCSF",
    },
  };
}

/**
 * The trail, for the crumb line search engines show under a result.
 *
 * It takes the SAME array a page already renders as its visible breadcrumb, so
 * the two cannot drift: a structured trail that disagrees with the one on the
 * page is the kind of mismatch that gets rich results withdrawn rather than
 * ignored.
 */
export function breadcrumbJsonLd(
  locale: Locale,
  trail: readonly { name: string; path: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      item: absoluteUrl(localePath(locale, entry.path)),
    })),
  };
}

export interface ProductJsonLdInput {
  readonly name: string;
  readonly description: string;
  readonly url: string;
  readonly sku?: string;
  readonly brand?: string;
  readonly image?: string;
  readonly priceMinor: number;
  readonly currency: string;
  readonly inStock: boolean;
  readonly rating?: { readonly average: number; readonly count: number };
}

/**
 * A product offer.
 *
 * `price` is converted OUT of minor units. The domain stores JOD in fils —
 * 68_000 is 68.000 JOD — and schema.org expects a decimal amount, so emitting
 * the stored integer would advertise a 68,000 dinar shoe.
 *
 * `aggregateRating` is only emitted when somebody has actually rated the thing.
 * A zero-count rating is a rich-result violation, and a fabricated one is worse
 * than a violation.
 */
export function productJsonLd(input: ProductJsonLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description,
    ...(input.sku ? { sku: input.sku } : {}),
    ...(input.image ? { image: absoluteUrl(input.image) } : {}),
    ...(input.brand ? { brand: { "@type": "Brand", name: input.brand } } : {}),
    offers: {
      "@type": "Offer",
      url: input.url,
      priceCurrency: input.currency,
      price: (input.priceMinor / 1000).toFixed(3),
      availability: input.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: { "@id": `${absoluteUrl("/")}#organization` },
    },
    ...(input.rating && input.rating.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: input.rating.average,
            reviewCount: input.rating.count,
          },
        }
      : {}),
  };
}

export interface CourseJsonLdInput {
  readonly name: string;
  readonly description: string;
  readonly url: string;
  readonly hours: number;
  readonly mode: "online" | "in-person" | "hybrid" | "self-paced";
  readonly priceMinor?: number;
  readonly currency?: string;
  readonly certificationName?: string;
  readonly certificationIssuer?: string;
}

/**
 * A course, with the one field Google actually requires beyond a name and a
 * description: `provider`. It points at the organization declared once in the
 * layout rather than repeating it, which is what `@id` is for.
 *
 * `hasCourseInstance` carries the delivery mode. It is the honest place for it:
 * a course taught both online and in person is one course with two instances,
 * not two courses.
 */
export function courseJsonLd(input: CourseJsonLdInput) {
  const MODE = {
    online: "Online",
    "in-person": "Onsite",
    hybrid: "Blended",
    "self-paced": "Online",
  } as const;

  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: input.name,
    description: input.description,
    url: input.url,
    provider: { "@id": `${absoluteUrl("/")}#organization` },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: MODE[input.mode],
      courseWorkload: `PT${Math.round(input.hours)}H`,
    },
    ...(input.certificationName
      ? {
          educationalCredentialAwarded: {
            "@type": "EducationalOccupationalCredential",
            name: input.certificationName,
            ...(input.certificationIssuer
              ? {
                  recognizedBy: {
                    "@type": "Organization",
                    name: input.certificationIssuer,
                  },
                }
              : {}),
          },
        }
      : {}),
    ...(input.priceMinor !== undefined && input.currency
      ? {
          offers: {
            "@type": "Offer",
            url: input.url,
            priceCurrency: input.currency,
            price: (input.priceMinor / 1000).toFixed(3),
            category: "Paid",
          },
        }
      : {}),
  };
}
