const STOP_WORDS = new Set(["a", "an", "and", "announced", "are", "as", "at", "be", "by", "for", "from", "in", "into", "is", "of", "on", "or", "the", "to", "with"]);

function slugifyEnglish(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .trim()
    .split(/[\s-]+/)
    .filter(Boolean)
    .join("-");
}

// A short, readable default. Editors can always replace this value in the admin form.
function suggestNewsSlug(englishTitle) {
  const words = String(englishTitle || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .trim()
    .split(/[\s-]+/)
    .filter(Boolean);
  const meaningful = words.filter((word, index) => index === 0 || !STOP_WORDS.has(word));
  // Numeric incident headlines are clearest when limited to their first three
  // terms (for example, "33 Malayalis Missing").
  const limit = /^\d+$/.test(meaningful[0] || "") ? 3 : 4;
  return meaningful.slice(0, limit).join("-");
}

function isCleanNewsSlug(value) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(value || ""));
}

module.exports = { slugifyEnglish, suggestNewsSlug, isCleanNewsSlug };
