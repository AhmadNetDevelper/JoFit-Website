import type { ReactNode } from "react";

import type { ApplicationStatus, EmployerVerificationStatus, JobStatus } from "@/features/careers";
import type { Translate } from "@/i18n";

/**
 * The careers lifecycles as words, with colour as the second channel:
 *   brand   — live or won: an open job, a hire, a verified company;
 *   moving  — progressing: shortlisted, interview, offer;
 *   accent  — waiting on someone: in review, just submitted, pending verification;
 *   muted   — finished or parked: a draft, a closed job, a declined or withdrawn application;
 *   danger  — needs fixing: a job sent back, a company refused or suspended.
 */
type Tone = "brand" | "moving" | "accent" | "muted" | "danger";

const TONES: Readonly<Record<Tone, string>> = {
  brand: "bg-primary text-on-primary",
  moving: "bg-primary-10 text-primary-dark ring-1 ring-primary/15",
  accent: "bg-accent-20 text-ink ring-1 ring-accent/35",
  muted: "bg-canvas text-body ring-1 ring-line",
  danger: "bg-danger-05 text-danger ring-1 ring-danger/20",
};

const JOB_TONE: Readonly<Record<JobStatus, Tone>> = {
  draft: "muted",
  pending: "accent",
  open: "brand",
  closed: "muted",
  rejected: "danger",
};

const APPLICATION_TONE: Readonly<Record<ApplicationStatus, Tone>> = {
  submitted: "accent",
  reviewing: "accent",
  shortlisted: "moving",
  interview: "moving",
  offered: "moving",
  hired: "brand",
  rejected: "muted",
  withdrawn: "muted",
};

const VERIFICATION_TONE: Readonly<Record<EmployerVerificationStatus, Tone>> = {
  pending: "accent",
  verified: "brand",
  rejected: "danger",
  suspended: "danger",
};

function Chip({ tone, label }: { tone: Tone; label: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[12px] leading-none font-semibold whitespace-nowrap ${TONES[tone]}`}>
      {label}
    </span>
  );
}

export function JobStatusChip({ t, status }: { t: Translate; status: JobStatus }) {
  return <Chip tone={JOB_TONE[status]} label={t(`careers.jobStatus.${status}`)} />;
}

export function ApplicationStatusChip({ t, status }: { t: Translate; status: ApplicationStatus }) {
  return <Chip tone={APPLICATION_TONE[status]} label={t(`careers.appStatus.${status}`)} />;
}

export function VerificationChip({ t, status }: { t: Translate; status: EmployerVerificationStatus }) {
  return <Chip tone={VERIFICATION_TONE[status]} label={t(`careers.verification.${status}`)} />;
}

/** The small gold marker on an application nobody has opened yet. */
export function NewMarker({ label }: { label: string }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[11.5px] leading-none font-bold text-deep">
      <span aria-hidden="true" className="size-1.5 rounded-full bg-deep/70" />
      {label}
    </span>
  );
}

/**
 * A status set on the deep hero band: the chip's tints are drawn for a white
 * surface, so on the dark green it sits on a white pill of its own.
 */
export function HeroStatus({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-3 rounded-full bg-surface py-2 ps-4 pe-2 shadow-lift">
      <span className="text-[12.5px] font-semibold text-body">{label}</span>
      {children}
    </span>
  );
}
