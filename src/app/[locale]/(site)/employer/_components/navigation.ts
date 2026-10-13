import { revalidatePath } from "next/cache";

import { localePath, type Locale } from "@/i18n";

/*
 * Where an employer action sends the person afterwards. Server only: called
 * from the Server Actions on these pages.
 */

/** A return path posted by a form is followed only inside the employer area. */
export function employerReturn(value: FormDataEntryValue | null, fallback: string): string {
  const path = typeof value === "string" ? value : "";
  return /^\/employer(?:[/?]|$)/.test(path) ? path : fallback;
}

/** `path` with a notice for the page to confirm, replacing any earlier one. */
export function withNotice(path: string, notice: string, reference?: string): string {
  const url = new URL(path, "http://employer.local");
  url.searchParams.delete("notice");
  url.searchParams.delete("ref");
  url.searchParams.delete("page");
  url.searchParams.set("notice", notice);
  if (reference) url.searchParams.set("ref", reference);
  return `${url.pathname}${url.search}`;
}

/**
 * After any change: the counts in the tabs and on the dashboard move with it,
 * so every employer page is refreshed, not only the one the action ran on.
 */
export function refreshEmployerArea(locale: Locale, ...paths: readonly string[]): void {
  for (const path of ["/employer", "/employer/jobs", "/employer/applications", ...paths]) {
    revalidatePath(localePath(locale, path));
  }
}
