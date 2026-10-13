import type { Locale } from "../locales";
import { ar } from "./ar";
import { en, type Dictionary } from "./en";

/*
 * No spread, and no `as Dictionary`.
 *
 * Two draft modules used to be spread in after these, as a hand-off from
 * agents who were told not to write to `en.ts`/`ar.ts` while several of them
 * ran at once. Spreading them LAST meant they won every collision, and because
 * the fold into the real dictionaries happened while the drafts stayed, 169 of
 * 244 key/locale pairs had drifted -- the site was rendering abandoned copy
 * from a file whose own header said to delete it.
 *
 * `as Dictionary` is gone with them. It was what let the spread compile at all:
 * it asserts the result satisfies `Record<TranslationKey, string>` without
 * checking, which is precisely the guarantee this design exists to provide --
 * that a missing translation is a compile error and never a blank on a public
 * page. `ar` is now checked against `Dictionary` by assignment, as it was
 * before the drafts arrived.
 */
const dictionaries: Readonly<Record<Locale, Dictionary>> = { en, ar };

/**
 * Both dictionaries are plain modules, imported statically.
 *
 * They are small (a few KB), and they are read in Server Components, so they
 * never reach the browser bundle at all — dynamic `import()` per locale would
 * add async plumbing for no payload saving. Revisit if a dictionary grows into
 * the hundreds of KB or a client component needs a large slice of it.
 */
export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export type { Dictionary, TranslationKey } from "./en";
