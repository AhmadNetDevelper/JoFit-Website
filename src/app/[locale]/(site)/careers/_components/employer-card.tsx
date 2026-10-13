import Link from "next/link";

import type { EmployerSummary } from "@/features/careers";
import { localePath, type Locale, type Translate } from "@/i18n";

import { EmployerMark } from "./employer-mark";
import { PinIcon, ShieldIcon } from "./icons";

/**
 * A COMPANY ON THE BOARD — the board's "hiring now" row and the directory.
 *
 * The seal, the name and what kind of business it is; then, in the footer,
 * where it is and how many jobs it has open. The figure is the company's own
 * count, not a claim: it is what the board holds. A company with nothing open
 * says so in words rather than showing a zero.
 *
 * Every company here is verified — the directory only lists verified ones —
 * so the small "Verified by JoFit" line is a fact about each card.
 */
export function EmployerCard({
  employer,
  locale,
  t,
  number,
}: {
  employer: EmployerSummary;
  locale: Locale;
  t: Translate;
  number: (value: number) => string;
}) {
  return (
    <article className="group relative flex h-full w-full flex-col rounded-3xl border border-line bg-surface p-6 shadow-soft transition-[transform,box-shadow,border-color] duration-300 focus-within:border-primary/40 hover:-translate-y-1 hover:border-primary/25 hover:shadow-lift">
      <div className="flex items-start gap-4">
        <EmployerMark name={employer.name} logo={employer.logo} size="md" />
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 min-h-[2.8rem] text-[1.05rem] leading-snug">
            <Link
              dir="auto"
              href={localePath(locale, `/careers/employers/${employer.slug}`)}
              className="after:absolute after:inset-0 after:rounded-3xl after:content-['']"
            >
              {employer.name}
            </Link>
          </h3>
          <p className="mt-1 text-[13px] text-body/80">{t(`careers.kind.${employer.kind}`)}</p>
        </div>
      </div>

      <p className="mt-5 mb-5 inline-flex items-center gap-1.5 self-start rounded-full bg-primary-05 px-2.5 py-1 text-[12px] font-medium text-primary-dark">
        <ShieldIcon size={13} />
        {t("careers.employers.verified")}
      </p>

      <div className="mt-auto flex items-end justify-between gap-4 border-t border-line pt-4">
        {/* The empty span keeps the open-jobs figure on the end edge. */}
        {employer.city ? (
          <p className="inline-flex items-center gap-1.5 text-[13px] text-body">
            <span className="text-primary">
              <PinIcon size={14} />
            </span>
            {employer.city.name}
          </p>
        ) : (
          <span />
        )}
        {employer.openJobCount > 0 ? (
          /* A figure over a bare noun: Arabic agreement changes with the
             number, so "{n} open jobs" would be wrong for most. */
          <p className="text-end">
            <span className="block font-heading text-[22px] leading-none font-bold text-primary" dir="ltr">
              {number(employer.openJobCount)}
            </span>
            <span className="mt-1 block text-[11.5px] text-body/70">{t("careers.employers.openJobs")}</span>
          </p>
        ) : (
          <p className="text-[12.5px] text-body/60">{t("careers.employers.noOpenJobs")}</p>
        )}
      </div>
    </article>
  );
}
