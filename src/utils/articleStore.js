import { slugify } from "./slugify";

const STORAGE_KEY = "mm_article_slug_map";
const ARTICLES_KEY = "mm_articles_cache";

function getSlugMap() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setSlugMap(map) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {}
}

function getArticlesCache() {
  try {
    const raw = localStorage.getItem(ARTICLES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.time > 30 * 60 * 1000) return [];
    return parsed.data || [];
  } catch {
    return [];
  }
}

function setArticlesCache(articles) {
  try {
    localStorage.setItem(ARTICLES_KEY, JSON.stringify({ data: articles, time: Date.now() }));
  } catch {}
}

function makeTitleSlug(article) {
  const titleSlug = slugify(article.title);
  return titleSlug || (article.slug || article.id || "");
}

export function registerArticle(article) {
  if (!article || !article.title) return;
  const titleSlug = makeTitleSlug(article);
  if (!titleSlug) return;

  const map = getSlugMap();
  const apiSlug = article.slug || article.id;
  map[titleSlug] = apiSlug;
  setSlugMap(map);

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

export function getArticleByTitleSlug(titleSlug) {
  const map = getSlugMap();
  const apiSlug = map[titleSlug];
  if (!apiSlug) return null;

  const cache = getArticlesCache();
  return cache.find(a => (a.slug || a.id) === apiSlug) || null;
}

export function getApiSlug(titleSlug) {
  const map = getSlugMap();
  if (map[titleSlug]) return map[titleSlug];

  const cache = getArticlesCache();
  for (const a of cache) {
    if (slugify(a.title) === titleSlug) {
      map[titleSlug] = a.slug || a.id;
      setSlugMap(map);
      return a.slug || a.id;
    }
  }
  return titleSlug;
}

export function getTitleSlug(article) {
  if (!article || !article.title) return article?.slug || article?.id || "";
  return makeTitleSlug(article);
}
