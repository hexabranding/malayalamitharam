import { useEffect } from "react";
import { CalendarDays, Clock3, MessageCircle } from "lucide-react";

const SITE_NAME = "Malayala Mitra";

export default function Meta({ article }) {
  useEffect(() => {
    if (!article) return;
    const title = (article.title || SITE_NAME) + " | " + SITE_NAME;
    const desc = article.excerpt || article.title || "Malayala Mitra - Malayalam News Portal";

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

    setMeta("property", "og:type", "article");
    setMeta("property", "og:site_name", SITE_NAME);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", desc);
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", desc);
  }, [article]);

  return (
    <div className="meta">
      <span><CalendarDays size={15} />{article.date}</span>
      <span><Clock3 size={15} />{article.readTime}</span>
      <span><MessageCircle size={15} />{article.comments}</span>
    </div>
  );
}
