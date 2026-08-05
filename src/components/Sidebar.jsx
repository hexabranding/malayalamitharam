import { useEffect, useRef } from "react";
import { Clock3, Star } from "lucide-react";
import { trendingTags } from "../services/api.js";
import { ArticleImage } from "../services/images.jsx";
import { getCategoryName } from "../services/categories.jsx";
import AdSlot from "./AdSlot.jsx";

export default function Sidebar({ navigate, articles = [] }) {
  const sidebarRef = useRef(null);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const el = sidebarRef.current;
          if (!el) { ticking = false; return; }
          const scrollY = window.scrollY;
          if (scrollY < lastScrollY) {
            el.classList.add("sidebar-pull");
            el.classList.remove("sidebar-push");
          } else if (scrollY > lastScrollY) {
            el.classList.add("sidebar-push");
            el.classList.remove("sidebar-pull");
          }
          lastScrollY = scrollY;
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const selectedPopular = articles.filter((article) => article.popular).slice(0, 4);
  const popular = selectedPopular.length
    ? selectedPopular
    : [...articles].sort((a, b) => (b.comments || 0) - (a.comments || 0)).slice(0, 4);
  const latest = articles.slice(0, 5);
  const editorPicks = articles.filter((article) => article.featured).slice(0, 3);

  return (
    <aside className="sidebar" ref={sidebarRef}>
      <AdSlot slot="sidebar" label="Sidebar Ad" compact slider />

      <section className="sidebar-block sidebar-latest">
        <h2><Clock3 size={18} /> Latest News</h2>
        {latest.map((article, index) => (
          <button className="headline-link" key={article.id} onClick={() => navigate("/post/" + article.id)}>
            <ArticleImage article={article} alt="" className="headline-link-img" />
            <span>
              <em>{String(index + 1).padStart(2, "0")}</em>
              <strong>{article.title}</strong>
            </span>
          </button>
        ))}
      </section>

      <section className="sidebar-block">
        <h2>Popular</h2>
        {popular.map((article) => (
          <button className="mini-story" key={article.id} onClick={() => navigate("/post/" + article.id)}>
            <ArticleImage article={article} alt="" className="mini-story-img" />
            <span>{article.title}</span>
          </button>
        ))}
      </section>

      {editorPicks.length > 0 && (
        <section className="sidebar-block editor-picks">
          <h2><Star size={18} /> Editor Picks</h2>
          {editorPicks.map((article) => (
            <button key={article.id} type="button" onClick={() => navigate("/post/" + article.id)}>
              <strong>{getCategoryName(article)}</strong>
              <span>{article.title}</span>
            </button>
          ))}
        </section>
      )}

      <section className="sidebar-block">
        <h2>Tags</h2>
        <div className="tags">
          {trendingTags.map((tag) => (
            <button key={tag} onClick={() => navigate("/tags/" + encodeURIComponent(tag))}>{tag}</button>
          ))}
        </div>
      </section>

      <section className="newsletter">
        <h2>News Alert</h2>
        <p>Get the latest updates directly in your inbox.</p>
        <input placeholder="email@example.com" />
        <button>Subscribe</button>
      </section>
    </aside>
  );
}
