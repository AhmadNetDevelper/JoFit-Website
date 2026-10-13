import Link from "next/link";
import { redirect } from "next/navigation";

import { ArrowIcon, buttonClasses } from "@/components/ui";
import { requireAccount } from "@/features/auth";
import type { EmployerJob } from "@/features/careers";
import { employerPortalService } from "@/features/employer-portal";
import { getTranslator, localePath, type Locale } from "@/i18n";

import { ActionForm, type FormState } from "../../_components/portal/action-form";
import { employerReturn, refreshEmployerArea, withNotice } from "./navigation";
import { refused, type EmployerAction } from "./refusals";

type Move = "submit" | "withdraw" | "close" | "reopen" | "delete";

const ACTION: Readonly<Record<Move, EmployerAction>> = {
  submit: "submitJob",
  withdraw: "withdrawJob",
  close: "closeJob",
  reopen: "reopenJob",
  delete: "deleteJob",
};

/** The notice each move leaves on the page it returns to. */
const NOTICE: Readonly<Record<Move, string>> = {
  submit: "submitted",
  withdraw: "withdrawn",
  close: "closed",
  reopen: "reopened",
  delete: "deleted",
};

/**
 * THE MOVES OPEN TO A JOB FROM WHERE IT IS — and only those, read off the
 * lifecycle in `features/careers/types.ts`:
 *
 *   draft     → submit for review · delete (nobody applied)
 *   pending   → take back
 *   open      → close
 *   closed    → reopen (reviewed again)
 *   rejected  → submit for review again · delete (nobody applied)
 *
 * Each is its own small Server Action form. Closing and deleting ask once
 * more, in place, because one stops applications and the other cannot be
 * undone. A refusal comes back in the reader's language; a success returns to
 * the page it came from with a notice saying what happened.
 */
export function JobActions({
  job,
  locale,
  returnTo,
  blocked,
  editHref,
  previewHref,
}: {
  job: EmployerJob;
  locale: Locale;
  /** The page (no locale) to come back to, e.g. `/employer/jobs?status=open`. */
  returnTo: string;
  /** The company may not send jobs to review right now. */
  blocked: boolean;
  editHref?: string;
  previewHref?: string;
}) {
  const t = getTranslator(locale);

  const act = (move: Move) =>
    async function (_state: FormState, formData: FormData): Promise<FormState> {
      "use server";
      const account = await requireAccount(locale, "employer", "/employer/jobs");
      const tr = getTranslator(locale);
      const employerId = account.employerId!;
      const jobId = String(formData.get("jobId") ?? "");
      const reference = String(formData.get("reference") ?? "");
      let back = employerReturn(formData.get("returnTo"), "/employer/jobs");
      try {
        if (move === "submit") await employerPortalService.submitJob(employerId, jobId);
        else if (move === "withdraw") await employerPortalService.withdrawJob(employerId, jobId);
        else if (move === "close") await employerPortalService.closeJob(employerId, jobId);
        else if (move === "reopen") await employerPortalService.reopenJob(employerId, jobId);
        else await employerPortalService.deleteJob(employerId, jobId);
      } catch (error) {
        return refused(tr, ACTION[move], error);
      }
      /* A deleted job's own page is gone; its list is where to land. */
      if (move === "delete" && /^\/employer\/jobs\/[^/?]+/.test(back)) back = "/employer/jobs";
      refreshEmployerArea(locale, `/employer/jobs/${jobId}`);
      redirect(localePath(locale, withNotice(back, NOTICE[move], reference)));
    };

  const hidden = (
    <>
      <input type="hidden" name="jobId" value={job.id} />
      <input type="hidden" name="reference" value={job.reference} />
      <input type="hidden" name="returnTo" value={returnTo} />
    </>
  );
  const working = t("account.working");
  /* ActionForm spaces its button from the fields above it; here there are none. */
  const inline = "[&>button]:mt-0";

  const canSubmit = (job.status === "draft" || job.status === "rejected") && !blocked;
  const canDelete = (job.status === "draft" || job.status === "rejected" || job.status === "closed") && job.applicationCount === 0;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
      {editHref ? (
        <Link href={editHref} className={buttonClasses({ variant: "outline" })}>
          {t("employer.edit")}
        </Link>
      ) : null}

      {canSubmit ? (
        <ActionForm action={act("submit")} submitLabel={t("employer.actSubmit")} pendingLabel={working} className={inline}>
          {hidden}
        </ActionForm>
      ) : null}
      {job.status === "pending" ? (
        <ActionForm action={act("withdraw")} submitLabel={t("employer.actWithdraw")} pendingLabel={working} tone="quiet" className={inline}>
          {hidden}
        </ActionForm>
      ) : null}
      {job.status === "closed" && !blocked ? (
        <ActionForm action={act("reopen")} submitLabel={t("employer.actReopen")} pendingLabel={working} className={inline}>
          {hidden}
        </ActionForm>
      ) : null}

      {previewHref ? (
        <Link
          href={previewHref}
          className="inline-flex h-11 items-center gap-1.5 rounded-full px-3 text-[14px] font-semibold text-primary-dark transition-colors hover:bg-primary-05"
        >
          {t("employer.preview")}
          <ArrowIcon size={14} />
        </Link>
      ) : null}

      {job.status === "open" ? (
        <details className="group basis-full">
          <summary className="w-fit cursor-pointer rounded-full py-1 text-[14px] font-semibold text-danger underline-offset-4 hover:underline">
            {t("employer.actClose")}
          </summary>
          <ActionForm
            action={act("close")}
            submitLabel={t("employer.actCloseYes")}
            pendingLabel={working}
            tone="danger"
            className="mt-3 max-w-xl rounded-2xl border border-danger/25 bg-danger-05 p-4 [&>button]:mt-3"
          >
            {hidden}
            <p className="text-[14px] leading-relaxed text-ink">{t("employer.actCloseConfirm")}</p>
          </ActionForm>
        </details>
      ) : null}
      {canDelete ? (
        <details className="basis-full">
          <summary className="w-fit cursor-pointer rounded-full py-1 text-[14px] font-semibold text-danger underline-offset-4 hover:underline">
            {t("employer.actDelete")}
          </summary>
          <ActionForm
            action={act("delete")}
            submitLabel={t("employer.actDeleteYes")}
            pendingLabel={working}
            tone="danger"
            className="mt-3 max-w-xl rounded-2xl border border-danger/25 bg-danger-05 p-4 [&>button]:mt-3"
          >
            {hidden}
            <p className="text-[14px] leading-relaxed text-ink">{t("employer.actDeleteConfirm")}</p>
          </ActionForm>
        </details>
      ) : null}
    </div>
  );
}
