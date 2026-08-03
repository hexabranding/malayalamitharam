import { useState, useEffect } from "react";
import { fetchNews, fetchCategories } from "../services/api.js";
import { ArticleImage } from "../services/images.jsx";
import { articles as fallback } from "../data/news.js";
import AdSlot from "../components/AdSlot.jsx";
import ArticleCard from "../components/ArticleCard.jsx";
import PageLayout from "../components/PageLayout.jsx";
import NewsCarousel from "../components/NewsCarousel.jsx";
import PhotoGallery from "../components/PhotoGallery.jsx";
import VideoSection from "../components/VideoSection.jsx";

const CATEGORY_SECTIONS_MAP = {
  gulf: { title: "ഗൾഫ്", slug: "gulf" },
  sports: { title: "കായികം", slug: "sports" },
  entertainment: { title: "വിനോദം", slug: "entertainment" },
  "life-style": { title: "ലൈഫ് സ്റ്റൈൽ", slug: "life-style" },
  "multi-media": { title: "മൾട്ടിമീഡിയ", slug: "multi-media" },
  veedu: { title: "വീട്", slug: "veedu" },
  column: { title: "കോളം", slug: "column" },
  more: { title: "മറ്റുള്ളവ", slug: "more" },
};

export default function HomePage({ navigate }) {
  const [articles, setArticles] = useState(fallback);
  const [categoryGroups, setCategoryGroups] = useState([]);

  useEffect(() => {
    function loadArticles() {
      fetchNews({ limit: 50 }).then(data => {
        const fetched = data.news || [];
        if (fetched.length > 0) setArticles(fetched);
      }).catch(() => {});
    }
    loadArticles();
    window.addEventListener("mm-data-updated", loadArticles);
    return () => window.removeEventListener("mm-data-updated", loadArticles);
  }, []);

  useEffect(() => {
    fetchCategories().then(data => {
      if (Array.isArray(data)) {
        const filtered = data.filter(g => g.slug !== "news" && CATEGORY_SECTIONS_MAP[g.slug]);
        setCategoryGroups(filtered);
      }
    }).catch(() => {});
  }, []);

  const leadStory = articles.find((article) => article.featured) || articles[0];
  const editorialStories = articles.filter((article) => article.category === "politics" || article.category === "opinion").slice(0, 3);
  const fallbackEditorial = articles.filter((a) => a.id !== leadStory.id).slice(0, 3);
  const leftColumnStories = editorialStories.length ? editorialStories : fallbackEditorial;

  const selectedMainStories = articles.filter((article) => article.mainNews && article.id !== leadStory.id).slice(0, 4);
  const briefStories = articles.filter((article) => article.id !== leadStory.id && !leftColumnStories.some((l) => l.id === article.id)).slice(0, 4);
  const rightColumnStories = selectedMainStories.length ? selectedMainStories : briefStories.length ? briefStories : articles.slice(1, 5);

  const breakingStories = articles.filter((a) => a.breaking);
  const tickerStories = breakingStories.length > 0 ? breakingStories : articles.slice(0, 5);

  const keralaStories = articles.filter((a) => a.category === "kerala" || a.categoryMl === "കേരളം");
  const keralaLead = keralaStories[0] || articles[1];
  const keralaSide = keralaStories.slice(1, 4).length ? keralaStories.slice(1, 4) : articles.slice(2, 5);

  const nationalStories = articles.filter((a) => a.category === "india" || a.categoryMl === "ദേശീയം").slice(0, 5);
  const internationalStories = articles.filter((a) => a.category === "world" || a.categoryMl === "അന്തർദേശീയം").slice(0, 5);
  const worldStories = [...new Map([...nationalStories, ...internationalStories].map(a => [a.id, a])).values()].slice(0, 5);

  const displayMedia = articles.filter((a) => (a.media === "photo" || a.media === "video") && a.image).slice(0, 4);
  const latestUpdates = articles.slice(0, 6);

  const dynamicCategorySections = categoryGroups.map((group) => {
    const childSlugs = (group.children || []).map(c => c.slug);
    const sectionConfig = CATEGORY_SECTIONS_MAP[group.slug] || {};
    return {
      title: sectionConfig.title || group.titleMl || group.label,
      slug: sectionConfig.slug || group.slug,
      articles: articles.filter(a => childSlugs.includes(a.category) || a.category === group.slug).slice(0, 4),
    };
  }).filter(section => section.articles.length > 0);

  return (
    <div className="home-page">
      <div className="news-ticker">
        <span className="news-ticker-label">BREAKING NEWS</span>
        <div className="news-ticker-text">
          <div className="news-ticker-content">
            {tickerStories.map((story) => (
              <span key={story.id} className={`clickable ${story.breaking ? "breaking-alert" : ""}`} onClick={() => navigate("/post/" + story.id)}>
                {story.breaking ? "🚨" : "📢"} {story.title} •
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="container">
        <AdSlot slot="top-leaderboard" label="Top Leaderboard Ad (1280 x 250)" />
      </div>

      <NewsCarousel articles={articles} navigate={navigate} />

      <section className="container latest-strip" aria-label="Latest updates" data-aos="fade-up">
        <div className="latest-strip-title">
          <strong>Latest Updates</strong>
          <button type="button" onClick={() => navigate("/search")}>View all</button>
        </div>
        <div className="latest-strip-list">
          {latestUpdates.map((article) => (
            <button key={article.id} type="button" onClick={() => navigate("/post/" + article.id)}>
              <span>{article.categoryMl}</span>
              {article.title}
            </button>
          ))}
        </div>
      </section>

      <section className="container home-hero" data-aos="fade-up">
        <div className="newspaper-front" data-aos="fade-up">
          <aside className="editorial-col">
            {leftColumnStories.map((story) => (
              <article key={story.id} className="editorial-story clickable" onClick={() => navigate("/post/" + story.id)}>
                <small>{story.categoryMl || "രാഷ്ട്രീയം"}</small>
                <h4>{story.title}</h4>
                <p>{story.excerpt}</p>
              </article>
            ))}
          </aside>

          <div className="lead-col" data-aos="fade-up" data-aos-delay="100">
            <article className="newspaper-lead-card clickable" onClick={() => navigate("/post/" + leadStory.id)}>
              <ArticleImage article={leadStory} alt={leadStory.title} />
              <div className="lead-copy">
                <span className="lead-category">{leadStory.categoryMl}</span>
                <h2>{leadStory.title}</h2>
                <p>{leadStory.excerpt}</p>
                <button className="read-more-btn" type="button" data-aos="zoom-in" data-aos-delay="150">വിശദമായി വായിക്കുക</button>
              </div>
            </article>
          </div>

          <aside className="briefs-col" data-aos="fade-up" data-aos-delay="200">
            <h3 className="column-title">പ്രധാന വാർത്തകൾ</h3>
            {rightColumnStories.map((story) => (
              <div key={story.id} className="brief-story-card clickable" onClick={() => navigate("/post/" + story.id)}>
                <ArticleImage article={story} alt={story.title} className="brief-story-img" />
                <div>
                  <h4>{story.title}</h4>
                </div>
              </div>
            ))}
          </aside>
        </div>
      </section>

      <div className="container">
        <AdSlot slot="mid-leaderboard" label="Mid Leaderboard Ad (1280 x 250)" />
      </div>

      <PageLayout navigate={navigate} className="home-below-fold">
        <section className="section-block" data-aos="fade-up">
          <div className="section-block-title" data-aos="fade-left">
            <span>കേരളം</span>
            <button type="button" onClick={() => navigate("/category/kerala")}>View All</button>
          </div>
          <div className="news-split-layout">
            <div className="news-split-main">
              <ArticleCard article={keralaLead} navigate={navigate} variant="feature-card" dataAosDelay={0} />
            </div>
            <div className="news-split-side">
              {keralaSide.map((article, i) => (
                <ArticleCard key={article.id} article={article} navigate={navigate} variant="compact" dataAosDelay={100 + i * 50} />
              ))}
            </div>
          </div>
        </section>

        <section className="section-block" data-aos="fade-up">
          <div className="section-block-title" data-aos="fade-left">
            <span>ദേശീയം</span>
            <button type="button" onClick={() => navigate("/category/india")}>View All</button>
          </div>
          <div className="card-grid">
            {nationalStories.map((article, i) => (
              <ArticleCard key={article.id} article={article} navigate={navigate} variant="default" dataAosDelay={i * 50} />
            ))}
          </div>
        </section>

        <section className="section-block" data-aos="fade-up">
          <div className="section-block-title" data-aos="fade-left">
            <span>അന്തർദേശീയം</span>
            <button type="button" onClick={() => navigate("/category/world")}>View All</button>
          </div>
          <div className="card-grid">
            {internationalStories.map((article, i) => (
              <ArticleCard key={article.id} article={article} navigate={navigate} variant="default" dataAosDelay={i * 50} />
            ))}
          </div>
        </section>

        {dynamicCategorySections.map((section, i) => (
          <section className="section-block" key={section.title} data-aos="fade-up" data-aos-delay={i * 50}>
            <div className="section-block-title" data-aos="fade-left">
              <span>{section.title}</span>
              <button type="button" onClick={() => navigate("/category/" + section.slug)}>View all</button>
            </div>
            <div className="card-grid">
              {section.articles.map((article, j) => (
                <ArticleCard key={article.id} article={article} navigate={navigate} variant="default" dataAosDelay={j * 50} />
              ))}
            </div>
          </section>
        ))}
      </PageLayout>

      {displayMedia.length > 0 && (
        <section className="multimedia-section" style={{ padding: "32px 0" }} data-aos="fade-up">
          <div className="container">
            <div className="multimedia-title" data-aos="fade-left">
              <span>മൾട്ടിമീഡിയ</span>
              <button type="button" onClick={() => navigate("/category/photos")}>View Gallery</button>
            </div>
            <div className="multimedia-grid">
              {displayMedia.map((article, i) => (
                <div key={article.id} className="multimedia-card clickable" data-aos="zoom-in" data-aos-delay={i * 100} onClick={() => navigate("/post/" + article.id)}>
                  <div className="media-thumbnail">
                    <ArticleImage article={article} alt={article.title} />
                    <span className="media-badge">{article.media === "video" ? "VIDEO" : "PHOTO"}</span>
                  </div>
                  <h4>{article.title}</h4>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <VideoSection articles={articles} navigate={navigate} />
      <PhotoGallery articles={articles} navigate={navigate} />

      <section className="container section-block" style={{ borderBottom: "none" }} data-aos="fade-up">
        <div className="section-block-title" data-aos="fade-left">
          <span>കൂടുതൽ വാർത്തകൾ</span>
        </div>
        <div className="list-feed">
          {articles.slice(0, 12).map((article, i) => (
            <ArticleCard key={article.id} article={article} navigate={navigate} variant="compact" dataAosDelay={i * 50} />
          ))}
        </div>
        <div style={{ textAlign: 'center', margin: '20px 0' }}>
          <button className="pagination-btn" onClick={() => navigate("/search")}>View All News</button>
        </div>
      </section>

      <div className="container">
        <div className="home-before-footer-ads">
          <AdSlot slot="home-footer-ad-1" label="Home Footer Ad 1" />
          <AdSlot slot="home-footer-ad-2" label="Home Footer Ad 2" />
          <AdSlot slot="home-footer-ad-3" label="Home Footer Ad 3" />
        </div>
      </div>

      <div className="container home-bottom-ad">
        <AdSlot slot="bottom-leaderboard" label="Bottom Leaderboard Ad (1280 x 250)" />
      </div>
    </div>
  );
}
