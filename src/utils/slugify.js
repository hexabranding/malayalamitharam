export function slugify(text) {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[^\w\s\u0D00-\u0D7F-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
