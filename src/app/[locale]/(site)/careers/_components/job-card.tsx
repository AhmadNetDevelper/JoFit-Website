import Link from "next/link";

import { ArrowIcon } from "@/components/ui";
import type { JobSummary } from "@/features/careers";
import { getFormatters, localePath, type Locale, type Translate } from "@/i18n";

import { EmployerMark } from "./employer-mark";
import { closesLabel, postedLabel, salaryLabel } from "./format";
import { BriefcaseIcon, BuildingIcon, PinIcon, StarIcon, WalletIcon } from "./icons";

/**
 * A JOB ON THE BOARD — the formal card: white, a hairline, 24px corners.
 *
 * No photograph: a job has no picture worth the space, and a stock photo per
 * card would be decoration pretending to be information. The employer's seal
 * stands in its place. Then what a professional scans a board for, in that
 * order: who is hiring, the title, where and on what terms, the field and the
 * level, the salary, and — in the footer — the dates.
 *
 * The rows a reader compares across cards are reserved to fixed heights (the
 * two-line title, the chip row, the salary box, the two footer lines), so
 * every footer in a grid row lines up and the salaries can be scanned in a
 * straight line.
 *
 * Gold appears once, on the FEATURED pill standing on the card's top edge.
 *
 * One link covers the whole card (the title's `::after`), so the card is one
 * target without nesting interactive elements.
 */
export function JobCard({ job, locale, t }: { job: JobSummary; locale: Locale; t: Translate }) {
  const f = getFormatters(locale);
  const href = localePath(locale, `/careers/jobs/${job.slug}`);
  const salary = salaryLabel(job.salary, t, f);

  return (
    <article className="group relative flex h-full w-full flex-col rounded-3xl border border-line bg-surface p-6 shadow-soft transition-[transform,box-shadow,border-color] duration-300 focus-within:border-primary/40 hover:-translate-y-1 hover:border-primary/25 hover:shadow-lift">
      {job.featured ? (
        /* On the card's top edge, so a featured job is found without reading
           anything and the employer's name keeps the whole row. */
        <p className="absolute -top-3 end-6 z-10 inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-[11.5px] font-semibold text-deep shadow-soft">
          <StarIcon size={11} />
          {t("careers.card.featured")}
        </p>
      ) : null}

      <div className="flex items-start gap-3.5">
        <EmployerMark name={job.employer.name} logo={job.employer.logo} size="sm" />
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="truncate text-[14px] font-semibold text-ink" dir="auto">
            {job.employer.name}
          </p>
          <p className="mt-0.5 truncate text-[12.5px] text-body/75">{t(`careers.kind.${job.employer.kind}`)}</p>
        </div>
      </div>

      {/* `dir="auto"` on the link, not the heading: the title keeps its own
          direction while the heading stays on the card's reading edge. */}
      <h3 className="mt-5 line-clamp-2 min-h-[3.1rem] text-[1.1rem] leading-snug">
        <Link href={href} dir="auto" className="after:absolute after:inset-0 after:rounded-3xl after:content-['']">
          {job.title}
        </Link>
      </h3>

      <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-body">
        {job.city ? (
          <li className="inline-flex items-center gap-1.5">
            <span className="text-primary">
              <PinIcon size={14} />
            </span>
            {job.city.name}
          </li>
        ) : null}
        <li className="inline-flex items-center gap-1.5">
          <span className="text-primary">
            <BriefcaseIcon size={14} />
          </span>
          {t(`careers.type.${job.employmentType}`)}
        </li>
        <li className="inline-flex items-center gap-1.5">
          <span className="text-primary">
            <BuildingIcon size={14} />
          </span>
          {t(`careers.mode.${job.workMode}`)}
        </li>
      </ul>

      <ul className="mt-4 flex min-h-7 flex-wrap gap-1.5 text-[12px] font-medium">
        {job.category ? <li className="rounded-full bg-primary-05 px-2.5 py-1 text-primary-dark">{job.category.name}</li> : null}
        <li className="rounded-full bg-canvas px-2.5 py-1 text-body">{t(`careers.level.${job.experienceLevel}`)}</li>
      </ul>

      {/* The salary in its own box, two lines reserved: a range with its
          period can wrap on a narrow card, and the box keeps every card in a
          row the same shape whether it wraps, fits, or is not published. */}
      <div className="mt-4 mb-5 flex min-h-15 items-center gap-3 rounded-2xl bg-canvas px-4 py-2.5">
        <span aria-hidden="true" className="text-accent-strong">
          <WalletIcon size={16} />
        </span>
        {salary ? (
          <p className="text-[14px] leading-snug font-semibold text-ink">{salary}</p>
        ) : (
          <p className="text-[13px] leading-snug text-body/75">{t("careers.card.salaryHidden")}</p>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-4">
        {/* Two lines, always: when it was posted, and until when it takes
            applications ("open until filled" when the employer set no date). */}
        <div className="min-w-0 text-[12.5px] leading-5">
          {job.postedAt ? <p className="text-body/70">{postedLabel(job.postedAt, locale, t, f)}</p> : null}
          <p className="font-medium text-primary-dark">{closesLabel(job.closesOn, t, f)}</p>
        </div>
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-full border border-line text-primary transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-on-primary"
        >
          <ArrowIcon />
        </span>
      </div>
    </article>
  );
}
