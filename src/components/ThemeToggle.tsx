"use client";

import {
  applyThemeToDocument,
  readStoredTheme,
  resolveDarkClass,
  systemPrefersDark,
  type ThemeChoice,
  writeStoredTheme,
} from "@/lib/theme-storage";
import { useCallback, useEffect, useRef, useState } from "react";

function IconSun({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function IconMoon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function IconDevice({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

export function ThemeToggle() {
  const [choice, setChoice] = useState<ThemeChoice | null>(null);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setChoice(readStoredTheme());
  }, []);

  useEffect(() => {
    applyThemeToDocument(choice);
  }, [choice]);

  useEffect(() => {
    if (choice !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyThemeToDocument("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [choice]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", close, true);
    return () => document.removeEventListener("click", close, true);
  }, [open]);

  const pick = useCallback((t: ThemeChoice) => {
    writeStoredTheme(t);
    setChoice(t);
    applyThemeToDocument(t);
    setOpen(false);
  }, []);

  const resolvedDark = resolveDarkClass(choice);
  const TriggerIcon = resolvedDark ? IconMoon : IconSun;

  return (
    <div className="relative shrink-0" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="touch-manipulation rounded-lg border border-slate-300 bg-white p-2 text-slate-700 shadow-sm transition hover:bg-slate-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Theme: choose light, dark, or system"
      >
        <TriggerIcon className="h-5 w-5" />
      </button>
      {open && (
        <ul
          className="absolute right-0 z-[60] mt-1.5 min-w-[11rem] rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-lg dark:border-zinc-600 dark:bg-zinc-900"
          role="listbox"
          aria-label="Theme"
        >
          <li role="option" aria-selected={choice === "light"}>
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-slate-800 hover:bg-slate-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
              onClick={() => pick("light")}
            >
              <IconSun className="h-4 w-4 shrink-0 opacity-80" />
              Light
            </button>
          </li>
          <li role="option" aria-selected={choice === "dark"}>
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-slate-800 hover:bg-slate-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
              onClick={() => pick("dark")}
            >
              <IconMoon className="h-4 w-4 shrink-0 opacity-80" />
              Dark
            </button>
          </li>
          <li role="option" aria-selected={choice === "system"}>
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-slate-800 hover:bg-slate-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
              onClick={() => pick("system")}
            >
              <IconDevice className="h-4 w-4 shrink-0 opacity-80" />
              Device
              <span className="ml-auto text-[10px] font-normal uppercase tracking-wide text-slate-400 dark:text-zinc-500">
                {systemPrefersDark() ? "dark" : "light"}
              </span>
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
