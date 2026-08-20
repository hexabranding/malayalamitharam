import { useEffect } from "react";
import { CalendarDays, Clock3, MessageCircle } from "lucide-react";
import { resolveImageUrl } from "../services/images.jsx";

const SITE_NAME = "Malayala Mitra";
const SITE_URL = "https://malayalamitharam.in";

export default function Meta({ article }) {
  useEffect(() => {
    if (!article) return;
    const title = (article.title || SITE_NAME) + " | " + SITE_NAME;
    const desc = article.excerpt || article.title || "Malayala Mitra - Malayalam News Portal";
    const image = resolveImageUrl(article.image || article.thumbnail) || "";
    const url = window.location.href;

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
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", desc);
    setMeta("property", "og:url", url);
    setMeta("property", "og:image", image);
    setMeta("property", "article:published_time", article.createdAt || article.date || "");
    setMeta("name", "twitter:card", image ? "summary_large_image" : "summary");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", desc);
    setMeta("name", "twitter:image", image);
    setMeta("name", "twitter:url", url);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute("href", url);
    } else {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      canonical.setAttribute("href", url);
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
