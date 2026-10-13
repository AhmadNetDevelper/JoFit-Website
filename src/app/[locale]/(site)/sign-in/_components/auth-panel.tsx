import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { JofitLogo } from "@/components/brand/jofit-logo";
import { Rosette } from "@/components/ui";
import { localePath, type Locale, type Translate } from "@/i18n";

/**
 * THE DEEP HALF OF THE ACCOUNT DOORS — sign-in and sign-up share it.
 *
 * The old screens put a gym photograph under a green wash behind a sheared
 * panel. The formal site says who you are signing in to instead, and says it
 * once: the mark, one sentence — the agency, in the owner's own words — and
 * the council's seal. The ground is the heroes' deep green with the
 * certificate linework, a hairline gold frame inset from the edge like the one
 * on a diploma, and the rosette turning slowly in the far corner.
 *
 * `children` sits under the sentence, for what a page has to add (sign-up's
 * three reasons to open an account). Hidden on phones by the caller: there it
 * would only push the form below the fold.
 *
 * `tone` is the sign-in door's colour: the glow in the corner and the frame
 * take the brand green (customers), the gold (coaches) or a white light on the
 * deeper green (employers), so the three doors read as three rooms.
 */
const TONES = {
  primary: {
    box: "bg-deep",
    glow: "bg-[radial-gradient(40rem_28rem_at_10%_0%,color-mix(in_srgb,var(--color-primary)_45%,transparent),transparent_70%)] rtl:bg-[radial-gradient(40rem_28rem_at_90%_0%,color-mix(in_srgb,var(--color-primary)_45%,transparent),transparent_70%)]",
    frame: "border-accent/20",
    rosette: "text-accent/[0.15]",
  },
  accent: {
    box: "bg-deep",
    glow: "bg-[radial-gradient(40rem_28rem_at_10%_0%,color-mix(in_srgb,var(--color-accent)_38%,transparent),transparent_70%)] rtl:bg-[radial-gradient(40rem_28rem_at_90%_0%,color-mix(in_srgb,var(--color-accent)_38%,transparent),transparent_70%)]",
    frame: "border-accent/45",
    rosette: "text-accent/[0.28]",
  },
  deep: {
    box: "bg-deep-2",
    glow: "bg-[radial-gradient(40rem_28rem_at_10%_0%,color-mix(in_srgb,var(--color-surface)_14%,transparent),transparent_70%)] rtl:bg-[radial-gradient(40rem_28rem_at_90%_0%,color-mix(in_srgb,var(--color-surface)_14%,transparent),transparent_70%)]",
    frame: "border-white/20",
    rosette: "text-white/[0.12]",
  },
} as const;

export type AuthPanelTone = keyof typeof TONES;

export function AuthPanel({
  locale,
  t,
  children,
  tone = "primary",
  badge,
  className = "",
}: {
  locale: Locale;
  t: Translate;
  children?: ReactNode;
  tone?: AuthPanelTone;
  /** The door's name and mark, drawn beside the logo. */
  badge?: ReactNode;
  className?: string;
}) {
  const look = TONES[tone];
  return (
    <div
      className={`relative isolate flex min-h-[34rem] flex-col justify-between overflow-hidden rounded-[2rem] ${look.box} p-10 text-white/75 xl:p-12 ${className}`}
    >
      <span aria-hidden="true" className="pattern-waves absolute inset-0 -z-10 text-white/[0.035]" />
      <span aria-hidden="true" className={`absolute inset-0 -z-10 ${look.glow}`} />
      <span aria-hidden="true" className={`absolute -end-44 -bottom-44 -z-10 size-[38rem] ${look.rosette}`}>
        <Rosette className="spin-slow size-full" />
      </span>
      <span aria-hidden="true" className={`absolute inset-4 -z-10 rounded-[1.5rem] border ${look.frame}`} />
      <span
        aria-hidden="true"
        className="absolute inset-x-10 bottom-0 h-px bg-linear-to-r from-transparent via-accent/60 to-transparent"
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href={localePath(locale, "/")} className="w-fit rounded-lg">
          <JofitLogo variant="full" title={t("site.name")} className="jf-logo-lift h-12 w-auto" />
        </Link>
        {badge}
      </div>

      <div className="mt-16">
        <p className="max-w-[26ch] font-heading text-[2.1rem] leading-[1.25] font-bold text-balance text-white xl:text-[2.4rem]">
          {t("landing.heroEyebrow")}
        </p>

        {children}

        <div className="mt-10 inline-flex items-center gap-3 rounded-2xl bg-white/[0.06] p-3 pe-5 ring-1 ring-white/15 backdrop-blur-sm">
          <Image
            src="/images/partners/ncsf-seal.png"
            alt={t("site.ncsfSealAlt")}
            width={96}
            height={96}
            className="size-11 shrink-0"
          />
          <span className="min-w-0">
            <span className="block text-[13.5px] leading-snug font-semibold text-white">{t("landing.heroSealTitle")}</span>
            <span className="mt-0.5 block text-[12px] leading-snug text-white/60">{t("landing.heroSealBody")}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
