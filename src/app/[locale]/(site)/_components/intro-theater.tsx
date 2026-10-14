"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type Ref,
} from "react";

import { JofitLogo } from "@/components/brand/jofit-logo";
import { buttonClasses, Rosette } from "@/components/ui";

/**
 * THE THEATRE — the introduction film, played properly.
 *
 * A native `<dialog>` opened with `showModal()`: the page behind goes inert,
 * Escape closes it, and focus goes back to whatever opened it. Inside, the film
 * stands in its own portrait frame on the deep green, the rosette turning
 * behind it; on a phone it fills the screen, the way a portrait film is meant
 * to be watched.
 *
 * THE PLAYER IS OUR OWN, not the browser's, so it looks the same everywhere and
 * speaks the page's language:
 *
 *   timeline   one bar cut into the film's parts, story-style; each part fills
 *              in gold as it plays. It is a slider: click or drag anywhere on
 *              it, or focus it and use the arrow keys / Home / End.
 *   part       the name of the part playing, under the bar.
 *   controls   play/pause, the clock, sound, full screen. They fade away while
 *              the film plays and come back on any movement, tap or key.
 *   keys       Space or K plays/pauses, ← → skip five seconds, M sound,
 *              F full screen.
 *   end        an end card: watch again, browse the courses, talk to us.
 *
 * The timeline and the clock are left-to-right in both languages — a media
 * timeline runs that way everywhere — while everything else mirrors.
 *
 * OPENING PLAYS IN THE SAME CLICK. Phones only allow sound when `play()` is
 * called inside the tap that asked for it, so `open()` is imperative (a ref
 * handle) rather than a state change that would play a frame later.
 */
export interface TheaterChapter {
  readonly start: number;
  readonly title: string;
  readonly body: string;
}

export interface TheaterCopy {
  readonly dialog: string;
  readonly eyebrow: string;
  /** "Introduction" — set before the film's length above the parts. */
  readonly badge: string;
  readonly close: string;
  readonly play: string;
  readonly pause: string;
  readonly mute: string;
  readonly unmute: string;
  readonly fullscreen: string;
  readonly timeline: string;
  readonly chapters: string;
  readonly chapterPlay: string;
  readonly replay: string;
  readonly endTitle: string;
  readonly endBody: string;
  readonly browse: string;
  readonly contact: string;
}

export interface TheaterHandle {
  open: (start?: number) => void;
}

const SKIP = 5;
const IDLE_AFTER = 2600;

