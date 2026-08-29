export function getShareUrl(article) {
  if (article.slug) return article.slug;
  return article.id || "";
}
