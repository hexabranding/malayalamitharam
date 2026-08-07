import { useEffect } from "react";
import { CalendarDays, Clock3, MessageCircle } from "lucide-react";
import { resolveImageUrl } from "../services/images.jsx";

export default function Meta({ article }) {
  useEffect(() => {
    if (!article) return;
    const origin = window.location.origin;
    const title = (article.title || "Malayala Mitra") + " | Malayala Mitra";
    const desc = article.excerpt || article.title || "";
    const rawImage = resolveImageUrl(article.image) || "/images/favicon.png";
    const image = rawImage.startsWith("http") ? rawImage : origin + rawImage;
    const url = window.location.href;

    document.title = title;

    function setMeta(attr, key, content) {
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

    setMeta("property", "og:title", title);
    setMeta("property", "og:description", desc);
    setMeta("property", "og:image", image);
    setMeta("property", "og:url", url);
    setMeta("property", "og:type", "article");
    setMeta("property", "og:site_name", "Malayala Mitra");
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", desc);
    setMeta("name", "twitter:image", image);
  }, [article]);

  return (
    <div className="meta">
      <span><CalendarDays size={15} />{article.date}</span>
      <span><Clock3 size={15} />{article.readTime}</span>
      <span><MessageCircle size={15} />{article.comments}</span>
    </div>
  );
}
