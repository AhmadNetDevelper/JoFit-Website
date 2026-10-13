"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";

/**
 * A COACH'S GALLERY, AND THE LIGHTBOX THAT OPENS IT.
 *
 * The grid shows at most five photographs. The FIRST IS THE COVER — the order
 * staff set in the admin is the order here, and the first one takes the large
 * tile — and when there are more than five the last tile carries the count of
 * the rest, which open in the same lightbox.
 *
 * The lightbox is a native `<dialog>` opened with `showModal()`, which is what
 * keeps it simple AND keyboard-friendly: the page behind it becomes inert,
 * focus moves into it, Escape closes it, and closing returns focus to the tile
 * that opened it. On top of that, the arrow keys page through the photos —
 * mirrored in Arabic, where "next" is to the left — and Home/End jump to the
 * ends. Nothing animates: it opens, it shows the photograph, it closes.
 *
 * It receives finished strings only (`copy`), one per photo where the wording
 * carries a number, because a translator cannot cross into a client
 * component.
 */
export interface GalleryImageView {
  readonly id: string;
  readonly url: string;
  readonly alt: string;
}

export interface CoachGalleryCopy {
  /** The dialog's name: "Photos of Layla Haddad". */
  readonly dialog: string;
  /** One per photo, in order: "Open photo 2 of 5 — {alt}". */
  readonly open: readonly string[];
  /** One per photo, in order: "2 of 5". */
  readonly counter: readonly string[];
  readonly close: string;
  readonly previous: string;
  readonly next: string;
}

/** How many tiles the grid draws; the rest are reached from the lightbox. */
const VISIBLE = 5;

/*
 * Spans per tile, by how many tiles there are, written out whole so Tailwind
 * finds every class. Phones get two columns — the cover across both, the rest
 * in pairs, a last odd one across both. From `lg` it is four columns with the
 * cover two by two, the classic mosaic, arranged so no count leaves a hole.
 */
const SPANS: Readonly<Record<number, readonly string[]>> = {
  1: ["col-span-2 row-span-2 lg:col-span-4"],
  2: ["col-span-2 row-span-2", "col-span-2 lg:row-span-2"],
  3: ["col-span-2 row-span-2", "lg:col-span-2", "lg:col-span-2"],
  4: ["col-span-2 row-span-2", "lg:col-span-2", "", "col-span-2 lg:col-span-1"],
  5: ["col-span-2 row-span-2", "", "", "", ""],
};

function ChevronIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="m10 3.5-4.5 4.5 4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="m3.5 3.5 9 9m0-9-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function CoachGallery({ images, copy }: { images: readonly GalleryImageView[]; copy: CoachGalleryCopy }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const tiles = useRef<(HTMLButtonElement | null)[]>([]);
  /** The tile focus goes back to when the lightbox closes. */
  const opener = useRef(0);
  const [current, setCurrent] = useState<number | null>(null);

  const total = images.length;
  const shown = images.slice(0, VISIBLE);
  const hidden = total - shown.length;
  const spans = SPANS[shown.length] ?? SPANS[VISIBLE]!;

  useEffect(() => {
    const element = dialog.current;
    if (current === null || !element || element.open) return;
    element.showModal();
    /* The dialog covers the page; the page must not scroll under it. */
    document.documentElement.style.overflow = "hidden";
  }, [current]);

  /* Leaving the page with the lightbox open must not leave the page locked. */
  useEffect(
    () => () => {
      document.documentElement.style.overflow = "";
    },
    [],
  );

  const open = (index: number) => {
    opener.current = index;
    setCurrent(index);
  };

  const step = (by: number) => setCurrent((index) => (index === null ? index : (index + by + total) % total));

  const onClose = () => {
    setCurrent(null);
    document.documentElement.style.overflow = "";
    tiles.current[opener.current]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (total < 2) return;
    /* In a right-to-left page the next photograph is to the left. */
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
    const forward = rtl ? "ArrowLeft" : "ArrowRight";
    const back = rtl ? "ArrowRight" : "ArrowLeft";
    if (event.key === forward) step(1);
    else if (event.key === back) step(-1);
    else if (event.key === "Home") setCurrent(0);
    else if (event.key === "End") setCurrent(total - 1);
    else return;
    event.preventDefault();
  };

  /* A click on the dialog's own ground — not on a photo or a control — closes it. */
  const onClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) event.currentTarget.close();
  };

  const image = current === null ? undefined : images[current];

  return (
    <>
      <ul className="grid auto-rows-[140px] grid-cols-2 gap-3 sm:auto-rows-[190px] lg:auto-rows-[200px] lg:grid-cols-4 lg:gap-4">
        {shown.map((entry, index) => {
          const more = index === shown.length - 1 && hidden > 0;
          return (
            <li key={entry.id} className={spans[index]}>
              <button
                type="button"
                ref={(element) => {
                  tiles.current[index] = element;
                }}
                onClick={() => open(index)}
                aria-label={copy.open[index]}
                aria-haspopup="dialog"
                className="group relative block size-full cursor-zoom-in overflow-hidden rounded-2xl bg-deep-2 ring-1 ring-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <Image
                  src={entry.url}
                  alt={entry.alt}
                  fill
                  sizes={index === 0 ? "(min-width: 1024px) 600px, 100vw" : "(min-width: 1024px) 300px, 50vw"}
                  className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
                {more ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 flex items-center justify-center bg-deep/70 font-heading text-[30px] font-bold text-white"
                  >
                    <span dir="ltr">{`+${hidden}`}</span>
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>

      <dialog
        ref={dialog}
        aria-label={copy.dialog}
        onClose={onClose}
        onKeyDown={onKeyDown}
        onClick={onClick}
        className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden border-0 bg-deep p-0 text-white backdrop:bg-deep open:flex open:flex-col"
      >
        {image && current !== null ? (
          <>
            <div className="flex shrink-0 items-center justify-between gap-4 px-4 py-4 sm:px-6">
              <p aria-live="polite" className="text-[14px] text-white/75">
                {copy.counter[current]}
              </p>
              <button
                type="button"
                autoFocus
                onClick={() => dialog.current?.close()}
                aria-label={copy.close}
                className="flex size-11 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/15 transition-colors hover:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <CloseIcon />
              </button>
            </div>

            <figure className="flex min-h-0 flex-1 flex-col px-4 pb-6 sm:px-20">
              <div className="relative min-h-0 w-full flex-1">
                <Image
                  key={image.id}
                  src={image.url}
                  alt={image.alt}
                  fill
                  sizes="100vw"
                  className="object-contain"
                />
              </div>
              {image.alt ? (
                <figcaption className="mt-4 shrink-0 text-center text-[14px] text-white/80" dir="auto">
                  {image.alt}
                </figcaption>
              ) : null}
            </figure>

            {total > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label={copy.previous}
                  className="absolute top-1/2 start-2 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/15 transition-colors hover:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:start-5"
                >
                  <span className="rtl:-scale-x-100">
                    <ChevronIcon />
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label={copy.next}
                  className="absolute top-1/2 end-2 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/15 transition-colors hover:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:end-5"
                >
                  <span className="-scale-x-100 rtl:scale-x-100">
                    <ChevronIcon />
                  </span>
                </button>
              </>
            ) : null}
          </>
        ) : null}
      </dialog>
    </>
  );
}
