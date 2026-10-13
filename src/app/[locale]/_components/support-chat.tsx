"use client";

import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore, type FormEvent } from "react";

interface Message {
  readonly id: string;
  readonly author: "visitor" | "staff";
  readonly authorName: string;
  readonly body: string;
  readonly createdAt: string;
}

interface Thread {
  readonly conversation: { readonly id: string; readonly reference: string; readonly status: "open" | "closed" } | null;
  readonly messages: readonly Message[];
  readonly unread: number;
}

export interface SupportChatLabels {
  readonly whatsapp: string;
  readonly scrollTop: string;
  readonly open: string;
  readonly close: string;
  readonly title: string;
  readonly intro: string;
  readonly name: string;
  readonly email: string;
  readonly message: string;
  readonly placeholder: string;
  readonly send: string;
  readonly sending: string;
  readonly you: string;
  readonly staff: string;
  readonly closed: string;
  readonly error: string;
  /** "Conversation {reference}". */
  readonly reference: string;
}

const EMPTY: Thread = { conversation: null, messages: [], unread: 0 };


/* A signed-in visitor is not asked for a name and email: the session has them. */
const subscribe = () => () => {};
const signedIn = () => document.cookie.split("; ").some((part) => part.startsWith("jofit.account="));
const onServer = () => false;

/** While the panel is open, replies should feel live; closed, a slow check keeps the badge honest. */
const OPEN_POLL_MS = 4_000;
const CLOSED_POLL_MS = 30_000;

/**
 * THE SUPPORT CHAT, on every page.
 *
 * It talks only to `/api/support` on this site's own server, which knows who
 * is asking from the session cookie (or, for a guest, from the httpOnly token
 * cookie issued with their first message) and relays to the API. Staff answer
 * from the admin's Support inbox.
 */
