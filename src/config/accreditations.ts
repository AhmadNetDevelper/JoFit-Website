import type { TranslationKey } from "@/i18n/dictionaries";

/**
 * THE BODIES BEHIND THE CERTIFICATE.
 *
 * One list for every logo row on the site (the home page's recognition band,
 * `/specialisations` and the footer), so a logo added here appears in all
 * three at once and the rows can never disagree. Every file came from the
 * client: the NCSF seal, the council's accreditations, and the registries its
 * certificates are listed on.
 *
 * `shape` decides the size a row gives the logo. A seal is round and reads at
 * full height, a wordmark is a long strip and has to sit shorter to carry the
 * same visual weight, and a badge is in between.
 *
 * The alt text is the body's own name. These are proper names set in Latin on
 * the logos themselves, so they are the same in both languages; the NCSF seal
 * is the exception, because its Arabic name is used across the site.
 */
export type AccreditationShape = "seal" | "wordmark" | "badge";

export interface Accreditation {
  readonly id: string;
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly shape: AccreditationShape;
  readonly alt: string;
  /** Replaces `alt` when the name is translated. */
  readonly altKey?: TranslationKey;
}

export const accreditations: readonly Accreditation[] = [
  {
    id: "ncsf",
    src: "/images/partners/ncsf-seal.png",
    width: 96,
    height: 96,
    shape: "seal",
    alt: "National Council on Strength & Fitness (NCSF)",
    altKey: "site.ncsfSealAlt",
  },
  {
    id: "ncca",
    src: "/brand/NCCA.png",
    width: 360,
    height: 360,
    shape: "seal",
    alt: "National Commission for Certifying Agencies (NCCA)",
  },
  {
    id: "usreps",
    src: "/brand/USREPS.png",
    width: 306,
    height: 84,
    shape: "wordmark",
    alt: "US Registry of Exercise Professionals",
  },
  {
    id: "coaes",
    src: "/brand/CoAES.png",
    width: 429,
    height: 202,
    shape: "badge",
    alt: "Committee on Accreditation for the Exercise Sciences",
  },
  {
    id: "europeactive",
    src: "/brand/EuropeActive.png",
    width: 419,
    height: 189,
    shape: "badge",
    alt: "European Standards — EuropeActive",
  },
];
