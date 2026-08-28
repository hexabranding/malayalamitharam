const API_BASE = import.meta.env.VITE_API_URL || "https://api.malayalamitharam.in/api";

const CACHE_KEY = "mm_translation_cache";
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000;

function getCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.time > CACHE_DURATION) return {};
    return parsed.data || {};
  } catch {
    return {};
  }
}

function setCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, time: Date.now() }));
  } catch {}
}

function isMalayalam(text) {
  return /[\u0D00-\u0D7F]/.test(text);
}

export async function translateToEnglish(text) {
  if (!text || !isMalayalam(text)) return text;

  const cache = getCache();
  if (cache[text]) return cache[text];

  try {
    const res = await fetch(`${API_BASE}/news/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (res.ok) {
      const data = await res.json();
      const translated = data.translated;
      if (translated && translated !== text) {
        cache[text] = translated;
        setCache(cache);
        return translated;
      }
    }
  } catch (err) {
    console.warn("Translation failed:", err.message);
  }

  return text;
}

export async function translateBatch(texts) {
  if (!Array.isArray(texts) || texts.length === 0) return texts;

  const cache = getCache();
  const toTranslate = [];
  const results = new Array(texts.length);

  texts.forEach((text, i) => {
    if (!text || !isMalayalam(text)) {
      results[i] = text;
    } else if (cache[text]) {
      results[i] = cache[text];
    } else {
      toTranslate.push({ text, index: i });
    }
  });

  if (toTranslate.length > 0) {
    try {
      const batchTexts = toTranslate.map((t) => t.text);
      const res = await fetch(`${API_BASE}/news/translate-batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts: batchTexts }),
      });
      if (res.ok) {
        const data = await res.json();
        const translations = data.translations || [];
        toTranslate.forEach((item, i) => {
          const translated = translations[i] || item.text;
          results[item.index] = translated;
          cache[item.text] = translated;
        });
        setCache(cache);
      }
    } catch (err) {
      console.warn("Batch translation failed:", err.message);
      toTranslate.forEach((item) => {
        results[item.index] = item.text;
      });
    }
  }

  return results;
}
