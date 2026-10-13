import Image from "next/image";

import { Rosette } from "@/components/ui";
import type { Course } from "@/features/education";

/**
 * A COURSE'S COVER — designed like the certificate it leads to.
 *
 * There is no course photography, and the gym photographs the old design used
 * are exactly what the client rejected. So a course is shown the way a
 * credential is: a deep panel with the certificate linework, a hairline gold
 * frame inset from its edge, the rosette in the corner, and the course's CODE
 * set large — CPT, SCS, SNS — the way the profession actually refers to them.
 *
 * THE CODE comes from the SLUG, never from the title: the title is localized,
 * and initials of an Arabic title would be nonsense. Stopwords are skipped, so
 * `strength-and-conditioning-specialist` is SCS, and the CPD workshops all read
 * CPD.
 *
 * A PHOTOGRAPH WINS. The client sent programme photos on 2026-09-29, and a
 * course that has one shows it — framed the same way (the gold hairline inset
 * from the edge) with a deep wash at its foot for the label, so a row of
 * photographed and drawn covers still reads as one family.
 *
 * THREE GROUNDS, by category, all from the theme: the certifications in the
 * deepest green with gold, the specialised courses in the action green, the
 * CPD workshops in gold with deep ink. A row of mixed courses reads as one
 * family in three voices.
 */
const STOPWORDS = new Set(["and", "of", "the", "for", "in"]);

export function courseCode(slug: string): string {
  const words = slug.split("-").filter((word) => word && !STOPWORDS.has(word));
  if (words[0] === "cpd") return "CPD";
  return words
    .slice(0, 4)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

type Ground = "deep" | "green" | "gold";

function groundFor(course: Course): Ground {
  if (course.categoryIds.includes("ccat-cpd")) return "gold";
  if (course.categoryIds.includes("ccat-specialised")) return "green";
  return "deep";
}

const GROUND: Readonly<Record<Ground, { box: string; code: string; frame: string; rosette: string; label: string }>> = {
  deep: {
    box: "bg-deep",
    code: "text-white",
    frame: "border-accent/35",
    rosette: "text-accent/25",
    label: "text-accent",
  },
  green: {
    box: "bg-primary",
    code: "text-white",
    frame: "border-white/30",
    rosette: "text-white/20",
    label: "text-white/80",
  },
  gold: {
    box: "bg-accent",
    code: "text-deep",
    frame: "border-deep/25",
    rosette: "text-deep/15",
    label: "text-deep/70",
  },
};

export function CourseCover({
  course,
  label,
  priority = false,
  sizes = "(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw",
  className = "",
}: {
  course: Course;
  /** The small line over the code — the category, or "Issued by NCSF". */
  label?: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
}) {
  const image = course.media.find((entry) => entry.kind === "image");

  if (image) {
    return (
      <div className={`relative isolate aspect-[16/10] overflow-hidden rounded-2xl bg-deep ${className}`}>
        <Image
          src={image.url}
          alt=""
          fill
          priority={priority}
          sizes={sizes}
          className="-z-10 object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-linear-to-t from-deep/85 via-deep/15 to-transparent"
        />
        <span aria-hidden="true" className="absolute inset-2.5 rounded-xl border border-white/25" />
        {label ? (
          <p className="absolute start-5 bottom-4 text-[12px] font-semibold text-accent">{label}</p>
        ) : null}
      </div>
    );
  }

  const ground = GROUND[groundFor(course)];

  return (
    <div
      aria-hidden="true"
      className={`relative isolate aspect-[16/10] overflow-hidden rounded-2xl ${ground.box} ${className}`}
    >
      <span className={`pattern-waves absolute inset-0 -z-10 ${ground.code} opacity-[0.06]`} />
      <span
        className={`absolute -end-16 -bottom-20 -z-10 size-64 ${ground.rosette} transition-transform duration-[1.4s] ease-out group-hover:rotate-45`}
      >
        <Rosette className="size-full" />
      </span>
      <span className={`absolute inset-2.5 rounded-xl border ${ground.frame}`} />

      <div className="absolute inset-0 flex flex-col justify-between p-6">
        {label ? <p className={`text-[12px] font-semibold ${ground.label}`}>{label}</p> : <span />}
        <p className={`font-heading text-[2.6rem] leading-none font-bold tracking-tight ${ground.code}`}>
          <span dir="ltr">{courseCode(course.slug)}</span>
        </p>
      </div>
    </div>
  );
}
