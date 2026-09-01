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

function stripNewPrefix(s) {
  return String(s || "").replace(/^new-\d{8,}-?/, "");
}
function isBadSlug(s) {
  return !s || /^new-\d{8,}/.test(s) || s.includes("---") || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s);
}

export function getTitleSlug(article) {
  if (!article) return "";
  for (const raw of [article.slug, article.engSlug]) {
    if (!raw) continue;
    const cleaned = stripNewPrefix(raw);
    if (cleaned && !isBadSlug(cleaned)) return cleaned;
    if (raw && !isBadSlug(raw)) return raw;
  }
  for (const raw of [article.slug, article.engSlug]) {
    if (!raw) continue;
    const cleaned = stripNewPrefix(raw);
    if (cleaned && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(cleaned) && !cleaned.includes("---")) return cleaned;
  }
  const fallback = String(article.titleEn || article.title || "").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").replace(/-{2,}/g,"-").replace(/^new-\d{8,}-?/, "");
  if (fallback && !isBadSlug(fallback)) return fallback;
  const manglish = (() => {
    try {
      const src = article.titleEn || article.title || "";
      if (/[\u0D00-\u0D7F]/.test(src)) {
        let t = src;
        const map = { '\u0D15':'ka','\u0D16':'kha','\u0D17':'ga','\u0D1A':'cha','\u0D2A':'pa','\u0D2E':'ma','\u0D2F':'ya','\u0D30':'ra','\u0D32':'la','\u0D38':'sa' };
        return t;
      }
      return fallback;
    } catch { return fallback; }
  })();
  return manglish || "";
}

export function getArticleBySlug(slug) {
  if (!slug) return null;
  const cleanedInput = stripNewPrefix(slug);
  const cache = getArticlesCache();
  return cache.find(a => {
    const candidates = [a.slug, a.engSlug, a.id].filter(Boolean).flatMap(v => [v, stripNewPrefix(v)]);
    if (candidates.includes(slug) || candidates.includes(cleanedInput)) return true;
    return false;
  }) || null;
}
