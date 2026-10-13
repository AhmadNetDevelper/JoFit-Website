"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";

interface Item {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly href: string;
  readonly createdAt: string;
  readonly isRead: boolean;
}

interface Feed {
  readonly items: readonly Item[];
  readonly unreadCount: number;
}

export interface NotificationBellLabels {
  readonly title: string;
  /** "Notifications, {count} unread". */
  readonly open: string;
  readonly empty: string;
  readonly markAll: string;
}

/* The bell only exists for someone signed in; the readable display cookie is
   how a client component knows that without asking the server. */
const DISPLAY_COOKIE = "jofit.account=";
const subscribe = () => () => {};
const signedIn = () => document.cookie.split("; ").some((part) => part.startsWith(DISPLAY_COOKIE));
const onServer = () => false;

/** How often the bell asks while the tab is visible. */
const POLL_MS = 20_000;

/*
 * ONE FEED FOR EVERY BELL ON THE PAGE. The header mounts two — the desktop
 * strip's and the phone bar's, one hidden by CSS — and each polling on its own
 * would double the requests for the same answer. They subscribe to this
 * instead: the first subscriber starts the poll, the last one stops it.
 */
interface FeedState {
  readonly feed: Feed;
  /** When the feed was read: "5 minutes ago" is measured from here, so rendering stays pure. */
  readonly readAt: number;
}

const EMPTY_STATE: FeedState = { feed: { items: [], unreadCount: 0 }, readAt: 0 };
let current: FeedState = EMPTY_STATE;
const listeners = new Set<() => void>();
let feedLocale = "en";

function emit(next: FeedState) {
  current = next;
  listeners.forEach((listener) => listener());
}

async function refresh() {
  try {
    const response = await fetch(`/api/notifications?locale=${feedLocale}`, { cache: "no-store" });
    if (response.ok) emit({ feed: (await response.json()) as Feed, readAt: Date.now() });
  } catch {
    /* Offline for a moment: keep what is shown. */
  }
}

let stopPolling: (() => void) | undefined;

function startPolling() {
  const first = window.setTimeout(() => void refresh(), 0);
  const timer = window.setInterval(() => document.visibilityState === "visible" && void refresh(), POLL_MS);
  const onVisible = () => document.visibilityState === "visible" && void refresh();
  document.addEventListener("visibilitychange", onVisible);
  return () => {
    window.clearTimeout(first);
    window.clearInterval(timer);
    document.removeEventListener("visibilitychange", onVisible);
  };
}

function subscribeFeed(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) stopPolling = startPolling();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) stopPolling?.();
  };
}

const readFeed = () => current;
const serverFeed = () => EMPTY_STATE;
const noSubscription = () => () => {};

async function markRead(ids?: readonly string[]) {
  const { feed } = current;
  const newlyRead = ids
    ? feed.items.filter((item) => ids.includes(item.id) && !item.isRead).length
    : feed.unreadCount;
  emit({
    ...current,
    feed: {
      items: feed.items.map((item) => (!ids || ids.includes(item.id) ? { ...item, isRead: true } : item)),
      unreadCount: Math.max(0, feed.unreadCount - newlyRead),
    },
  });
  await fetch("/api/notifications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ids ? { ids } : {}),
  }).catch(() => undefined);
}

/**
 * THE BELL, for customers and coaches.
 *
 * It polls `/api/notifications` — a route on this site's own server, which
 * reads the session cookie and asks the API; the browser never holds a token.
 * Twenty seconds while the tab is visible, straight away when it becomes
 * visible again, and not at all in a background tab.
 */
export function NotificationBell({
  locale,
  labels,
  className,
}: {
  locale: "en" | "ar";
  labels: NotificationBellLabels;
  className?: string;
}) {
  const active = useSyncExternalStore(subscribe, signedIn, onServer);
  const { feed, readAt } = useSyncExternalStore(active ? subscribeFeed : noSubscription, readFeed, serverFeed);
  /* The first fetch is deferred a tick, so it already asks in this language. */
  useEffect(() => {
    feedLocale = locale;
  }, [locale]);
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const root = useRef<HTMLDivElement>(null);

  /* Outside click and Escape close the panel, as every menu on the site does. */
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!active) return null;

  const when = new Intl.RelativeTimeFormat(locale === "ar" ? "ar-JO-u-nu-latn" : "en-GB", { numeric: "auto" });
  const ago = (iso: string) => {
    const minutes = Math.round((Date.parse(iso) - readAt) / 60_000);
    if (Math.abs(minutes) < 60) return when.format(minutes, "minute");
    const hours = Math.round(minutes / 60);
    if (Math.abs(hours) < 24) return when.format(hours, "hour");
    return when.format(Math.round(hours / 24), "day");
  };

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={labels.open.replace("{count}", String(feed.unreadCount))}
        onClick={() => setOpen((value) => !value)}
        className={`relative inline-flex cursor-pointer items-center ${className ?? ""}`}
      >
        <BellIcon />
        {feed.unreadCount > 0 ? (
          <span
            dir="ltr"
            className="absolute top-1 end-1 min-w-4 rounded-full bg-accent px-1 text-center text-[10px] leading-4 font-bold text-deep ring-2 ring-surface"
          >
            {feed.unreadCount > 9 ? "9+" : feed.unreadCount}
          </span>
        ) : null}
      </button>

      <div
        id={panelId}
        role="region"
        aria-label={labels.title}
        hidden={!open}
        className="absolute end-0 top-full z-50 mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-line bg-surface text-start shadow-lift"
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <p className="text-[14px] font-bold text-title">{labels.title}</p>
          {feed.unreadCount > 0 ? (
            <button
              type="button"
              onClick={() => void markRead()}
              className="cursor-pointer text-[12.5px] font-semibold text-primary-dark underline-offset-4 hover:underline"
            >
              {labels.markAll}
            </button>
          ) : null}
        </div>

        {feed.items.length === 0 ? (
          <p className="px-4 py-8 text-center text-[14px] text-body">{labels.empty}</p>
        ) : (
          <ul className="max-h-[min(26rem,70vh)] overflow-y-auto">
            {feed.items.map((item) => (
              <li key={item.id} className="border-b border-border last:border-b-0">
                <Link
                  href={`/${locale}${item.href}`}
                  onClick={() => {
                    setOpen(false);
                    if (!item.isRead) void markRead([item.id]);
                  }}
                  className="flex gap-3 px-4 py-3 transition-colors hover:bg-surface-muted"
                >
                  <span
                    aria-hidden="true"
                    className={`mt-1.5 size-2 shrink-0 rounded-full ${item.isRead ? "bg-transparent" : "bg-primary"}`}
                  />
                  <span className="min-w-0">
                    <span className={`block text-[14px] leading-snug text-title ${item.isRead ? "font-medium" : "font-bold"}`}>
                      {item.title}
                    </span>
                    <span className="mt-0.5 block text-[13px] leading-snug text-body">{item.body}</span>
                    <span className="mt-1 block text-[12px] text-body/70">{ago(item.createdAt)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M4 6.4a4 4 0 0 1 8 0v2.7l1.2 2.1H2.8L4 9.1V6.4Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M6.4 13.2a1.7 1.7 0 0 0 3.2 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
