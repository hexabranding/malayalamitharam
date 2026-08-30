export function slugify(text) {
  const raw = String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .trim()
    .split(/[\s-]+/)
    .filter(Boolean)
    .join("-");
  return raw.replace(/^new-\d{8,}-?/, "");
}
