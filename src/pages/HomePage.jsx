import { useState, useEffect } from "react";
import { fetchNews, fetchCategories, fetchCategoriesLatest } from "../services/api.js";
import { ArticleImage } from "../services/images.jsx";
import { getCategoryName, preloadCategories } from "../services/categories.jsx";
import { articles as fallback } from "../data/news.js";
import { getTitleSlug, registerArticles, loadCachedArticles } from "../utils/articleStore.js";
import AdSlot from "../components/AdSlot.jsx";
import ArticleCard from "../components/ArticleCard.jsx";
import PageLayout from "../components/PageLayout.jsx";
import NewsCarousel from "../components/NewsCarousel.jsx";
import PhotoGallery from "../components/PhotoGallery.jsx";
import VideoSection from "../components/VideoSection.jsx";
import { useT } from "../context/LangContext.jsx";

const SKIP_SECTIONS = ["news", "News", "Keralam", "keralam"];

export default function HomePage({ navigate }) {
  const t = useT();

  const SECTION_LABELS = {
    gulf: t("home.section.gulf"),
    sports: t("home.section.sports"),
    entertainment: t("home.section.entertainment"),
    "life-style": t("home.section.lifeStyle"),
    "multi-media": t("home.section.multimedia"),
    veedu: t("home.section.veedu"),
    column: t("home.section.column"),
    more: t("home.section.more"),
  };

  const [articles, setArticles] = useState(() => {
    const cached = loadCachedArticles();
    return cached.length > 0 ? cached : fallback;
  });
  const [categoryGroups, setCategoryGroups] = useState([]);
  const [categoryArticlesMap, setCategoryArticlesMap] = useState({});
  const [extraMedia, setExtraMedia] = useState([]);

  useEffect(() => {
    preloadCategories();
    function loadArticles() {
      fetchNews({ limit: 100 }).then(data => {
        const fetched = data.news || [];
        if (fetched.length > 0) {
          setArticles(fetched);
          registerArticles(fetched);
        }
      }).catch(() => {});

      fetchCategoriesLatest().then(catMap => {
        if (catMap && typeof catMap === "object" && Object.keys(catMap).length > 0) {
          setCategoryArticlesMap(catMap);
          const allCatArticles = Object.values(catMap).flat();
          if (allCatArticles.length > 0) registerArticles(allCatArticles);
        }
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

  // If no photo/video in first 50, search deeper pages for existing multimedia (paginated)
  useEffect(() => {
    const hasLocalMedia = articles.some((a) => (a.media === "photo" || a.media === "video") && a.image);
    if (hasLocalMedia) {
      setExtraMedia([]);
      return;
    }
    let cancelled = false;
    async function loadExistingMedia() {
      const collected = [];
      for (let p = 2; p <= 6; p++) {
        try {
          const data = await fetchNews({ limit: 50, page: p });
          const m = (data.news || []).filter((a) => (a.media === "photo" || a.media === "video") && a.image);
          if (m.length > 0) collected.push(...m);
          if (collected.length >= 4) break;
        } catch {
          break;
        }
      }
      if (!cancelled && collected.length > 0) setExtraMedia(collected.slice(0, 4));
    }
    loadExistingMedia();
    return () => { cancelled = true; };
  }, [articles]);


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

  function findCategorySlugs(labelsOrSlugs) {
    const found = new Set();
    const targets = labelsOrSlugs.map(s => String(s || "").toLowerCase().trim()).filter(Boolean);
    categoryGroups.forEach(g => {
      const gSlug = String(g.slug || "").toLowerCase();
      const gLabel = String(g.label || "").toLowerCase();
      const gTitle = String(g.titleMl || "").toLowerCase();
      const gMatch = targets.includes(gSlug) || targets.includes(gLabel) || targets.includes(gTitle);
      if (gMatch) {
        if (g.slug) found.add(g.slug);
        (g.children || []).forEach(c => { if (c.slug) found.add(c.slug); });
      }
      (g.children || []).forEach(c => {
        const cSlug = String(c.slug || "").toLowerCase();
        const cLabel = String(c.label || "").toLowerCase();
        const cTitle = String(c.titleMl || "").toLowerCase();
        if (targets.includes(cSlug) || targets.includes(cLabel) || targets.includes(cTitle)) {
          if (c.slug) found.add(c.slug);
        }
      });
    });
    labelsOrSlugs.forEach(s => { if (s) found.add(s); });
    return Array.from(found);
  }

  function matchByCategoryOrLabel(article, slugs, labels) {
    if (!article) return false;
    const lowerSlugs = (slugs || []).map(s => String(s).toLowerCase().trim());
    const lowerLabels = (labels || []).map(l => String(l).toLowerCase().trim());

    const artCat = String(article.category || "").toLowerCase().trim();
    if (artCat && (lowerSlugs.includes(artCat) || lowerLabels.includes(artCat))) return true;

    if (Array.isArray(article.categories)) {
      if (article.categories.some(c => {
        const lc = String(c || "").toLowerCase().trim();
        return lowerSlugs.includes(lc) || lowerLabels.includes(lc);
      })) return true;
    }

    const artMl = String(article.categoryMl || "").toLowerCase().trim();
    if (artMl && (lowerLabels.includes(artMl) || lowerSlugs.includes(artMl))) return true;

    return false;
  }

  function getArticlesForCategory(slugs = [], labels = []) {
    const seen = new Set();
    const result = [];

    const lowerSlugs = slugs.map(s => String(s || "").toLowerCase().trim()).filter(Boolean);
    const lowerLabels = labels.map(l => String(l || "").toLowerCase().trim()).filter(Boolean);

    // 1. From database category aggregation (ensures news never disappears after 1 week)
    for (const [key, list] of Object.entries(categoryArticlesMap || {})) {
      const lk = String(key || "").toLowerCase().trim();
      if (lowerSlugs.includes(lk) || lowerLabels.includes(lk)) {
        for (const item of (list || [])) {
          const id = item?.id || item?.slug;
          if (id && !seen.has(id)) {
            seen.add(id);
            result.push(item);
          }
        }
      }
    }

    // 2. Also check general articles list in state
    for (const a of articles) {
      if (matchByCategoryOrLabel(a, slugs, labels)) {
        const id = a?.id || a?.slug;
        if (id && !seen.has(id)) {
          seen.add(id);
          result.push(a);
        }
      }
    }

    // Sort newest first: the latest published news is current, previous news moves down
    result.sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0));
    return result;
  }

  // Ensures news-split-side is ALWAYS 100% full (e.g. 4 cards)
  function fillSplitSection(categoryStories = [], fallbackPool = [], sideCount = 4) {
    const lead = categoryStories[0] || fallbackPool[0] || articles[0];
    const usedIds = new Set([lead?.id || lead?.slug].filter(Boolean));

    const side = [];
    // 1. Previous news from this category
    for (let i = 1; i < categoryStories.length; i++) {
      const item = categoryStories[i];
      const id = item?.id || item?.slug;
      if (id && !usedIds.has(id)) {
        usedIds.add(id);
        side.push(item);
        if (side.length >= sideCount) break;
      }
    }

    // 2. Backfill remaining slots from fallbackPool so news-split-side is never empty
    if (side.length < sideCount) {
      for (const item of fallbackPool) {
        const id = item?.id || item?.slug;
        if (id && !usedIds.has(id)) {
          usedIds.add(id);
          side.push(item);
          if (side.length >= sideCount) break;
        }
      }
    }

    return { lead, side };
  }

  function fillGulfStories(stories = [], fallbackPool = []) {
    const pool = [...stories];
    const usedIds = new Set(pool.map(a => a.id || a.slug).filter(Boolean));
    for (const item of fallbackPool) {
      if (pool.length >= 8) break;
      const id = item?.id || item?.slug;
      if (id && !usedIds.has(id)) {
        usedIds.add(id);
        pool.push(item);
      }
    }
    return {
      top: pool.slice(0, 2),
      bottomLeft: pool.slice(2, 5),
      bottomRight: pool.slice(5, 8),
    };
  }

  const keralaSlugs = findCategorySlugs(["Kerala", "Keralam", "കേരളം"]);
  const keralaStories = getArticlesForCategory(keralaSlugs, ["Kerala", "കേരളം", "Keralam"]);
  const { lead: keralaLead, side: keralaSide } = fillSplitSection(keralaStories, articles.slice(1));

  const indiaSlugs = findCategorySlugs(["India", "ദേശീയം", "ഇന്ത്യ"]);
  const nationalStories = getArticlesForCategory(indiaSlugs, ["India", "ദേശീയം", "ദേശിയം", "ഇന്ത്യ"]);
  const { lead: nationalLead, side: nationalSide } = fillSplitSection(nationalStories, articles.slice(2));

  const worldSlugs = findCategorySlugs(["World", "അന്തർദേശീയം", "ലോകം"]);
  const internationalStories = getArticlesForCategory(worldSlugs, ["World", "അന്തർദേശീയം", "അന്തർദേശിയം", "ലോകം"]);
  const { lead: internationalLead, side: internationalSide } = fillSplitSection(internationalStories, articles.slice(3));

  const gulfLabels = ["Gulf", "ഗൾഫ്"];
  const gulfSlugs = findCategorySlugs(["Gulf", "ഗൾഫ്", "saudi-arabia", "uae", "kuwait", "qatar", "oman", "bahrain"]);
  const gulfStories = getArticlesForCategory(gulfSlugs, gulfLabels);
  const { top: gulfTop, bottomLeft: gulfBottomLeft, bottomRight: gulfBottomRight } = fillGulfStories(gulfStories, articles.slice(4));

  const viewsSlugs = findCategorySlugs(["Views", "അഭിപ്രായം", "കാഴ്ചപ്പാട്", "കോളം", "ലേഖനം", "Politics", "രാഷ്ട്രീയം"]);
  const viewsStories = getArticlesForCategory(
    ["views", "opinion", "column", "lekhanam", "politics", "Judiciary", "Election commission News", ...viewsSlugs],
    ["Views", "അഭിപ്രായം", "വീക്ഷണം", "കോളം", "ലേഖനം", "രാഷ്ട്രീയം", "Politics", "Judiciary"]
  );
  const { lead: viewsLead, side: viewsSide } = fillSplitSection(viewsStories, articles.slice(5));

  const _displayMediaRaw = articles.filter((a) => (a.media === "photo" || a.media === "video") && a.image).slice(0, 4);
  const displayMedia = _displayMediaRaw.length > 0 ? _displayMediaRaw : extraMedia.length > 0 ? extraMedia : articles.filter((a) => a.image).slice(0, 4);
  const latestUpdates = articles.slice(0, 6);

  const handledSlugs = new Set([
    ...keralaSlugs, ...indiaSlugs, ...worldSlugs, ...gulfSlugs, ...viewsSlugs,
    "views", "opinion", "column", "lekhanam", "politics", "Judiciary", "Election commission News",
    ...categoryGroups.filter(g => g.label?.toLowerCase() === "news" || g.slug?.toLowerCase() === "news").map(g => g.slug),
    ...categoryGroups.filter(g => g.label?.toLowerCase() === "keralam" || g.slug?.toLowerCase() === "keralam").map(g => g.slug)
  ]);

  const dynamicCategorySections = categoryGroups
    .filter(group => !handledSlugs.has(group.slug))
    .map((group) => {
      const childSlugs = (group.children || []).map(c => c.slug);
      const childLabels = (group.children || []).map(c => c.label);
      const allSlugs = [group.slug, ...childSlugs];
      const allLabels = [group.label, group.titleMl, ...childLabels].filter(Boolean);

      const sectionArticles = getArticlesForCategory(allSlugs, allLabels);
      if (sectionArticles.length === 0) return null;

      const { lead, side } = fillSplitSection(sectionArticles, articles, 4);
      return {
        title: SECTION_LABELS[group.slug] || group.titleMl || group.label,
        slug: group.slug,
        articles: sectionArticles,
        lead,
        side,
      };
    })
    .filter(Boolean);

    return (
    <div className="home-page">
      <div className="news-ticker">
        <span className="news-ticker-label">{t("home.breakingNews")}</span>
        <div className="news-ticker-text">
          <div className="news-ticker-content">
            {[...tickerStories, ...tickerStories].map((story, i) => (
              <span key={`${story.id}-${i}`} className={`clickable ${story.breaking ? "breaking-alert" : ""}`} onClick={() => navigate("/news/" + getTitleSlug(story))}>
                {story.breaking ? "\u{1F6A8}" : "\u{1F4E2}"} {story.title} \u2022
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="container">
        <AdSlot slot="top-leaderboard" label={t("home.adTopLeaderboard")} slider />
      </div>

      <NewsCarousel articles={articles} navigate={navigate} latestUpdates={latestUpdates} />

      <section className="container latest-strip" aria-label={t("home.latestUpdates")} data-aos="fade-up" style={{ display: "none" }}>
        <div className="latest-strip-title">
          <strong>{t("home.latestUpdates")}</strong>
        </div>
        <div className="latest-strip-list">
          {latestUpdates.map((article) => (
            <button key={article.id} type="button" onClick={() => navigate("/news/" + getTitleSlug(article))}>
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
              <article key={story.id} className="editorial-story clickable" onClick={() => navigate("/news/" + getTitleSlug(story))}>
                <small>{getCategoryName(story) || t("home.defaultCategory")}</small>
                <h4>{story.title}</h4>
                <p>{story.excerpt}</p>
              </article>
            ))}
          </aside>

          <div className="lead-col" data-aos="fade-up" data-aos-delay="100">
            <article className="newspaper-lead-card clickable" onClick={() => navigate("/news/" + getTitleSlug(leadStory))}>
              <ArticleImage article={leadStory} alt={leadStory.title} />
              <div className="lead-copy">
                <span className="lead-category">{getCategoryName(leadStory)}</span>
                <h2>{leadStory.title}</h2>
                <p>{leadStory.excerpt}</p>
                <button className="read-more-btn" type="button" data-aos="zoom-in" data-aos-delay="150">{t("home.readMore")}</button>
              </div>
            </article>
            <div className="lead-mini-grid">
              {(() => {
                const usedIds = new Set([leadStory?.id, ...leftColumnStories.map(s => s.id), ...rightColumnStories.map(s => s.id)]);
                const miniNews = articles.filter(a => !usedIds.has(a.id)).slice(0, 4);
                return miniNews.map((article) => (
                  <div key={article.id} className="lead-mini-card clickable" onClick={() => navigate("/news/" + getTitleSlug(article))}>
                    {article.image && <ArticleImage article={article} alt={article.title} />}
                    <h5>{article.title}</h5>
                  </div>
                ));
              })()}
            </div>
          </div>

          <aside className="briefs-col" data-aos="fade-up" data-aos-delay="200">
            <h3 className="column-title">{t("home.mainNews")}</h3>
            {rightColumnStories.map((story) => (
              <div key={story.id} className="brief-story-card clickable" onClick={() => navigate("/news/" + getTitleSlug(story))}>
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
        <AdSlot slot="mid-leaderboard" label={t("home.adMidLeaderboard")} />
      </div>

      <PageLayout navigate={navigate} className="home-below-fold">
        <section className="section-block" data-aos="fade-up">
          <div className="section-block-title" data-aos="fade-left">
            <span>{t("home.section.kerala")}</span>
            <button className="view-all-btn" onClick={() => navigate("/category/" + encodeURIComponent(keralaSlugs[0] || keralaSide[0]?.category || "Keralam"))}>{t("home.viewAll")}</button>
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

        {nationalLead && (
          <section className="section-block" data-aos="fade-up">
            <div className="section-block-title" data-aos="fade-left">
              <span>{t("home.section.national")}</span>
              <button className="view-all-btn" onClick={() => navigate("/category/" + encodeURIComponent(indiaSlugs[0] || nationalLead?.category || "India"))}>{t("home.viewAll")}</button>
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

        {internationalLead && (
          <section className="section-block" data-aos="fade-up">
            <div className="section-block-title" data-aos="fade-left">
              <span>{t("home.section.international")}</span>
              <button className="view-all-btn" onClick={() => navigate("/category/" + encodeURIComponent(worldSlugs[0] || internationalLead?.category || "World"))}>{t("home.viewAll")}</button>
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

        {gulfTop.length > 0 && (
          <section className="section-block" data-aos="fade-up">
            <div className="section-block-title" data-aos="fade-left">
              <span>{t("home.section.gulf")}</span>
              <button className="view-all-btn" onClick={() => navigate("/category/" + encodeURIComponent(gulfGroup?.slug || gulfSlugs[0] || "new-group-1785595457520"))}>{t("home.viewAll")}</button>
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

        {viewsLead && (
          <section className="section-block" data-aos="fade-up">
            <div className="section-block-title" data-aos="fade-left">
              <span>{t("home.section.views")}</span>
              <button className="view-all-btn" onClick={() => {
                const viewsGroupSlug = categoryGroups.find(g => g.label?.toLowerCase() === "views" || g.slug?.toLowerCase() === "views" || g.titleMl === "കാഴ്ചപ്പാട്")?.slug;
                const fallbackSlug = viewsSlugs[0] || viewsLead?.category || viewsGroupSlug || "Views";
                navigate("/category/" + encodeURIComponent(fallbackSlug));
              }}>{t("home.viewAll")}</button>
            </div>
            <div className="news-split-layout reversed">
              <div className="news-split-main">
                <ArticleCard article={viewsLead} navigate={navigate} variant="feature-card" dataAosDelay={0} />
              </div>
              <div className="news-split-side">
                {viewsSide.map((article, i) => (
                  <ArticleCard key={article.id} article={article} navigate={navigate} variant="compact" dataAosDelay={100 + i * 50} />
                ))}
              </div>
            </div>
          </section>
        )}

        {dynamicCategorySections.map((section, i) => (
          <section className="section-block" key={section.slug} data-aos="fade-up" data-aos-delay={i * 50}>
            <div className="section-block-title" data-aos="fade-left">
              <span>{section.title}</span>
              <button className="view-all-btn" onClick={() => navigate("/category/" + encodeURIComponent(section.slug))}>{t("home.viewAll")}</button>
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
            <span>{t("home.section.multimedia")}</span>
            <button className="view-all-btn" onClick={() => {
              const mmGroup = categoryGroups.find(g => g.label?.toLowerCase().includes("multimedia") || g.slug?.toLowerCase().includes("multimedia") || g.titleMl?.includes("മൾട്ടി"));
              navigate("/category/" + encodeURIComponent(mmGroup?.slug || "new-group-1785656306753"));
            }}>{t("home.viewAll")}</button>
          </div>
          {displayMedia.length > 0 && (
            <div className="multimedia-grid">
              {displayMedia.map((article, i) => (
                <div key={article.id} className="multimedia-card clickable" data-aos="zoom-in" data-aos-delay={i * 100} onClick={() => navigate("/news/" + getTitleSlug(article))}>
                  <div className="media-thumbnail">
                    <ArticleImage article={article} alt={article.title} />
                    <span className="media-badge">{article.media === "video" ? t("home.badgeVideo") : t("home.badgePhoto")}</span>
                  </div>
                  <h4>{article.title}</h4>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <VideoSection articles={articles} navigate={navigate} />

      <PhotoGallery articles={articles} navigate={navigate} />

      <section className="container section-block" style={{ borderBottom: "none" }} data-aos="fade-up">
        <div className="section-block-title" data-aos="fade-left">
          <span>{t("home.moreNews")}</span>
        </div>
        <div className="list-feed">
          {articles.slice(0, 12).map((article, i) => (
            <ArticleCard key={article.id} article={article} navigate={navigate} variant="compact" dataAosDelay={i * 50} />
          ))}
        </div>
      </section>

      <div className="container">
        <div className="home-before-footer-ads">
          <AdSlot slot="home-footer-ad-1" label={t("home.adFooter1")} />
          <AdSlot slot="home-footer-ad-2" label={t("home.adFooter2")} />
          <AdSlot slot="home-footer-ad-3" label={t("home.adFooter3")} />
        </div>
      </div>

      <div className="container home-bottom-ad">
        <AdSlot slot="bottom-leaderboard" label={t("home.adBottomLeaderboard")} />
      </div>
    </div>
  );
}
