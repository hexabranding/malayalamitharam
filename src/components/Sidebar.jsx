import { useEffect, useRef, useState } from "react";
import { Clock3, Star } from "lucide-react";
import { fetchNews, fetchTags } from "../services/api.js";
import { ArticleImage } from "../services/images.jsx";
import { getCategoryName } from "../services/categories.jsx";
import { getTitleSlug, registerArticles } from "../utils/articleStore.js";
import AdSlot from "./AdSlot.jsx";

export default function Sidebar({ navigate, articles = [] }) {
  const sidebarRef = useRef(null);
  const [latestNews, setLatestNews] = useState([]);
  const [tags, setTags] = useState([]);

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

  useEffect(() => {
    if (articles.length === 0) {
      fetchNews({ limit: 20 }).then(data => {
        const results = data.news || [];
        setLatestNews(results);
        registerArticles(results);
      }).catch(() => {});
    } else {
      registerArticles(articles);
    }
    fetchTags().then(data => {
      if (Array.isArray(data)) setTags(data);
    }).catch(() => {});
  }, [articles.length]);

  const displayArticles = articles.length > 0 ? articles : latestNews;

  const popular = [...displayArticles].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);
  const latest = displayArticles.slice(0, 5);
  const editorPicks = displayArticles.filter((article) => article.featured).slice(0, 3);

  return (
    <aside className="sidebar" ref={sidebarRef}>
      <AdSlot slot="sidebar" label="Sidebar Ad" compact slider />

      <section className="sidebar-block sidebar-latest">
        <h2><Clock3 size={18} /> Latest News</h2>
        {latest.map((article, index) => (
          <button className="headline-link" key={article.id} onClick={() => navigate("/news/" + getTitleSlug(article))}>
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
          <button className="mini-story" key={article.id} onClick={() => navigate("/news/" + getTitleSlug(article))}>
            <ArticleImage article={article} alt="" className="mini-story-img" />
            <span>{article.title}</span>
          </button>
        ))}
      </section>

      {editorPicks.length > 0 && (
        <section className="sidebar-block editor-picks">
          <h2><Star size={18} /> Editor Picks</h2>
          {editorPicks.map((article) => (
            <button key={article.id} type="button" onClick={() => navigate("/news/" + getTitleSlug(article))}>
              <strong>{getCategoryName(article)}</strong>
              <span>{article.title}</span>
            </button>
          ))}
        </section>
      )}

      <section className="sidebar-block">
        <h2>Tags</h2>
        <div className="tags">
          {tags.length > 0 ? tags.slice(0, 15).map((tag) => (
            <button key={tag._id || tag.name} onClick={() => navigate("/tags/" + encodeURIComponent(tag.name))}>{tag.name}</button>
          )) : ["കേരളം", "ഇന്ത്യ", "ഗൾഫ്", "സിനിമ", "ഫുട്ബോൾ", "ടെക്", "ആരോഗ്യം"].map((tag) => (
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
