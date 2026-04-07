import { THEME_STORAGE_KEY } from "@/lib/theme-storage";

/** Runs before paint: default light; else localStorage; system follows prefers-color-scheme. */
export function ThemeInitScript() {
  const js = `
(function(){
  try {
    var k=${JSON.stringify(THEME_STORAGE_KEY)};
    var t=localStorage.getItem(k);
    var dark=false;
    if(t==='dark') dark=true;
    else if(t==='system') dark=window.matchMedia('(prefers-color-scheme: dark)').matches;
    else dark=false;
    document.documentElement.classList.toggle('dark',dark);
  } catch(e) {}
})();`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
