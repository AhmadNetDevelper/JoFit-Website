import type { ApplicationStatus } from "@/features/careers";
import type { Translate } from "@/i18n";

/**
 * AN APPLICATION'S STATUS, as a word in the reader's language with colour as
 * the second channel:
 *
 *   waiting on the employer (submitted, reviewing)   gold
 *   moving forward (shortlisted, interview, offer)   brand tint
 *   hired                                            solid brand
 *   not taken forward                                danger
 *   withdrawn by the candidate                       muted — their own choice, not bad news
 */
const TONE: Readonly<Record<ApplicationStatus, string>> = {
  submitted: "bg-accent-20 text-ink",
  reviewing: "bg-accent-20 text-ink",
  shortlisted: "bg-primary-10 text-primary-dark",
  interview: "bg-primary-10 text-primary-dark",
  offered: "bg-primary-10 text-primary-dark",
  hired: "bg-primary text-on-primary",
  rejected: "bg-danger-05 text-danger",
  withdrawn: "border border-line bg-canvas text-body",
};

export function ApplicationStatusBadge({ status, t }: { status: ApplicationStatus; t: Translate }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1.5 text-[12px] leading-none font-semibold ${TONE[status]}`}>
      {t(`careers.appStatus.${status}`)}
    </span>
  );
}

/** The dot colour for a step on the timeline, by the same scheme. */
export const STEP_TONE: Readonly<Record<ApplicationStatus, string>> = {
  submitted: "bg-accent",
  reviewing: "bg-accent",
  shortlisted: "bg-primary",
  interview: "bg-primary",
  offered: "bg-primary",
  hired: "bg-primary",
  rejected: "bg-danger",
  withdrawn: "bg-body/50",
};
