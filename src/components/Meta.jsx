import { useEffect } from "react";
import { CalendarDays, Clock3, MessageCircle } from "lucide-react";
import { resolveImageUrl } from "../services/images.jsx";

const SITE_NAME = "Malayala Mitra";
const SITE_URL = "https://demo.malayalamitharam.in";
const DEFAULT_OG_IMAGE = SITE_URL + "/images/og-image.jpg";

export default function Meta({ article }) {
  useEffect(() => {
    if (!article) return;
    const origin = window.location.origin;
    const title = (article.title || SITE_NAME) + " | " + SITE_NAME;
    const desc = article.excerpt || article.title || "Malayala Mitra - Malayalam News Portal";
    const rawImage = resolveImageUrl(article.image);
    const image = rawImage ? (rawImage.startsWith("http") ? rawImage : origin + rawImage) : DEFAULT_OG_IMAGE;
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

    setMeta("property", "og:type", "article");
    setMeta("property", "og:site_name", SITE_NAME);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", desc);
    setMeta("property", "og:image", image);
    setMeta("property", "og:image:width", "1200");
    setMeta("property", "og:image:height", "630");
    setMeta("property", "og:url", url);
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
