import Link from "next/link";

import { ArrowIcon } from "@/components/ui";
import type { Course, CourseEnrolmentState, CourseFormat, CourseLevel } from "@/features/education";
import { getFormatters, localePath, type Locale, type Translate } from "@/i18n";

import { CourseCover } from "./course-cover";
import { CertificateIcon, ClockIcon } from "./icons";

/**
 * THE COURSE CARD — the formal redesign.
 *
 * A certificate-style cover (see `course-cover.tsx`), then what a professional
 * scans a catalogue for, in that order: the format and level, the title, one
 * line of summary, WHAT IT LEADS TO and who awards it — the reason to buy —
 * then the next intake and the hours.
 *
 * NO PRICE. The client has not supplied course fees, and the figures in the
 * fixtures are placeholders; a formal catalogue that prints invented prices is
 * worse than one that says to ask. Fees are given on enquiry — the course page
 * and the path section say so — and the card ends with the seat state and the
 * way in instead.
 *
 * One link covers the whole card (the title's `::after`), so the card is one
 * target without nesting interactive elements.
 */
const SIGNAL: Readonly<Record<CourseEnrolmentState, string>> = {
  open: "in-stock",
  closing: "low-stock",
  full: "out-of-stock",
  upcoming: "pre-order",
};

const SEAT_LABEL = {
  open: "education.seatsOpen",
  closing: "education.seatsClosing",
  full: "education.seatsFull",
  upcoming: "education.seatsUpcoming",
} as const;

const FORMAT_LABEL: Readonly<Record<CourseFormat, "education.formatOnline" | "education.formatInPerson" | "education.formatHybrid">> = {
  online: "education.formatOnline",
  "in-person": "education.formatInPerson",
  hybrid: "education.formatHybrid",
};

const LEVEL_LABEL: Readonly<Record<CourseLevel, "education.levelBeginner" | "education.levelIntermediate" | "education.levelAdvanced">> = {
  beginner: "education.levelBeginner",
  intermediate: "education.levelIntermediate",
  advanced: "education.levelAdvanced",
};

export function CourseCard({
  course,
  locale,
  t,
  priority = false,
  coverLabel,
}: {
  course: Course;
  locale: Locale;
  t: Translate;
  /** Set on the first row, which is above the fold on every breakpoint. */
  priority?: boolean;
  /** The small line on the cover — usually the course's category. */
  coverLabel?: string;
}) {
  const { number, date } = getFormatters(locale);
  const href = localePath(locale, `/education/courses/${course.slug}`);
  const state = course.nextIntake.state;

  return (
    <article className="group relative flex h-full flex-col rounded-3xl border border-line bg-surface p-3 shadow-soft transition-[transform,box-shadow,border-color] duration-300 focus-within:border-primary/40 hover:-translate-y-1 hover:border-primary/25 hover:shadow-lift">
      <CourseCover course={course} label={coverLabel} priority={priority} />

      <div className="flex flex-1 flex-col px-3 pt-5 pb-3">
        <div className="flex flex-wrap items-center gap-1.5 text-[12px] font-medium">
          <span className="rounded-full bg-primary-05 px-2.5 py-1 text-primary-dark">{t(FORMAT_LABEL[course.format])}</span>
          <span className="rounded-full bg-canvas px-2.5 py-1 text-body">{t(LEVEL_LABEL[course.level])}</span>
        </div>

        {/* Two lines reserved, so the blocks below line up across a row. */}
        <h3 className="mt-3.5 line-clamp-2 min-h-[3rem] text-[1.1rem] leading-snug">
          <Link href={href} className="after:absolute after:inset-0 after:rounded-3xl after:content-['']">
            {course.title}
          </Link>
        </h3>

        <p className="mt-2 line-clamp-2 min-h-[2.9rem] text-[14px] leading-relaxed text-body">{course.summary}</p>

        {/* Rendered whether or not there is a certification, so every card in
            a row keeps the same height above its footer. A course without one
            has not had its certificate confirmed yet, so it says to ask — not
            that there is none. */}
        <div className="mt-4 flex min-h-[3.25rem] items-start gap-3 rounded-2xl bg-canvas px-4 py-3">
          <span className="mt-0.5 text-accent-strong">
            <CertificateIcon size={16} />
          </span>
          {course.certification ? (
            <div className="min-w-0">
              <p className="line-clamp-1 text-[13px] font-semibold text-ink">{course.certification.name}</p>
              <p className="line-clamp-1 text-[12px] text-body/75">
                {t("education.issuedBy", { issuer: course.certification.issuedBy })}
              </p>
            </div>
          ) : (
            <p className="text-[12.5px] leading-snug text-body/75">{t("education.certificateOnEnquiry")}</p>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-4 text-[13px]">
          <div className="flex min-w-0 flex-col gap-1">
            <p className="stock-signal" data-stock={SIGNAL[state]}>
              {t(SEAT_LABEL[state])}
            </p>
            <p className="inline-flex items-center gap-1.5 text-body/75">
              <span className="text-primary">
                <ClockIcon size={13} />
              </span>
              {/* A figure beside a bare noun. Arabic counts 3–10 with the plural
                  ("ساعات") and everything else with the singular ("ساعة"),
                  which is the `few` category of the plural rules. */}
              <span className="font-semibold text-ink" dir="ltr">
                {number(course.durationHours)}
              </span>
              {t(
                new Intl.PluralRules(locale).select(course.durationHours) === "few"
                  ? "education.hoursUnitFew"
                  : "education.hoursUnit",
              )}
              <span className="text-body/35">·</span>
              <span>{date(course.nextIntake.startsOn)}</span>
            </p>
          </div>
          <span className="grid size-10 shrink-0 place-items-center rounded-full border border-line text-primary transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-on-primary">
            <ArrowIcon />
          </span>
        </div>
      </div>
    </article>
  );
}
