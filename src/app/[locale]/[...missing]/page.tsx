import { notFound } from "next/navigation";

/**
 * Any URL under a locale that no route claims lands here and hands over to
 * `[locale]/not-found.tsx`, so a mistyped address meets the branded 404 rather
 * than Next's default one. Named routes always win over a catch-all.
 */
export default function MissingPage() {
  notFound();
}
