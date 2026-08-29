const ARTICLES_KEY = "mm_articles_cache";

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

export function registerArticle(article) {
  if (!article || !article.title) return;
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
  return !s || /^new-\d{8,}/.test(s) || s.includes("---") || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s);
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
