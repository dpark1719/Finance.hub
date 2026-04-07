/**
 * One-off / idempotent: add light + dark: Tailwind pairs for theme switching.
 * Run: node scripts/apply-theme-classes.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "src");

const ORDERED = [
  ["bg-zinc-950/40", "bg-slate-100/90 dark:bg-zinc-950/40"],
  ["bg-zinc-950/50", "bg-slate-100/90 dark:bg-zinc-950/50"],
  ["bg-zinc-950/80", "bg-slate-100 dark:bg-zinc-950/80"],
  ["bg-zinc-900/60", "bg-white/95 dark:bg-zinc-900/60"],
  ["bg-zinc-900/40", "bg-slate-50/95 dark:bg-zinc-900/40"],
  ["bg-zinc-900/80", "bg-slate-50 dark:bg-zinc-900/80"],
  ["bg-zinc-900/30", "bg-slate-100/90 dark:bg-zinc-900/30"],
  ["bg-zinc-800/80", "bg-slate-100 dark:bg-zinc-800/80"],
  ["bg-zinc-800/50", "bg-slate-200/80 dark:bg-zinc-800/50"],
  ["bg-zinc-950", "bg-slate-50 dark:bg-zinc-950"],
  ["bg-zinc-900", "bg-white dark:bg-zinc-900"],
  ["bg-zinc-800", "bg-slate-200 dark:bg-zinc-800"],
  ["border-zinc-800", "border-slate-200 dark:border-zinc-800"],
  ["border-zinc-700", "border-slate-300 dark:border-zinc-700"],
  ["border-zinc-600", "border-slate-300 dark:border-zinc-600"],
  ["border-zinc-500", "border-slate-300 dark:border-zinc-500"],
  ["text-zinc-400", "text-slate-600 dark:text-zinc-400"],
  ["text-zinc-500", "text-slate-500 dark:text-zinc-500"],
  ["text-zinc-600", "text-slate-600 dark:text-zinc-600"],
  ["text-zinc-300", "text-slate-700 dark:text-zinc-300"],
  ["text-zinc-200", "text-slate-800 dark:text-zinc-200"],
  ["text-zinc-100", "text-slate-800 dark:text-zinc-100"],
  ["placeholder:text-zinc-600", "placeholder:text-slate-500 dark:placeholder:text-zinc-600"],
  ["ring-zinc-800", "ring-slate-200 dark:ring-zinc-800"],
  ["divide-zinc-800", "divide-slate-200 dark:divide-zinc-800"],
  ["hover:border-zinc-500", "hover:border-slate-400 dark:hover:border-zinc-500"],
  ["hover:border-zinc-600", "hover:border-slate-400 dark:hover:border-zinc-600"],
  ["hover:bg-zinc-800/50", "hover:bg-slate-200/80 dark:hover:bg-zinc-800/50"],
  ["hover:bg-zinc-800", "hover:bg-slate-200 dark:hover:bg-zinc-800"],
  ["hover:text-zinc-200", "hover:text-slate-900 dark:hover:text-zinc-200"],
  ["hover:text-white", "hover:text-slate-900 dark:hover:text-white"],
];

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (name.endsWith(".tsx") || name.endsWith(".ts")) out.push(p);
  }
  return out;
}

function transform(s) {
  let t = s;
  for (const [a, b] of ORDERED) {
    t = t.split(a).join(b);
  }
  t = t.replace(/\btext-white\b/g, "text-slate-900 dark:text-white");
  const btnFixes = [
    [/bg-blue-600 text-slate-900 dark:text-white/g, "bg-blue-600 text-white"],
    [/bg-blue-500 text-slate-900 dark:text-white/g, "bg-blue-500 text-white"],
    [/bg-blue-600\/95 text-slate-900 dark:text-white/g, "bg-blue-600/95 text-white"],
    [/bg-teal-700\/95 text-slate-900 dark:text-white/g, "bg-teal-700/95 text-white"],
    [/bg-sky-800\/95 text-slate-900 dark:text-white/g, "bg-sky-800/95 text-white"],
    [/bg-emerald-800\/95 text-slate-900 dark:text-white/g, "bg-emerald-800/95 text-white"],
    [/bg-orange-700\/95 text-slate-900 dark:text-white/g, "bg-orange-700/95 text-white"],
    [/bg-red-800\/95 text-slate-900 dark:text-white/g, "bg-red-800/95 text-white"],
    [/bg-indigo-700\/95 text-slate-900 dark:text-white/g, "bg-indigo-700/95 text-white"],
    [/bg-violet-700\/95 text-slate-900 dark:text-white/g, "bg-violet-700/95 text-white"],
    [/border-blue-500 bg-blue-500 text-slate-900 dark:text-white/g, "border-blue-500 bg-blue-500 text-white"],
    [/bg-blue-600 text-slate-900 dark:text-white/g, "bg-blue-600 text-white"],
    [/\? "bg-blue-600 text-slate-900 dark:text-white"/g, '? "bg-blue-600 text-white"'],
    [/: "bg-blue-600 text-slate-900 dark:text-white"/g, ': "bg-blue-600 text-white"'],
    [/from-blue-600 text-slate-900 dark:text-white/g, "from-blue-600 text-white"],
  ];
  for (const [re, rep] of btnFixes) t = t.replace(re, rep);
  return t;
}

const skip = new Set([
  path.join(root, "components", "ThemeToggle.tsx"),
  path.join(root, "components", "ThemeInitScript.tsx"),
  path.join(root, "lib", "theme-storage.ts"),
]);

let n = 0;
for (const file of walk(root)) {
  if (skip.has(file)) continue;
  const raw = fs.readFileSync(file, "utf8");
  const next = transform(raw);
  if (next !== raw) {
    fs.writeFileSync(file, next);
    n++;
    console.log(file.replace(root + path.sep, "src/"));
  }
}
console.error(`Updated ${n} files.`);
