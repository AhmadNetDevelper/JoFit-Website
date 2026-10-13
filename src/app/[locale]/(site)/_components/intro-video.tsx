"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { Rosette } from "@/components/ui";

import { clock, IntroTheater, PlayIcon, type TheaterChapter, type TheaterCopy, type TheaterHandle } from "./intro-theater";

/**
 * MEET JOFIT — the introduction film, on the page.
 *
 * The page shows a TRAILER, not the film: a seven-second silent cut of the
 * film's own shots (the lecture, the practical, NCSF Jordan, the Pilates
 * reformer, the logo), looping in the portrait frame while the section is on
 * screen. It weighs 575 KB against the film's 6.6 MB, and the film is not
 * fetched until someone asks for it. Under `prefers-reduced-motion`, or when the
 * visitor has asked to save data, the trailer never starts and the poster
 * stands in for it.
 *
 * A press on the frame — or on any of the film's parts listed beside it — opens
 * the theatre (`intro-theater.tsx`) and plays the film from that point, with
 * sound.
 *
 * The heading is a server-rendered slot (`head`), and every string arrives
 * finished — a translator cannot cross into a client component.
 */
export interface IntroCopy extends TheaterCopy {
  readonly watch: string;
  readonly sealAlt: string;
  readonly sealTitle: string;
  readonly sealBody: string;
}

