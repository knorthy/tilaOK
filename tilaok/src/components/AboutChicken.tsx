"use client";

// The chicken button in the bottom-right corner. Clicking it opens a small
// panel with how tilaOK works, what it can do, and what it can't do.

import { useEffect, useId, useRef, useState } from "react";

export default function AboutChicken() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();

    // Close on Escape or on a click outside the panel and button
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!panelRef.current?.contains(t) && !buttonRef.current?.contains(t)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <>
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-labelledby={titleId}
          tabIndex={-1}
          className="about-pop fixed right-4 bottom-[5.25rem] z-20 max-h-[calc(100dvh-7rem)] w-[min(400px,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-line bg-surface text-sm leading-relaxed outline-none"
        >
          <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3.5">
            <h2 id={titleId} className="text-[15px] font-semibold">
              About tila<span className="text-healthy">OK</span>
            </h2>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                buttonRef.current?.focus();
              }}
              className="-mr-2 inline-flex size-8 items-center justify-center rounded-md text-muted hover:bg-subtle hover:text-fg"
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" aria-hidden>
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>

          <section className="px-5 py-4">
            <h3 className="font-medium">How it works</h3>
            <p className="mt-1 text-muted">
              A microphone near the flock feeds 1-second clips to an AI audio model that runs right in this browser. Nothing is uploaded.
              Each clip is scored as healthy chicken sounds, unhealthy (coughing, snoring, rales) or background noise.
            </p>
          </section>

          <section className="border-t border-line px-5 py-4">
            <h3 className="font-medium">What it can do</h3>
            <ul className="mt-1.5 flex flex-col gap-1.5 text-muted">
              <Item tone="healthy">Listen to the flock for as long as the page is open.</Item>
              <Item tone="healthy">Flag coughing, snoring and rale sounds as they happen.</Item>
              <Item tone="healthy">Alert only on repeated sounds (3 of the last 5 seconds), so one stray noise won&apos;t set it off.</Item>
              <Item tone="healthy">Give you a session report with a verdict when you stop listening.</Item>
            </ul>
          </section>

          <section className="border-t border-line px-5 py-4">
            <h3 className="font-medium">What it can&apos;t do</h3>
            <ul className="mt-1.5 flex flex-col gap-1.5 text-muted">
              <Item tone="alert">It can&apos;t diagnose a disease. It only flags respiratory symptoms.</Item>
              <Item tone="alert">
                It was trained on clean recordings of chicks from one farm in Nigeria, with only 300–400 clips per class. Fans, feeders, distance,
                Philippine breeds or older birds may lower accuracy.
              </Item>
              <Item tone="alert">It judges 1 second at a time, so a rooster crow or a sneeze-like noise can cause a false reading.</Item>
            </ul>
          </section>

          <section className="border-t border-line px-5 py-4 text-xs text-muted">
            Trained in Teachable Machine on 1,000 clips from the{" "}
            <a className="underline hover:text-fg" href="https://doi.org/10.17632/zp4nf2dxbh.1" target="_blank" rel="noopener noreferrer">
              Poultry Vocalization Signal Dataset
            </a>
            . A Laboratory #6 prototype, Cavite State University CEIT. &ldquo;Tilaok&rdquo; is the sound a chicken makes, and the OK means the flock is OK.
          </section>
        </div>
      )}

      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={open ? "Close about tilaOK" : "About tilaOK: how it works and what it can't do"}
        title="About tilaOK"
        className="about-fab fixed right-4 bottom-4 z-20 inline-flex size-14 items-center justify-center rounded-full border border-line bg-surface text-fg transition-colors hover:bg-subtle"
      >
        <IconChicken />
      </button>
    </>
  );
}

function Item({ tone, children }: { tone: "healthy" | "alert"; children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span className={`mt-[0.55em] size-1.5 shrink-0 rounded-full ${tone === "healthy" ? "bg-healthy" : "bg-alert"}`} aria-hidden />
      <span>{children}</span>
    </li>
  );
}

// A hen facing left, drawn in the same 1.75px outline style as the other icons
function IconChicken() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {/* comb */}
      <path d="M6.6 4.6c-.2-1 .5-1.8 1.4-1.6.4-.9 1.7-.9 2 0 .9-.2 1.5.7 1.1 1.5" />
      {/* head, neck and body in one line */}
      <path d="M10.9 5.2A3 3 0 0 0 5.4 7.4c0 1.3.6 2.2 1.3 3-.2 1-.3 2 0 3 .8 3 3.4 4.9 6.6 4.9 3.7 0 6.6-2.7 6.6-6.3 0-1.1-.2-2.2-.7-3.1l1.3-2.6c-1.6.2-3 .9-3.9 2-1.2-.6-2.6-.9-4-.7-.9.1-1.5-.1-1.8-.6" />
      {/* beak */}
      <path d="M5.4 7l-2 .7 2 .8" />
      {/* wing */}
      <path d="M10.8 12.2c1.1 1.6 3.4 2.2 5.4 1.1" />
      {/* legs */}
      <path d="M11.5 18.2v2.6m-1.3 0h2.6M15 18v2.8m-1.3 0h2.6" />
      {/* eye */}
      <circle cx="7.9" cy="6.9" r=".45" fill="currentColor" stroke="none" />
    </svg>
  );
}
