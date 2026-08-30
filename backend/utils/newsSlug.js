const { transliterateMalayalam } = require("./malayalamTransliterate");

const STOP_WORDS = new Set(["a", "an", "and", "announced", "are", "as", "at", "be", "by", "for", "from", "in", "into", "is", "of", "on", "or", "the", "to", "with"]);

function stripNewPrefix(value) {
  return String(value || "").replace(/^new-\d{8,}-?/, "");
}
function slugifyEnglish(value) {
  const raw = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .trim()
    .split(/[\s-]+/)
    .filter(Boolean)
    .join("-");
  return stripNewPrefix(raw).replace(/^-+|-+$/g, "").replace(/-{2,}/g, "-");
}

function slugifyManglish(malayalamTitle, englishTitle) {
  const source = englishTitle || malayalamTitle || "";
  const hasMalayalam = /[\u0D00-\u0D7F]/.test(source);
  let words;
  if (hasMalayalam) {
    const transliterated = transliterateMalayalam(source);
    words = transliterated
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .trim()
      .split(/[\s-]+/)
      .filter(Boolean);
  } else {
    words = source
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .trim()
      .split(/[\s-]+/)
      .filter(Boolean);
  }
  const meaningful = words.filter((word, index) => index === 0 || !STOP_WORDS.has(word));
  return stripNewPrefix(meaningful.join("-")).replace(/^-+|-+$/g, "").replace(/-{2,}/g, "-") || "news";
}

function suggestNewsSlug(englishTitle) {
  return slugifyEnglish(englishTitle);
}

function isCleanNewsSlug(value) {
  const v = String(value || "");
  if (/^new-\d{8,}/.test(v)) return false;
  if (v.includes("---")) return false;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v);
}

module.exports = { slugifyEnglish, suggestNewsSlug, slugifyManglish, isCleanNewsSlug, stripNewPrefix };