export function IntroTheater({
  ref,
  src,
  poster,
  duration,
  chapters,
  browseHref,
  contactHref,
  copy,
  onOpenChange,
}: {
  ref: Ref<TheaterHandle>;
  src: string;
  poster: string;
  duration: number;
  chapters: readonly TheaterChapter[];
  browseHref: string;
  contactHref: string;
  copy: TheaterCopy;
  onOpenChange?: (open: boolean) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [length, setLength] = useState(duration);
  const [muted, setMuted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [idle, setIdle] = useState(false);
  const [poke, setPoke] = useState(0);

  const seek = useCallback((to: number) => {
    const element = video.current;
    if (!element) return;
    const target = Math.min(Math.max(0, to), (element.duration || duration) - 0.05);
    setTime(target);
    setEnded(false);
    if (element.readyState >= 1) element.currentTime = target;
    else element.addEventListener("loadedmetadata", () => (element.currentTime = target), { once: true });
  }, [duration]);

  const play = useCallback(() => {
    video.current?.play().catch(() => setPlaying(false));
  }, []);

  const toggle = useCallback(() => {
    const element = video.current;
    if (!element) return;
    if (element.paused) {
      if (ended) seek(0);
      play();
    } else element.pause();
  }, [ended, play, seek]);

  useImperativeHandle(ref, () => ({
    open: (start = 0) => {
      const element = dialog.current;
      if (!element) return;
      opener.current = document.activeElement as HTMLElement | null;
      if (!element.open) {
        element.showModal();
        /* The dialog covers the page; the page must not scroll under it. */
        document.documentElement.style.overflow = "hidden";
        onOpenChange?.(true);
      }
      setIdle(false);
      seek(start);
      play();
    },
  }), [onOpenChange, play, seek]);

  /* Leaving the page with the theatre open must not leave the page locked. */
  useEffect(
    () => () => {
      document.documentElement.style.overflow = "";
    },
    [],
  );

  /* The clock, read every frame while playing, so the gold fills smoothly. */
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    const tick = () => {
      if (video.current) setTime(video.current.currentTime);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  /* The controls step aside while the film plays, and come back when asked. */
  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => setIdle(true), IDLE_AFTER);
    return () => window.clearTimeout(timer);
  }, [playing, poke]);

  const wake = () => {
    setIdle(false);
    setPoke((count) => count + 1);
  };

  const onClose = () => {
    video.current?.pause();
    document.documentElement.style.overflow = "";
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    onOpenChange?.(false);
    opener.current?.focus();
  };

  const fullscreen = () => {
    const element = stage.current;
    const player = video.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    else if (element?.requestFullscreen) void element.requestFullscreen().catch(() => {});
    else player?.webkitEnterFullscreen?.(); // iPhone: only the video itself can go full screen
  };

  const mute = () => {
    const element = video.current;
    if (!element) return;
    element.muted = !element.muted;
    setMuted(element.muted);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    const onControl = (event.target as HTMLElement).closest("button, a");
    const key = event.key.toLowerCase();
    if ((key === " " && !onControl) || key === "k") toggle();
    else if (key === "arrowright") seek(time + SKIP);
    else if (key === "arrowleft") seek(time - SKIP);
    else if (key === "m") mute();
    else if (key === "f") fullscreen();
    else return;
    event.preventDefault();
    wake();
  };

  /* THE TIMELINE AS A SLIDER: a press anywhere seeks, and dragging scrubs. */
  const scrubTo = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    seek(((event.clientX - box.left) / box.width) * length);
  };

  const onSliderKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const keys: Record<string, number> = {
      ArrowRight: time + SKIP,
      ArrowUp: time + SKIP,
      ArrowLeft: time - SKIP,
      ArrowDown: time - SKIP,
      Home: 0,
      End: length,
    };
    const to = keys[event.key];
    if (to === undefined) return;
    event.preventDefault();
    event.stopPropagation();
    seek(to);
    wake();
  };

  const current = Math.max(0, chapters.findLastIndex((chapter) => time >= chapter.start));
  const hide = idle && playing && !ended;
  const fade = `transition-opacity duration-500 ${hide ? "pointer-events-none opacity-0" : "opacity-100"}`;

  const closeButton = (className: string) => (
    <button
      type="button"
      onClick={() => dialog.current?.close()}
      aria-label={copy.close}
      className={`size-11 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/20 backdrop-blur-md transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${className}`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M6 6l12 12M18 6 6 18" />
      </svg>
    </button>
  );

  return (
    <dialog
      ref={dialog}
      aria-label={copy.dialog}
      onClose={onClose}
      onKeyDown={onKeyDown}
      onPointerMove={wake}
      style={{ ["--color-accent" as string]: "#d4b36a" }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden border-0 bg-transparent p-0 text-white backdrop:bg-transparent open:flex"
    >
      {/* THE GROUND: deep green, the linework, the rosette. A click on it closes. */}
      <div
        aria-hidden="true"
        onClick={() => dialog.current?.close()}
        className="absolute inset-0 bg-deep/95 backdrop-blur-xl motion-safe:animate-[enter-fade_0.4s_ease-out_both]"
      >
        <span className="pattern-waves absolute inset-0 text-white/[0.035]" />
        <span className="absolute -top-40 start-1/2 size-[44rem] -translate-x-1/2 rounded-full bg-primary/25 blur-3xl rtl:translate-x-1/2" />
        <span className="absolute start-1/2 top-1/2 size-[64rem] -translate-x-1/2 -translate-y-1/2 text-accent/[0.07] rtl:translate-x-1/2">
          <Rosette className="spin-slow size-full" />
        </span>
      </div>

      {closeButton("fixed end-6 top-6 z-30 hidden md:grid")}

      <div className="pointer-events-none relative z-10 m-auto flex w-full items-center justify-center gap-14 md:px-10">
        {/* THE STAGE. */}
        <div
          ref={stage}
          onClick={(event) => {
            if (event.target !== event.currentTarget && event.target !== video.current) return;
            if (hide) wake();
            else toggle();
          }}
          className={`pointer-events-auto relative h-dvh w-full overflow-hidden bg-black select-none motion-safe:animate-[enter-scale_0.6s_cubic-bezier(0.22,1,0.36,1)_both] md:aspect-[9/16] md:h-[min(88dvh,54rem)] md:w-auto md:rounded-[2rem] md:shadow-lift md:ring-1 md:ring-accent/40 ${
            hide ? "cursor-none" : "cursor-pointer"
          }`}
        >
          <video
            ref={video}
            src={src}
            poster={poster}
            preload="none"
            playsInline
            className="absolute inset-0 size-full object-cover"
            onPlay={() => {
              setPlaying(true);
              setEnded(false);
            }}
            onPause={() => setPlaying(false)}
            onWaiting={() => setBuffering(true)}
            onPlaying={() => setBuffering(false)}
            onCanPlay={() => setBuffering(false)}
            onLoadedMetadata={(event) => setLength(event.currentTarget.duration || duration)}
            onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
            onVolumeChange={(event) => setMuted(event.currentTarget.muted)}
            onEnded={() => {
              setPlaying(false);
              setEnded(true);
              setIdle(false);
            }}
          />

          {/* TOP: the timeline, and the part playing. */}
          <div className={`absolute inset-x-0 top-0 z-10 bg-linear-to-b from-black/75 via-black/30 to-transparent px-4 pt-[max(0.9rem,env(safe-area-inset-top))] pb-14 sm:px-5 ${fade}`}>
            <div
              role="slider"
              tabIndex={0}
              aria-label={copy.timeline}
              aria-valuemin={0}
              aria-valuemax={Math.round(length)}
              aria-valuenow={Math.round(time)}
              aria-valuetext={`${clock(time)} / ${clock(length)}`}
              dir="ltr"
              onKeyDown={onSliderKey}
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                scrubTo(event);
              }}
              onPointerMove={(event) => {
                if (event.currentTarget.hasPointerCapture(event.pointerId)) scrubTo(event);
              }}
              className="group/bar flex h-6 cursor-pointer touch-none items-center gap-1 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-black/40"
            >
              {chapters.map((chapter, index) => {
                const end = chapters[index + 1]?.start ?? length;
                const filled = Math.min(1, Math.max(0, (time - chapter.start) / (end - chapter.start)));
                return (
                  <span
                    key={chapter.start}
                    style={{ flexGrow: end - chapter.start }}
                    className="relative h-1 basis-0 overflow-hidden rounded-full bg-white/25 transition-[height] duration-200 group-hover/bar:h-1.5"
                  >
                    <span className="absolute inset-y-0 left-0 rounded-full bg-accent" style={{ width: `${filled * 100}%` }} />
                  </span>
                );
              })}
            </div>

            <div className="mt-3 flex items-center gap-3">
              <span className="font-heading text-[13px] font-bold text-accent" dir="ltr">
                {String(current + 1).padStart(2, "0")}
              </span>
              <span aria-live="polite" className="min-w-0 flex-1 truncate font-heading text-[15px] font-semibold text-white">
                {chapters[current]?.title}
              </span>
              {closeButton("grid shrink-0 md:hidden")}
            </div>
          </div>

          {/* CENTRE: the big button while paused, a ring while loading. */}
          {buffering && playing ? (
            <span aria-hidden="true" className="pointer-events-none absolute start-1/2 top-1/2 size-14 -translate-x-1/2 -translate-y-1/2 animate-spin rounded-full border-2 border-white/20 border-t-accent rtl:translate-x-1/2" />
          ) : null}
          {!playing && !ended ? (
            <button
              type="button"
              onClick={toggle}
              aria-label={copy.play}
              className="absolute start-1/2 top-1/2 z-10 grid size-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-accent text-deep shadow-lift ring-[10px] ring-white/15 transition-transform duration-300 hover:scale-105 focus-visible:scale-105 focus-visible:outline-none focus-visible:ring-white/40 rtl:translate-x-1/2"
            >
              <PlayIcon className="size-7 translate-x-0.5" />
            </button>
          ) : null}

          {/* BOTTOM: the controls. */}
          <div className={`absolute inset-x-0 bottom-0 z-10 bg-linear-to-t from-black/75 via-black/30 to-transparent px-4 pt-16 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-5 ${fade}`}>
            <div className="flex items-center gap-2.5">
              <ControlButton label={playing ? copy.pause : copy.play} onClick={toggle}>
                {playing ? <PauseIcon /> : <PlayIcon className="size-[18px] translate-x-px" />}
              </ControlButton>
              <span className="font-heading text-[13px] font-semibold text-white tabular-nums" dir="ltr">
                {clock(time)} <span className="text-white/50">/ {clock(length)}</span>
              </span>
              <span className="flex-1" />
              <ControlButton label={muted ? copy.unmute : copy.mute} onClick={mute}>
                <SoundIcon muted={muted} />
              </ControlButton>
              <ControlButton label={copy.fullscreen} onClick={fullscreen}>
                <FullscreenIcon />
              </ControlButton>
            </div>
          </div>

          {/* THE END CARD. */}
          {ended ? (
            <div className="absolute inset-0 z-20 grid place-items-center bg-deep/85 p-8 text-center backdrop-blur-md motion-safe:animate-[enter-fade_0.5s_ease-out_both]">
              <span aria-hidden="true" className="pointer-events-none absolute start-1/2 top-1/2 size-[40rem] -translate-x-1/2 -translate-y-1/2 text-accent/[0.12] rtl:translate-x-1/2">
                <Rosette className="spin-slow size-full" />
              </span>
              <span aria-hidden="true" className="pointer-events-none absolute inset-3 rounded-[1.5rem] border border-accent/40 md:inset-4" />
              <div className="relative max-w-[18rem]">
                <JofitLogo variant="full" className="jf-logo-lift mx-auto h-12 w-auto" />
                <span aria-hidden="true" className="mx-auto mt-6 flex max-w-[9rem] items-center gap-2.5 text-accent/70">
                  <span className="h-px flex-1 bg-current" />
                  <span className="size-1.5 rotate-45 border border-current" />
                  <span className="h-px flex-1 bg-current" />
                </span>
                <p className="mt-5 font-heading text-[1.6rem] leading-snug font-bold text-white">{copy.endTitle}</p>
                <p className="mt-3 text-[14.5px] leading-relaxed text-white/70">{copy.endBody}</p>
                <div className="mt-8 flex flex-col gap-3">
                  <Link href={browseHref} className={buttonClasses({ variant: "gold" })}>
                    {copy.browse}
                  </Link>
                  <Link href={contactHref} className={buttonClasses({ variant: "ghostDark" })}>
                    {copy.contact}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      seek(0);
                      play();
                    }}
                    className="mt-1 inline-flex items-center justify-center gap-2 text-[14px] font-semibold text-accent hover:text-white"
                  >
                    <ReplayIcon />
                    {copy.replay}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* THE PARTS, beside the film on a wide screen. */}
        <aside className="pointer-events-auto hidden w-[21rem] shrink-0 motion-safe:animate-[enter-rise_0.7s_cubic-bezier(0.22,1,0.36,1)_0.15s_both] lg:block xl:w-[23rem]">
          <p className="eyebrow" data-tone="dark">
            {copy.badge}
            <span className="text-white/50" dir="ltr">
              {clock(length)}
            </span>
          </p>
          <h2 className="mt-3 text-[1.85rem] leading-[1.2] text-white">{copy.dialog}</h2>
          <p className="mt-8 text-[13px] font-semibold text-white/50">{copy.chapters}</p>
          <ol className="mt-3 space-y-2.5">
            {chapters.map((chapter, index) => {
              const active = index === current && (playing || time > 0) && !ended;
              const end = chapters[index + 1]?.start ?? length;
              const filled = active ? Math.min(1, Math.max(0, (time - chapter.start) / (end - chapter.start))) : 0;
              return (
                <li key={chapter.start}>
                  <button
                    type="button"
                    onClick={() => {
                      seek(chapter.start);
                      play();
                    }}
                    aria-current={active ? "step" : undefined}
                    aria-label={`${copy.chapterPlay}: ${chapter.title}`}
                    className={`group relative flex w-full items-start gap-4 overflow-hidden rounded-2xl border p-4 text-start transition-colors duration-300 outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                      active ? "border-accent/50 bg-white/[0.09]" : "border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]"
                    }`}
                  >
                    <span
                      className={`grid h-8 min-w-13 shrink-0 place-items-center rounded-full px-2 font-heading text-[12.5px] font-bold transition-colors ${
                        active ? "bg-accent text-deep" : "bg-accent/15 text-accent"
                      }`}
                      dir="ltr"
                    >
                      {clock(chapter.start)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-heading text-[15px] leading-snug font-semibold text-white">{chapter.title}</span>
                      <span className="mt-1 block text-[13px] leading-relaxed text-white/60">{chapter.body}</span>
                    </span>
                    {active ? (
                      <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 bg-white/10">
                        <span
                          className="block h-full origin-left bg-accent rtl:origin-right"
                          style={{ transform: `scaleX(${filled})` }}
                        />
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ol>
        </aside>
      </div>
    </dialog>
  );
}

/* ------------------------------------------------------------------------- */

/** `39` → `0:39`. Latin digits, as the site sets numbers in both languages. */
export function clock(seconds: number) {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

function ControlButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid size-11 shrink-0 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/15 backdrop-blur-md transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      {children}
    </button>
  );
}

/** A play triangle points right in every language. */
export function PlayIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M8 5.6v12.8a1 1 0 0 0 1.52.85l10.2-6.4a1 1 0 0 0 0-1.7L9.52 4.75A1 1 0 0 0 8 5.6Z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6" y="5" width="4" height="14" rx="1.2" />
      <rect x="14" y="5" width="4" height="14" rx="1.2" />
    </svg>
  );
}

function SoundIcon({ muted }: { muted: boolean }) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Z" fill="currentColor" stroke="none" />
      {muted ? <path d="m16 9.5 5 5m0-5-5 5" /> : <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />}
    </svg>
  );
}

function FullscreenIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
    </svg>
  );
}

function ReplayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5" />
      <path d="M4 4v4.5h4.5" />
    </svg>
  );
}
