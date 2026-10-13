import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { buttonClasses } from "@/components/ui";

import { PortalNotice, PortalShell } from "../../_components/portal/portal-shell";
import type { VerificationBannerCopy } from "./employer-frame";
import { AlertIcon, HourglassIcon } from "./icons";

/**
 * THE EMPLOYER AREA'S FRAME: the shared portal shell, with the company's
 * verification standing said at the top of every page until JoFit has
 * verified it. A pending company can work normally, so its banner is the gold
 * "waiting" tone; a rejected or suspended one cannot publish, so its banner
 * is the danger tone and carries staff's note.
 */
export function EmployerShell({
  banner,
  notice,
  children,
  ...shell
}: Omit<ComponentProps<typeof PortalShell>, "children"> & {
  banner?: VerificationBannerCopy;
  /** A one-off confirmation after an action that redirected here. */
  notice?: string;
  children: ReactNode;
}) {
  return (
    <PortalShell {...shell}>
      {banner ? <VerificationBanner banner={banner} /> : null}
      {notice ? <PortalNotice title={notice} /> : null}
      {children}
    </PortalShell>
  );
}

function VerificationBanner({ banner }: { banner: VerificationBannerCopy }) {
  const waiting = banner.status === "pending";
  return (
    <section
      aria-labelledby="verification-banner"
      className={`mb-6 flex flex-wrap items-start gap-x-6 gap-y-4 rounded-3xl border p-5 sm:p-6 ${
        waiting ? "border-accent/40 bg-accent-10" : "border-danger/25 bg-danger-05"
      }`}
    >
      <span
        aria-hidden="true"
        className={`grid size-11 shrink-0 place-items-center rounded-full ring-1 ${
          waiting ? "bg-surface text-accent-strong ring-accent/40" : "bg-surface text-danger ring-danger/25"
        }`}
      >
        {waiting ? <HourglassIcon size={18} /> : <AlertIcon size={18} />}
      </span>
      <div className="min-w-0 flex-1 basis-72">
        <h2 id="verification-banner" className={`text-[1.05rem] leading-snug ${waiting ? "text-ink" : "text-danger"}`}>
          {banner.title}
        </h2>
        <p className="mt-1.5 max-w-[72ch] text-[14.5px] leading-relaxed text-body">{banner.body}</p>
        {banner.note ? (
          <p className="mt-3 rounded-2xl bg-surface px-4 py-3 text-[14px] text-ink ring-1 ring-danger/15">
            <span className="font-semibold">{banner.noteLabel}: </span>
            <span dir="auto">{banner.note}</span>
          </p>
        ) : null}
      </div>
      {waiting ? null : (
        <Link href={banner.contactHref} className={buttonClasses({ variant: "outline", size: "sm", className: "bg-surface" })}>
          {banner.contactLabel}
        </Link>
      )}
    </section>
  );
}
