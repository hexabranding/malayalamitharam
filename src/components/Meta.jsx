import { useEffect } from "react";
import { CalendarDays, Clock3, MessageCircle } from "lucide-react";
import { resolveImageUrl } from "../services/images.jsx";

export default function Meta({ article }) {
  useEffect(() => {
    if (!article) return;
    const title = (article.title || "Malayala Mitra") + " | Malayala Mitra";
    const desc = article.excerpt || article.title || "";
    const image = resolveImageUrl(article.image) || "/images/favicon.png";
    const url = window.location.href;

    document.title = title;

    function setMeta(property, content, attr = "property") {
      let el = document.querySelector(`meta[${attr}="${property}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, property);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    }

    setMeta("og:title", title);
    setMeta("og:description", desc);
    setMeta("og:image", image);
    setMeta("og:url", url);
    setMeta("og:type", "article");
    setMeta("og:site_name", "Malayala Mitra");
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", title, "name");
    setMeta("twitter:description", desc, "name");
    setMeta("twitter:image", image, "name");
  }, [article]);

  return (
    <div className="meta">
      <span><CalendarDays size={15} />{article.date}</span>
      <span><Clock3 size={15} />{article.readTime}</span>
      <span><MessageCircle size={15} />{article.comments}</span>
    </div>
  );
}
