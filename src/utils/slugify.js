export function slugify(text) {
  const stopWords = new Set(["a", "an", "and", "announced", "are", "as", "at", "be", "by", "for", "from", "in", "into", "is", "of", "on", "or", "the", "to", "with"]);
  const words = String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .trim()
    .split(/[\s-]+/)
    .filter(Boolean);
  const meaningful = words.filter((word, index) => index === 0 || !stopWords.has(word));
  return meaningful.slice(0, /^\d+$/.test(meaningful[0] || "") ? 3 : 4).join("-");
}
