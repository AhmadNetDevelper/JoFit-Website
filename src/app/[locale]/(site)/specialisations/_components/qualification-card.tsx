import Link from "next/link";

import { ArrowIcon, Rosette } from "@/components/ui";
import type { Course } from "@/features/education";

import { CourseCover, courseCode } from "../../education/_components/course-cover";
import { CertificateIcon } from "../../education/_components/icons";

/**
 * ONE OF THE SIX QUALIFICATIONS.
 *
 * It wears the certificate cover of the course it leads to — the same cover
 * the catalogue shows, so "CPT" on this page and "CPT" on the course card are
 * visibly one thing — with the qualification's number set in a gold seal on
 * the cover's edge. The name, the page's own verified description, the
 * certificate it ends in (from the course's data, when the course is on file)
 * and one way in: the course page, or for the CPD workshops the workshops'
 * track. The whole card is one link through the title's `::after`.
 *
 * `layout="row"` lays the cover beside the text, for the specialised courses'
 * list; the default stacks it, for the certifications' grid.
 *
 * If the catalogue does not hold the course (a backend that has not published
 * it yet), the cover is drawn from the slug alone and the certificate line is
 * left out — the card never invents what the data does not say.
 */
export function QualificationCard({
  index,
  name,
  body,
  href,
  action,
  course,
  coverSlug,
  coverLabel,
  certificate,
  layout = "stack",
  priority = false,
}: {
  index: string;
  name: string;
  body: string;
  href: string;
  action: string;
  course?: Course;
  /** Used for the fallback cover's code when `course` is absent. */
  coverSlug: string;
  coverLabel?: string;
  /** The certificate the course ends in, when the course carries one. */
  certificate?: string;
  layout?: "stack" | "row";
  priority?: boolean;
}) {
  const row = layout === "row";

  const cover = course ? (
    <CourseCover
      course={course}
      label={coverLabel}
      priority={priority}
      sizes={row ? "(min-width: 640px) 240px, 100vw" : "(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"}
    />
  ) : (
    <div aria-hidden="true" className="relative isolate aspect-[16/10] overflow-hidden rounded-2xl bg-deep">
      <span className="absolute -end-16 -bottom-20 -z-10 size-64 text-accent/25">
        <Rosette className="size-full" />
      </span>
      <span className="absolute inset-2.5 rounded-xl border border-accent/35" />
      <p className="absolute inset-x-6 bottom-6 font-heading text-[2.6rem] leading-none font-bold tracking-tight text-white">
        <span dir="ltr">{courseCode(coverSlug)}</span>
      </p>
    </div>
  );

  return (
    <article
      className={`group relative flex h-full w-full rounded-3xl border border-line bg-surface p-3 shadow-soft transition-[transform,box-shadow,border-color] duration-300 focus-within:border-primary/40 hover:-translate-y-1 hover:border-primary/25 hover:shadow-lift ${
        row ? "flex-col sm:flex-row sm:items-stretch sm:gap-2" : "flex-col"
      }`}
    >
      <div className={`relative shrink-0 ${row ? "sm:w-60 sm:self-start" : ""}`}>
        {cover}
        {/* The seal straddles the cover's edge, so it sits OUTSIDE the cover's
            clipping box, positioned against this wrapper. */}
        <span
          aria-hidden="true"
          className="absolute -bottom-6 end-6 grid size-12 place-items-center rounded-full bg-deep-2 font-heading text-[15px] font-bold text-accent ring-1 ring-accent/60 ring-offset-4 ring-offset-surface"
          dir="ltr"
        >
          {index}
        </span>
      </div>

      <div className={`flex flex-1 flex-col px-3 pb-3 ${row ? "pt-9 sm:px-5 sm:pt-5" : "pt-9"}`}>
        <h3 className={`text-[1.15rem] leading-snug ${row ? "" : "line-clamp-2 min-h-[3.1rem]"}`}>
          <Link href={href} className="after:absolute after:inset-0 after:rounded-3xl after:content-['']">
            {name}
          </Link>
        </h3>
        <p className={`mt-2.5 text-[14.5px] leading-relaxed text-body ${row ? "" : "min-h-[4.9rem]"}`}>{body}</p>

        {certificate ? (
          <p className="mt-4 flex items-start gap-2.5 rounded-2xl bg-canvas px-4 py-3 text-[12.5px] leading-snug text-body">
            <span className="mt-px shrink-0 text-accent-strong">
              <CertificateIcon size={15} />
            </span>
            {certificate}
          </p>
        ) : null}

        <p className="mt-auto flex items-center justify-between gap-3 pt-5 text-[14px] font-semibold text-primary">
          {action}
          <span className="grid size-10 shrink-0 place-items-center rounded-full border border-line text-primary transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-on-primary">
            <ArrowIcon />
          </span>
        </p>
      </div>
    </article>
  );
}