export function IntroVideo({
  head,
  film,
  poster,
  trailer,
  trailerPoster,
  duration,
  chapters,
  browseHref,
  contactHref,
  copy,
}: {
  head: ReactNode;
  film: string;
  poster: string;
  trailer: string;
  trailerPoster: string;
  /** Seconds — the film's own length, for the badge and the last part's end. */
  duration: number;
  chapters: readonly TheaterChapter[];
  browseHref: string;
  contactHref: string;
  copy: IntroCopy;
}) {
  const theater = useRef<TheaterHandle>(null);
  const preview = useRef<HTMLVideoElement>(null);
  const [rolling, setRolling] = useState(false);
  const [watching, setWatching] = useState(false);

  /* The trailer plays only while it can be seen, and never while the film does. */
  useEffect(() => {
    const element = preview.current;
    if (!element || watching) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saving = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (still || saving) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) element.play().catch(() => {});
        else element.pause();
      },
      { threshold: 0.35 },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      element.pause();
    };
  }, [watching]);

  const open = (start = 0) => theater.current?.open(start);

  return (
    <div className="grid gap-x-16 gap-y-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:grid-rows-[auto_1fr]">
      <div className="lg:col-start-1 lg:row-start-1 lg:self-end">{head}</div>

      {/* THE FRAME. */}
      <figure className="relative mx-auto w-full max-w-[20rem] sm:max-w-[22rem] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute start-1/2 top-1/2 size-[155%] -translate-x-1/2 -translate-y-1/2 text-primary/[0.09] rtl:translate-x-1/2"
        >
          <Rosette className="spin-slow size-full" />
        </span>
        <span
          aria-hidden="true"
          className="absolute inset-0 translate-x-4 translate-y-4 rounded-[2rem] bg-primary/15 rtl:-translate-x-4"
        />

        <button
          type="button"
          onClick={() => open()}
          aria-haspopup="dialog"
          aria-label={`${copy.watch} (${clock(duration)})`}
          className="group relative block aspect-[9/16] w-full overflow-hidden rounded-[2rem] bg-deep shadow-lift ring-1 ring-accent/40 outline-none focus-visible:ring-4 focus-visible:ring-accent"
        >
          <Image
            src={poster}
            alt=""
            fill
            sizes="(min-width: 640px) 352px, 320px"
            className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]"
          />
          <video
            ref={preview}
            src={trailer}
            poster={trailerPoster}
            muted
            loop
            playsInline
            preload="none"
            aria-hidden="true"
            tabIndex={-1}
            onPlaying={() => setRolling(true)}
            className={`absolute inset-0 size-full object-cover transition-[opacity,transform] duration-[1.2s] ease-out group-hover:scale-[1.04] ${
              rolling ? "opacity-100" : "opacity-0"
            }`}
          />

          <span aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-deep/90 via-transparent to-deep/35" />
          <span
            aria-hidden="true"
            className="absolute inset-3 rounded-[1.5rem] border border-accent/50 transition-colors duration-500 group-hover:border-accent group-focus-visible:border-accent"
          />

          <span className="absolute inset-x-0 top-7 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-deep/60 px-3.5 py-1.5 text-[12.5px] font-semibold text-white ring-1 ring-white/15 backdrop-blur-md">
              <span aria-hidden="true" className="relative flex size-2">
                <span className="absolute inset-0 rounded-full bg-accent motion-safe:animate-ping motion-safe:[animation-duration:2s]" />
                <span className="relative size-2 rounded-full bg-accent" />
              </span>
              {copy.badge}
              <span className="text-white/60" dir="ltr">
                {clock(duration)}
              </span>
            </span>
          </span>

          <span
            aria-hidden="true"
            className="absolute start-1/2 top-1/2 grid size-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-accent text-deep shadow-lift ring-[10px] ring-white/15 transition-[transform,box-shadow] duration-300 group-hover:scale-110 group-hover:ring-white/25 group-focus-visible:scale-110 rtl:translate-x-1/2"
          >
            <PlayIcon className="size-7 translate-x-0.5" />
          </span>

          <span className="absolute inset-x-6 bottom-8 text-center">
            <span className="block font-heading text-[1.1rem] leading-snug font-semibold text-white">{copy.watch}</span>
            <span aria-hidden="true" className="mx-auto mt-3 flex max-w-[11rem] items-center gap-2.5 text-accent/70">
              <span className="h-px flex-1 bg-current" />
              <span className="size-1.5 rotate-45 border border-current" />
              <span className="h-px flex-1 bg-current" />
            </span>
          </span>
        </button>

        {/* The film's second line, as the hero's seal card: who stands behind it. */}
        <figcaption className="relative mx-auto mt-6 flex max-w-[16rem] items-center gap-3 rounded-2xl bg-surface p-3.5 pe-5 shadow-lift ring-1 ring-line sm:absolute sm:-start-24 sm:top-[17%] sm:mx-0 sm:mt-0 lg:-start-28">
          <Image src="/images/partners/ncsf-seal.png" alt={copy.sealAlt} width={96} height={96} className="size-12 shrink-0" />
          <span className="min-w-0">
            <span className="block font-heading text-[14px] leading-tight font-semibold text-ink">{copy.sealTitle}</span>
            <span className="mt-0.5 block text-[12px] leading-snug text-body">{copy.sealBody}</span>
          </span>
        </figcaption>
      </figure>

      {/* THE PARTS: each one opens the film at that point. */}
      <div className="lg:col-start-1 lg:row-start-2">
        <p className="eyebrow">{copy.chapters}</p>
        <ol className="mt-5 space-y-3">
          {chapters.map((chapter) => (
            <li key={chapter.start}>
              <button
                type="button"
                onClick={() => open(chapter.start)}
                aria-haspopup="dialog"
                aria-label={`${copy.chapterPlay}: ${chapter.title}`}
                className="group relative flex w-full items-start gap-4 overflow-hidden rounded-3xl border border-line bg-surface/70 p-4 text-start transition-[border-color,background-color,box-shadow,transform] duration-300 outline-none hover:-translate-y-0.5 hover:border-primary/30 hover:bg-surface hover:shadow-soft focus-visible:ring-2 focus-visible:ring-primary sm:gap-5 sm:p-5"
              >
                <span
                  className="grid h-9 min-w-14 shrink-0 place-items-center rounded-full bg-accent-10 px-2.5 font-heading text-[13px] font-bold text-accent-strong transition-colors duration-300 group-hover:bg-primary group-hover:text-on-primary"
                  dir="ltr"
                >
                  {clock(chapter.start)}
                </span>
                <span className="min-w-0 flex-1 pt-1">
                  <span className="block font-heading text-[1.02rem] leading-snug font-semibold text-ink">{chapter.title}</span>
                  <span className="mt-1 block text-[14px] leading-relaxed text-body">{chapter.body}</span>
                </span>
                <span
                  aria-hidden="true"
                  className="mt-1 grid size-8 shrink-0 place-items-center rounded-full text-body/50 ring-1 ring-line transition-colors duration-300 group-hover:bg-primary group-hover:text-on-primary group-hover:ring-primary"
                >
                  <PlayIcon className="size-3.5 translate-x-px" />
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      <IntroTheater
        ref={theater}
        src={film}
        poster={poster}
        duration={duration}
        chapters={chapters}
        browseHref={browseHref}
        contactHref={contactHref}
        copy={copy}
        onOpenChange={setWatching}
      />
    </div>
  );
}
