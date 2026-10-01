import common from "./dictionaries/common.js";
import header from "./dictionaries/header.js";
import footer from "./dictionaries/footer.js";
import home from "./dictionaries/home.js";
import article from "./dictionaries/article.js";
import pages from "./dictionaries/pages.js";

const SLICES = [common, header, footer, home, article, pages];

function build(lang) {
  const out = {};
  for (const slice of SLICES) {
    const table = slice[lang] || slice.ml || {};
    Object.assign(out, table);
  }
  return out;
}

export const LANGS = [
  { code: "ml", label: "മലയാളം", htmlLang: "ml", dir: "ltr" },
  { code: "en", label: "English", htmlLang: "en", dir: "ltr" },
  // Arabic keeps the normal left-to-right layout: only the text is translated,
  // the page must never mirror/flip when the language changes.
  { code: "ar", label: "العربية", htmlLang: "ar", dir: "ltr" },
];

export const DEFAULT_LANG = "ml";
export const STORAGE_KEY = "mm_lang";

export function getLangMeta(code) {
  return LANGS.find((l) => l.code === code) || LANGS[0];
}

const cache = {};
export function getTable(lang) {
  if (!cache[lang]) cache[lang] = build(lang);
  return cache[lang];
}

export function interpolate(str, vars) {
  if (!vars) return str;
  return String(str).replace(/\{\{(\w+)\}\}/g, (m, k) =>
    Object.prototype.hasOwnProperty.call(vars, k) ? String(vars[k]) : m
  );
}

export function translate(lang, key, vars) {
  const table = getTable(lang);
  const fallback = getTable(DEFAULT_LANG);
  let value = table[key];
  if (value === undefined) value = fallback[key];
  if (value === undefined) return key;
  return interpolate(value, vars);
}

export function readStoredLang() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && LANGS.some((l) => l.code === stored)) return stored;
  } catch (_) {}
  return null;
}

export function detectInitialLang() {
  const stored = readStoredLang();
  if (stored) return stored;
  try {
    const nav = (navigator.language || "").toLowerCase();
    if (nav.startsWith("ar")) return "ar";
    if (nav.startsWith("en")) return "en";
  } catch (_) {}
  return DEFAULT_LANG;
}
