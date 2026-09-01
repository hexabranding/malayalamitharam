import { useEffect } from "react";
import { CalendarDays, Clock3, MessageCircle } from "lucide-react";
import { resolveImageUrl } from "../services/images.jsx";
import { getShareUrl } from "../utils/transliterate.js";

const SITE_NAME = "TodayExpress";
const SITE_URL = "https://bangaloremalayali.in";

export default function Meta({ article }) {
  useEffect(() => {
    if (!article) return;
    const rawTitle = String(article.title || SITE_NAME).trim();
    const title = rawTitle + " | " + SITE_NAME;
    const desc = String(article.excerpt || article.title || "Malayalamitram - Malayalam News Portal").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 155);
    let image = resolveImageUrl(article.image || article.thumbnail) || "";
    if (image && !image.startsWith("http")) {
      image = window.location.origin + image;
    }
    const shareSlug = getShareUrl(article);
    const canonicalUrl = shareSlug
      ? `${SITE_URL}/news/${shareSlug}`
      : window.location.href;

    document.title = title;

    function setMeta(attr, key, content) {
      if (!content) return;
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (el) {
        el.setAttribute("content", content);
      } else {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        el.setAttribute("content", content);
        document.head.appendChild(el);
      }
    }

    setMeta("property", "og:type", "article");
    setMeta("property", "og:site_name", SITE_NAME);
    setMeta("property", "og:title", rawTitle);
    setMeta("property", "og:description", desc);
    setMeta("property", "og:url", canonicalUrl);
    setMeta("property", "og:image", image);
    setMeta("property", "og:image:secure_url", image);
    setMeta("property", "og:image:width", "1200");
    setMeta("property", "og:image:height", "630");
    setMeta("property", "og:image:alt", rawTitle);
    setMeta("property", "article:published_time", article.createdAt || article.date || "");
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", rawTitle);
    setMeta("name", "twitter:description", desc);
    setMeta("name", "twitter:image", image);
    setMeta("name", "twitter:image:alt", rawTitle);
    setMeta("name", "twitter:url", canonicalUrl);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute("href", canonicalUrl);
    } else {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      canonical.setAttribute("href", canonicalUrl);
      document.head.appendChild(canonical);
    }
  }, [article]);

  return (
    <div className="meta">
      <span><CalendarDays size={15} />{article.date}</span>
      <span><Clock3 size={15} />{article.readTime}</span>
      <span><MessageCircle size={15} />{article.comments}</span>
    </div>
  );
}
