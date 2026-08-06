import { useState, useEffect } from "react";
import { fetchNews, fetchCategories } from "../services/api.js";
import { ArticleImage } from "../services/images.jsx";
import { getCategoryName, preloadCategories } from "../services/categories.jsx";
import { articles as fallback } from "../data/news.js";
import AdSlot from "../components/AdSlot.jsx";
import ArticleCard from "../components/ArticleCard.jsx";
import PageLayout from "../components/PageLayout.jsx";
import NewsCarousel from "../components/NewsCarousel.jsx";
import PhotoGallery from "../components/PhotoGallery.jsx";
import VideoSection from "../components/VideoSection.jsx";

const SECTION_LABELS = {
  gulf: "ഗൾഫ്",
  sports: "കായികം",
  entertainment: "വിനോദം",
  "life-style": "ലൈഫ് സ്റ്റൈൽ",
  "multi-media": "മൾട്ടിമീഡിയ",
  veedu: "വീട്",
  column: "കോളം",
  more: "മറ്റുള്ളവ",
};

const SKIP_SECTIONS = ["news"];

export default function HomePage({ navigate }) {
  const [articles, setArticles] = useState(fallback);
  const [categoryGroups, setCategoryGroups] = useState([]);

  useEffect(() => {
    preloadCategories();
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
        setCategoryGroups(data.filter(g => !SKIP_SECTIONS.includes(g.slug)));
      }
    }).catch(() => {});
  }, []);

  const leadStory = articles[0];
  const editorialStories = articles.filter((article) => article.category === "politics" || article.category === "opinion").slice(0, 3);
  const fallbackEditorial = articles.filter((a) => a.id !== leadStory?.id).slice(0, 3);
  const leftColumnStories = editorialStories.length ? editorialStories : fallbackEditorial;

  const selectedMainStories = articles.filter((article) => article.mainNews && article.id !== leadStory?.id).slice(0, 4);
  const briefStories = articles.filter((article) => article.id !== leadStory?.id && !leftColumnStories.some((l) => l.id === article.id)).slice(0, 4);
  const rightColumnStories = selectedMainStories.length ? selectedMainStories : briefStories.length ? briefStories : articles.slice(1, 5);

  const breakingStories = articles.filter((a) => a.breaking);
  const tickerStories = breakingStories.length > 0 ? breakingStories : articles.slice(0, 5);

  const allChildSlugs = categoryGroups.flatMap(g => (g.children || []).map(c => c.slug));

  function findChildSlugsByLabel(labels) {
    const found = [];
    categoryGroups.forEach(g => {
      (g.children || []).forEach(c => {
        if (labels.some(l => c.label?.toLowerCase() === l.toLowerCase())) {
          found.push(c.slug);
        }
      });
    });
    return found;
  }

  const keralaSlugs = findChildSlugsByLabel(["Kerala"]);
  const indiaSlugs = findChildSlugsByLabel(["India"]);
  const worldSlugs = findChildSlugsByLabel(["World"]);

  const gulfLabels = ["Gulf", "ഗൾഫ്"];
  let gulfSlugs = findChildSlugsByLabel(gulfLabels);
  const gulfGroup = categoryGroups.find(g => gulfLabels.some(l => g.label?.toLowerCase() === l.toLowerCase()) || g.slug === "gulf");
  if (gulfGroup) {
    gulfSlugs = [gulfGroup.slug, ...(gulfGroup.children || []).map(c => c.slug), ...gulfSlugs];
  }

  function matchByCategoryOrLabel(article, slugs, labels) {
    if (slugs.length > 0 && slugs.includes(article.category)) return true;
    if (article.categories && article.categories.some(c => slugs.includes(c))) return true;
    if (labels.some(l => article.categoryMl?.toLowerCase() === l.toLowerCase())) return true;
    if (labels.some(l => article.category?.toLowerCase() === l.toLowerCase())) return true;
    return false;
  }

  const keralaStories = articles.filter(a => matchByCategoryOrLabel(a, keralaSlugs, ["Kerala", "കേരളം"]));
  const keralaLead = keralaStories[0] || articles[1];
  const keralaSide = keralaStories.slice(1, 5).length ? keralaStories.slice(1, 5) : articles.slice(2, 6);

  const nationalStories = articles.filter(a => matchByCategoryOrLabel(a, indiaSlugs, ["India", "ദേശിയം", "ഇന്ത്യ"])).slice(0, 6);
  const nationalLead = nationalStories[0] || articles[2];
  const nationalSide = nationalStories.slice(1, 5).length ? nationalStories.slice(1, 5) : articles.slice(3, 7);

  const internationalStories = articles.filter(a => matchByCategoryOrLabel(a, worldSlugs, ["World", "അന്തർദേശിയം", "ലോകം"])).slice(0, 6);
  const internationalLead = internationalStories[0] || articles[3];
  const internationalSide = internationalStories.slice(1, 5).length ? internationalStories.slice(1, 5) : articles.slice(4, 8);

  const gulfStories = articles.filter(a => gulfSlugs.includes(a.category) || matchByCategoryOrLabel(a, gulfSlugs, ["Gulf", "ഗൾഫ്"])).slice(0, 8);
  const gulfTop = gulfStories.slice(0, 2);
  const gulfBottomLeft = gulfStories.slice(2, 5);
  const gulfBottomRight = gulfStories.slice(5, 8);

  const displayMedia = articles.filter((a) => (a.media === "photo" || a.media === "video") && a.image).slice(0, 4);
  const latestUpdates = articles.slice(0, 6);

  const handledSlugs = new Set([
    ...keralaSlugs, ...indiaSlugs, ...worldSlugs, ...gulfSlugs,
    ...categoryGroups.filter(g => g.label === "NEWS" || g.slug === "news").map(g => g.slug)
  ]);
  const dynamicCategorySections = categoryGroups
    .filter(group => !handledSlugs.has(group.slug))
    .map((group) => {
      const childSlugs = (group.children || []).map(c => c.slug);
      const sectionArticles = articles.filter(a =>
        childSlugs.includes(a.category) || a.category === group.slug ||
        (a.categories && a.categories.some(c => childSlugs.includes(c) || c === group.slug))
      ).slice(0, 6);
      if (sectionArticles.length === 0) return null;
      return {
        title: SECTION_LABELS[group.slug] || group.titleMl || group.label,
        slug: group.slug,
        articles: sectionArticles,
        lead: sectionArticles[0],
        side: sectionArticles.slice(1, 5),
      };
    })
    .filter(Boolean);

  return (
    <div className="home-page">
      <div className="news-ticker">
        <span className="news-ticker-label">BREAKING NEWS</span>
        <div className="news-ticker-text">
          <div className="news-ticker-content">
            {tickerStories.map((story) => (
              <span key={story.id} className={`clickable ${story.breaking ? "breaking-alert" : ""}`} onClick={() => navigate("/post/" + story.id)}>
                {story.breaking ? "\u{1F6A8}" : "\u{1F4E2}"} {story.title} \u2022
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="container">
        <AdSlot slot="top-leaderboard" label="Top Leaderboard Ad (1280 x 250)" slider />
      </div>

      <NewsCarousel articles={articles} navigate={navigate} latestUpdates={latestUpdates} />

      <section className="container latest-strip" aria-label="Latest updates" data-aos="fade-up" style={{ display: "none" }}>
        <div className="latest-strip-title">
          <strong>Latest Updates</strong>
          <button type="button" onClick={() => navigate("/search")}>View all</button>
        </div>
        <div className="latest-strip-list">
          {latestUpdates.map((article) => (
            <button key={article.id} type="button" onClick={() => navigate("/post/" + article.id)}>
              <span>{getCategoryName(article)}</span>
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
                <small>{getCategoryName(story) || "രാഷ്ട്രീയം"}</small>
                <h4>{story.title}</h4>
                <p>{story.excerpt}</p>
              </article>
            ))}
          </aside>

          <div className="lead-col" data-aos="fade-up" data-aos-delay="100">
            <article className="newspaper-lead-card clickable" onClick={() => navigate("/post/" + leadStory.id)}>
              <ArticleImage article={leadStory} alt={leadStory.title} />
              <div className="lead-copy">
                <span className="lead-category">{getCategoryName(leadStory)}</span>
                <h2>{leadStory.title}</h2>
                <p>{leadStory.excerpt}</p>
                <button className="read-more-btn" type="button" data-aos="zoom-in" data-aos-delay="150">വിശദമായി വായിക്കുക</button>
              </div>
            </article>
            <div className="lead-mini-grid">
              {(() => {
                const usedIds = new Set([leadStory?.id, ...leftColumnStories.map(s => s.id), ...rightColumnStories.map(s => s.id)]);
                const miniNews = articles.filter(a => !usedIds.has(a.id)).slice(0, 4);
                return miniNews.map((article) => (
                  <div key={article.id} className="lead-mini-card clickable" onClick={() => navigate("/post/" + article.id)}>
                    {article.image && <ArticleImage article={article} alt={article.title} />}
                    <h5>{article.title}</h5>
                  </div>
                ));
              })()}
            </div>
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

        {nationalStories.length > 0 && (
          <section className="section-block" data-aos="fade-up">
            <div className="section-block-title" data-aos="fade-left">
              <span>ദേശിയം</span>
              <button type="button" onClick={() => navigate("/category/india")}>View All</button>
            </div>
            <div className="news-split-layout reversed">
              <div className="news-split-main">
                <ArticleCard article={nationalLead} navigate={navigate} variant="feature-card" dataAosDelay={0} />
              </div>
              <div className="news-split-side">
                {nationalSide.map((article, i) => (
                  <ArticleCard key={article.id} article={article} navigate={navigate} variant="compact" dataAosDelay={100 + i * 50} />
                ))}
              </div>
            </div>
          </section>
        )}

        {internationalStories.length > 0 && (
          <section className="section-block" data-aos="fade-up">
            <div className="section-block-title" data-aos="fade-left">
              <span>അന്തർദേശിയം</span>
              <button type="button" onClick={() => navigate("/category/world")}>View All</button>
            </div>
            <div className="news-split-layout">
              <div className="news-split-main">
                <ArticleCard article={internationalLead} navigate={navigate} variant="feature-card" dataAosDelay={0} />
              </div>
              <div className="news-split-side">
                {internationalSide.map((article, i) => (
                  <ArticleCard key={article.id} article={article} navigate={navigate} variant="compact" dataAosDelay={100 + i * 50} />
                ))}
              </div>
            </div>
          </section>
        )}

        {gulfStories.length > 0 && (
          <section className="section-block" data-aos="fade-up">
            <div className="section-block-title" data-aos="fade-left">
              <span>ഗൾഫ്</span>
              <button type="button" onClick={() => navigate("/category/gulf")}>View All</button>
            </div>
            {gulfTop.length > 0 && (
              <div className="gulf-top-row">
                {gulfTop.map((article, i) => (
                  <ArticleCard key={article.id} article={article} navigate={navigate} variant="default" dataAosDelay={i * 50} />
                ))}
              </div>
            )}
            <div className="gulf-bottom-row">
              {gulfBottomLeft.length > 0 && (
                <div className="gulf-bottom-col">
                  {gulfBottomLeft.map((article, i) => (
                    <ArticleCard key={article.id} article={article} navigate={navigate} variant="compact" dataAosDelay={100 + i * 50} />
                  ))}
                </div>
              )}
              {gulfBottomRight.length > 0 && (
                <div className="gulf-bottom-col">
                  {gulfBottomRight.map((article, i) => (
                    <ArticleCard key={article.id} article={article} navigate={navigate} variant="compact" dataAosDelay={250 + i * 50} />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {dynamicCategorySections.map((section, i) => (
          <section className="section-block" key={section.slug} data-aos="fade-up" data-aos-delay={i * 50}>
            <div className="section-block-title" data-aos="fade-left">
              <span>{section.title}</span>
              <button type="button" onClick={() => navigate("/category/" + section.slug)}>View all</button>
            </div>
            <div className={`news-split-layout${i % 2 === 0 ? "" : " reversed"}`}>
              <div className="news-split-main">
                <ArticleCard article={section.lead} navigate={navigate} variant="feature-card" dataAosDelay={0} />
              </div>
              <div className="news-split-side">
                {section.side.map((article, j) => (
                  <ArticleCard key={article.id} article={article} navigate={navigate} variant="compact" dataAosDelay={100 + j * 50} />
                ))}
              </div>
            </div>
          </section>
        ))}
      </PageLayout>

      <section className="multimedia-section" style={{ padding: "32px 0" }} data-aos="fade-up">
        <div className="container">
          <div className="multimedia-title" data-aos="fade-left">
            <span>മൾട്ടിമീഡിയ</span>
            <button type="button" onClick={() => navigate("/category/photos")}>View Gallery</button>
          </div>
          {displayMedia.length > 0 && (
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
          )}
          <VideoSection articles={articles} navigate={navigate} />
        </div>
      </section>

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
        <div style={{ textAlign: "center", margin: "20px 0" }}>
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
