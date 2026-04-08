"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";

function IconChatGPT({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        fill="#10a37f"
        d="M5 8.5C5 6.57 6.57 5 8.5 5h7C17.43 5 19 6.57 19 8.5v5c0 1.93-1.57 3.5-3.5 3.5H12l-3 2.5v-2.5H8.5A3.5 3.5 0 0 1 5 13.5v-5Z"
      />
      <path
        fill="#fff"
        fillOpacity="0.9"
        d="M8.75 9.25h6.5v1.5h-6.5v-1.5Zm0 3h4v1.5h-4v-1.5Z"
      />
    </svg>
  );
}

function IconGemini({ className, gradientId }: { className?: string; gradientId: string }) {
  const gid = `gemini-${gradientId}`;
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 2 14.8 9.2 22 12l-7.2 2.8L12 22l-2.8-7.2L2 12l7.2-2.8L12 2Z" fill={`url(#${gid})`} />
      <defs>
        <linearGradient id={gid} x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4285f4" />
          <stop offset="0.35" stopColor="#9b72cb" />
          <stop offset="0.65" stopColor="#d96570" />
          <stop offset="1" stopColor="#fbbc04" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function IconClaude({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        fill="#c15f3c"
        d="M12 2.25 13.9 8.1h6.15l-5 3.63 1.9 5.85L12 14.73 6.05 17.58l1.9-5.85-5-3.63h6.15L12 2.25Z"
      />
    </svg>
  );
}

function IconChatBubbleFab({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );
}

const ASSISTANTS: {
  id: string;
  name: string;
  description: string;
  href: string;
}[] = [
  { id: "chatgpt", name: "ChatGPT", description: "OpenAI", href: "https://chatgpt.com/" },
  { id: "gemini", name: "Gemini", description: "Google", href: "https://gemini.google.com/" },
  { id: "claude", name: "Claude", description: "Anthropic", href: "https://claude.ai/new" },
];

function AssistantRowIcon({ id, geminiGradientSuffix }: { id: string; geminiGradientSuffix: string }) {
  if (id === "gemini") {
    return <IconGemini className="h-6 w-6" gradientId={geminiGradientSuffix} />;
  }
  if (id === "claude") {
    return <IconClaude className="h-6 w-6" />;
  }
  return <IconChatGPT className="h-6 w-6" />;
}

const PANEL_ID = "ai-assist-panel";
const TITLE_ID = "ai-assist-title";

export function AiAssistLauncher() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const path = usePathname();
  const geminiGradSuffix = useId().replace(/:/g, "");

  useEffect(() => {
    setOpen(false);
  }, [path]);

  const onDocPointerDown = useCallback(
    (e: PointerEvent) => {
      if (!open) return;
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || buttonRef.current?.contains(t)) return;
      setOpen(false);
    },
    [open],
  );

  useEffect(() => {
    document.addEventListener("pointerdown", onDocPointerDown);
    return () => document.removeEventListener("pointerdown", onDocPointerDown);
  }, [onDocPointerDown]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div
      className="pointer-events-none fixed bottom-0 right-0 z-[100] flex flex-col items-end gap-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pr-[max(1rem,env(safe-area-inset-right))]"
      aria-live="polite"
    >
      <div
        ref={panelRef}
        id={PANEL_ID}
        role="dialog"
        aria-modal="false"
        aria-labelledby={TITLE_ID}
        aria-hidden={open ? undefined : true}
        /* Closed: parent `pointer-events: none` still lets descendants with default `auto` receive taps; force none on subtree so invisible LLM links do not steal touches. */
        className={`mb-3 w-[min(calc(100vw-2rem),17.5rem)] origin-bottom-right transition-[opacity,transform] duration-200 motion-reduce:transition-none ${
          open
            ? "pointer-events-auto scale-100 opacity-100"
            : "hidden pointer-events-none [&_*]:pointer-events-none"
        }`}
      >
        <div className="rounded-2xl border border-slate-200 dark:border-zinc-700 bg-[var(--card)] shadow-xl shadow-slate-900/10 dark:shadow-black/40 ring-1 ring-black/5 dark:ring-white/10">
          <div className="border-b border-slate-200 dark:border-zinc-800 px-4 py-3">
            <p id={TITLE_ID} className="text-sm font-semibold text-slate-900 dark:text-white">
              AI assistants
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-zinc-500">
              Opens each service in a new tab. Sign in there if prompted.
            </p>
          </div>
          <ul className="p-2">
            {ASSISTANTS.map((a) => (
              <li key={a.id}>
                <a
                  href={a.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-100 dark:hover:bg-zinc-800/80"
                  onClick={() => setOpen(false)}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-zinc-800/80">
                    <AssistantRowIcon id={a.id} geminiGradientSuffix={geminiGradSuffix} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-slate-900 dark:text-white">{a.name}</span>
                    <span className="block text-xs text-slate-500 dark:text-zinc-500">{a.description}</span>
                  </span>
                  <span className="shrink-0 text-slate-400 dark:text-zinc-500" aria-hidden>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M7 17 17 7M7 7h10v10" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <div className="border-t border-slate-200 dark:border-zinc-800 px-3 py-2">
            <CopyPageLinkButton />
          </div>
        </div>
      </div>

      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={PANEL_ID}
        aria-haspopup="dialog"
        className="pointer-events-auto flex h-14 w-14 touch-manipulation items-center justify-center rounded-full border border-slate-200 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 shadow-lg shadow-slate-900/15 transition hover:border-blue-400/60 hover:text-blue-600 dark:hover:border-blue-500/50 dark:hover:text-blue-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 motion-safe:active:scale-95"
        title={open ? "Close AI shortcuts" : "Open AI chat shortcuts"}
      >
        <span className="sr-only">{open ? "Close AI assistant menu" : "Open AI assistant menu"}</span>
        <span className="relative flex h-9 w-9 items-center justify-center" aria-hidden>
          <IconChatBubbleFab className="h-7 w-7 text-blue-600 dark:text-blue-400" />
        </span>
      </button>
    </div>
  );
}

function CopyPageLinkButton() {
  const [status, setStatus] = useState<"idle" | "copied" | "err">("idle");
  const path = usePathname();

  const copy = useCallback(async () => {
    try {
      const url =
        typeof window !== "undefined"
          ? `${window.location.origin}${path}${window.location.search}${window.location.hash}`
          : "";
      await navigator.clipboard.writeText(url);
      setStatus("copied");
      window.setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("err");
      window.setTimeout(() => setStatus("idle"), 2500);
    }
  }, [path]);

  return (
    <div className="flex flex-col gap-1.5">
      <p className="px-1 text-[11px] leading-snug text-slate-500 dark:text-zinc-500">
        Paste the current page URL into any chat for context.
      </p>
      <button
        type="button"
        onClick={() => void copy()}
        className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 px-3 py-2 text-xs font-medium text-slate-800 dark:text-zinc-200 transition hover:bg-slate-100 dark:hover:bg-zinc-800"
      >
        {status === "copied" ? "Copied link" : status === "err" ? "Copy failed — try manually" : "Copy page link"}
      </button>
    </div>
  );
}
