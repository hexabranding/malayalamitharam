import { readStoredLang, DEFAULT_LANG } from "../i18n/index.js";

const MALAYALAM_RE = /[ഀ-ൿ]/;

// Articles are cached per language so a switch never shows the previous
// language's headlines while the new request is still in flight.
function storageKey() {
  return "mm_articles_cache_" + (readStoredLang() || DEFAULT_LANG);
}

function getArticlesCache() {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.time > 30 * 60 * 1000) return [];
    return parsed.data || [];
  } catch {
    return [];
  }
}

// Lets a page paint immediately with the last list it showed in this language
// while the fresh request is still in flight.
export function loadCachedArticles() {
  try {
    return getArticlesCache();
  } catch {
    return [];
  }
}

function setArticlesCache(articles) {
  try {
    localStorage.setItem(storageKey(), JSON.stringify({ data: articles, time: Date.now() }));
  } catch {}
}

export function registerArticle(article) {
  if (!article || !article.title) return;
  // Under English/Arabic an article whose title is still Malayalam was not
  // translated yet; caching it would pin the untranslated copy for 30 minutes.
  const lang = readStoredLang() || DEFAULT_LANG;
  if (lang !== DEFAULT_LANG && MALAYALAM_RE.test(String(article.title))) return;
  const cache = getArticlesCache();
  const idx = cache.findIndex(a => a.id === article.id);
  if (idx >= 0) {
    cache[idx] = article;
  } else {
    cache.push(article);
  }
  setArticlesCache(cache);
}

export function registerArticles(articles) {
  if (!Array.isArray(articles)) return;
  articles.forEach(registerArticle);
}

function isBadSlug(s) {
  if (!s) return true;
  if (/^new-\d{8,}/.test(s)) return true;
  if (s.includes("---")) return true;
  if (/\s/.test(s)) return true;
  if (/[^a-z0-9-]/.test(s)) return true;
  if (s.length > 80) return true;
  return false;
}

function slugifyEnglishLocal(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9\s-]/g, " ").trim().split(/[\s-]+/).filter(Boolean).join("-");
}

export function getTitleSlug(article) {
  if (!article) return "";
  if (article.slug && !isBadSlug(article.slug)) return article.slug;
  if (article.engSlug && !isBadSlug(article.engSlug)) return article.engSlug;
  if (article.titleEn) {
    const s = slugifyEnglishLocal(article.titleEn);
    if (s && !isBadSlug(s)) return s.slice(0, 80).split("-").slice(0, 5).join("-");
  }
  // `title` is translated for en/ar readers; the Malayalam original is kept on `titleMl`.
  const source = article.titleMl || article.title;
  if (source) {
    const s = slugifyEnglishLocal(source);
    if (s && !isBadSlug(s)) return s.slice(0, 80).split("-").slice(0, 5).join("-");
  }
  return article.id || "";
}

export function getArticleBySlug(slug) {
  if (!slug) return null;
  const cache = getArticlesCache();
  return cache.find(a => {
    if (a.slug === slug) return true;
    if (a.id === slug) return true;
    return false;
  }) || null;
}
