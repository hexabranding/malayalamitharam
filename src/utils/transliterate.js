export function getShareUrl(article) {
  if (article.engSlug) return article.engSlug;
  return article.slug || "";
}