export function SupportChat({
  locale,
  labels,
  whatsappUrl,
}: {
  locale: "en" | "ar";
  labels: SupportChatLabels;
  whatsappUrl: string;
}) {
  /* The back-to-top button only appears once the page has been scrolled. */
  const [scrolled, setScrolled] = useState(false);
  /* An eased glide rather than the browser's own jump-ish smooth scroll: it
     starts gently, travels, and settles, over a time that grows with the
     distance. Reduced motion gets the plain jump. */
  const scrollToTop = useCallback(() => {
    const from = window.scrollY;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || from < 2) {
      window.scrollTo(0, 0);
      return;
    }
    const duration = Math.min(1400, 500 + from * 0.12);
    const root = document.documentElement;
    root.style.scrollBehavior = "auto";
    const started = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - started) / duration);
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      window.scrollTo(0, from * (1 - eased));
      if (t < 1) requestAnimationFrame(step);
      else root.style.scrollBehavior = "";
    };
    requestAnimationFrame(step);
  }, []);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const known = useSyncExternalStore(subscribe, signedIn, onServer);
  const [open, setOpen] = useState(false);
  const [thread, setThread] = useState<Thread>(EMPTY);
  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const panelId = useId();
  const list = useRef<HTMLOListElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);

  const load = useCallback(async (markRead: boolean) => {
    try {
      const response = await fetch(`/api/support${markRead ? "?read=1" : ""}`, { cache: "no-store" });
      if (response.ok) setThread((await response.json()) as Thread);
    } catch {
      /* Keep what is on screen. */
    }
  }, []);

  useEffect(() => {
    const first = window.setTimeout(() => void load(open), 0);
    const timer = window.setInterval(
      () => document.visibilityState === "visible" && void load(open),
      open ? OPEN_POLL_MS : CLOSED_POLL_MS,
    );
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [open, load]);

  /* The newest message stays in view. */
  useEffect(() => {
    if (open) list.current?.lastElementChild?.scrollIntoView({ block: "end" });
  }, [open, thread.messages.length]);

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const needsIdentity = !known && (!thread.conversation || thread.conversation.status === "closed");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (sending || !body.trim()) return;
    setSending(true);
    setErrors({});
    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(needsIdentity ? { body, name, email } : { body }),
      });
      if (response.ok) {
        setThread((await response.json()) as Thread);
        setBody("");
      } else {
        const failure = (await response.json().catch(() => null)) as {
          error?: { message?: string; fieldErrors?: Record<string, string> };
        } | null;
        setErrors(failure?.error?.fieldErrors ?? { form: failure?.error?.message ?? labels.error });
      }
    } catch {
      setErrors({ form: labels.error });
    } finally {
      setSending(false);
    }
  }

  const time = new Intl.DateTimeFormat(locale === "ar" ? "ar-JO-u-nu-latn" : "en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Amman",
  });

  return (
    <div className="fixed end-4 bottom-4 z-40 flex flex-col items-end gap-3 sm:end-6 sm:bottom-6">
      <section
        id={panelId}
        aria-label={labels.title}
        hidden={!open}
        className="w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-line bg-surface shadow-lift"
      >
        <header className="bg-deep px-5 py-4 text-white">
          <p className="font-heading text-[16px] font-semibold text-white">{labels.title}</p>
          <p className="mt-1 text-[13px] leading-snug opacity-80">
            {thread.conversation ? labels.reference.replace("{reference}", thread.conversation.reference) : labels.intro}
          </p>
        </header>

        <ol ref={list} aria-live="polite" className="max-h-[min(22rem,50vh)] space-y-3 overflow-y-auto px-4 py-4">
          {thread.messages.length === 0 ? (
            <li className="text-[14px] leading-relaxed text-body">{labels.intro}</li>
          ) : (
            thread.messages.map((message) => {
              const mine = message.author === "visitor";
              return (
                <li key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed ${
                      mine ? "bg-primary text-on-primary" : "bg-surface-muted text-title"
                    }`}
                  >
                    <p className="text-[11.5px] font-semibold opacity-75">
                      {mine ? labels.you : labels.staff} · <span dir="ltr">{time.format(new Date(message.createdAt))}</span>
                    </p>
                    <p dir="auto" className="mt-0.5 whitespace-pre-wrap">
                      {message.body}
                    </p>
                  </div>
                </li>
              );
            })
          )}
          {thread.conversation?.status === "closed" ? (
            <li className="border-t border-border pt-3 text-center text-[13px] text-body">{labels.closed}</li>
          ) : null}
        </ol>

        <form onSubmit={submit} className="border-t border-border px-4 py-3" noValidate>
          {needsIdentity ? (
            <div className="mb-2 grid grid-cols-2 gap-2">
              <label className="block">
                <span className="sr-only">{labels.name}</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={labels.name}
                  autoComplete="name"
                  aria-invalid={Boolean(errors.name)}
                  className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-[14px] text-title outline-none focus-visible:border-primary aria-invalid:border-danger"
                />
              </label>
              <label className="block">
                <span className="sr-only">{labels.email}</span>
                <input
                  type="email"
                  dir="ltr"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={labels.email}
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                  className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-start text-[14px] text-title outline-none focus-visible:border-primary aria-invalid:border-danger"
                />
              </label>
            </div>
          ) : null}
          <label className="block">
            <span className="sr-only">{labels.message}</span>
            <textarea
              ref={input}
              rows={2}
              dir="auto"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder={labels.placeholder}
              aria-invalid={Boolean(errors.body)}
              className="w-full resize-none border border-border bg-surface px-3 py-2 text-[14px] text-title outline-none focus-visible:border-primary aria-invalid:border-danger"
            />
          </label>
          {Object.values(errors).length > 0 ? (
            <p role="alert" className="mt-1.5 text-[12.5px] text-danger">
              {Object.values(errors)[0]}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={sending || !body.trim()}
            className="mt-2 flex w-full cursor-pointer justify-center rounded-full bg-primary py-2.5 text-[14px] font-semibold text-on-primary transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? labels.sending : labels.send}
          </button>
        </form>
      </section>

      {/* The three round buttons share one centre line whatever their size.
          Top to bottom: back to top (gold, slides in once the page has moved),
          WhatsApp (its own green) and the chat — three colours so none is
          mistaken for another. */}
      <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        aria-label={labels.scrollTop}
        title={labels.scrollTop}
        tabIndex={scrolled ? 0 : -1}
        aria-hidden={!scrolled}
        onClick={scrollToTop}
        className={`group flex size-12 cursor-pointer items-center justify-center rounded-full bg-accent text-deep shadow-lift ring-4 ring-accent/20 transition-[opacity,transform] duration-500 ease-out ${
          scrolled ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <span className="transition-transform duration-500 ease-out group-hover:-translate-y-0.5 group-hover:scale-110 group-active:-translate-y-1">
          <BarbellIcon />
        </span>
      </button>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={labels.whatsapp}
        title={labels.whatsapp}
        className="flex size-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-lift ring-4 ring-[#25d366]/20 transition-transform hover:-translate-y-0.5"
      >
        <WhatsAppIcon />
      </a>

      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? labels.close : labels.open}
        onClick={() => setOpen((value) => !value)}
        className="relative flex size-14 cursor-pointer items-center justify-center rounded-full bg-primary text-on-primary shadow-lift ring-4 ring-primary/15 transition-colors hover:bg-primary-hover"
      >
        {open ? <CloseIcon /> : <ChatIcon />}
        {!open && thread.unread > 0 ? (
          <span
            dir="ltr"
            className="absolute -top-1 -end-1 min-w-5 rounded-full bg-accent px-1 text-center text-[11px] leading-5 font-bold text-deep ring-2 ring-surface"
          >
            {thread.unread}
          </span>
        ) : null}
      </button>
      </div>
    </div>
  );
}

function BarbellIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6.5" y="11" width="11" height="2" rx="1" />
      <rect x="4" y="6.5" width="2.6" height="11" rx="1.1" />
      <rect x="17.4" y="6.5" width="2.6" height="11" rx="1.1" />
      <rect x="1.5" y="9" width="2" height="6" rx="0.9" />
      <rect x="20.5" y="9" width="2" height="6" rx="0.9" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.83 9.83 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.8 11.8 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.9 11.9 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 0 0-3.48-8.413" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 5.5h16v10H9.5L5 19v-3.5H4v-10Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M8 9.5h8M8 12.5h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
