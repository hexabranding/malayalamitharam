import { translate } from "@vitalets/google-translate-api";

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
    const result = await translate(text, { from: "ml", to: "en" });
    const translated = result.text;
    if (translated) {
      cache[text] = translated;
      setCache(cache);
      return translated;
    }
  } catch (err) {
    console.warn("Translation failed, falling back to transliteration:", err.message);
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
      const result = await translate(batchTexts, { from: "ml", to: "en" });
      const translations = Array.isArray(result.text) ? result.text : [result.text];
      toTranslate.forEach((item, i) => {
        const translated = translations[i] || item.text;
        results[item.index] = translated;
        cache[item.text] = translated;
      });
      setCache(cache);
    } catch (err) {
      console.warn("Batch translation failed:", err.message);
      toTranslate.forEach((item) => {
        results[item.index] = item.text;
      });
    }
  }

  return results;
}
