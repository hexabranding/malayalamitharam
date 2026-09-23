import { useState, useEffect } from "react";
import { fetchNews, loadMenuGroups } from "../services/api.js";
import { articles as fallback } from "../data/news.js";
import AdSlot from "../components/AdSlot.jsx";
import ArticleCard from "../components/ArticleCard.jsx";
import PageLayout from "../components/PageLayout.jsx";

export default function CategoryPage({ categoryItem, navigate }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [displayName, setDisplayName] = useState("");
  const itemsPerPage = 10;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setCurrentPage(1);
      setLoading(true);
      const label = (categoryItem.label || "").trim();
      const titleMl = (categoryItem.titleMl || "").trim();
      const slug = (categoryItem.slug || "").trim();

      try {
        const apiCats = await loadMenuGroups();

        const allSlugs = new Set();
        const allLabels = new Set();
        const allTitleMls = new Set();

        if (label) allLabels.add(label.toLowerCase());
        if (titleMl) allTitleMls.add(titleMl.toLowerCase());
        if (slug) allSlugs.add(slug);

        let foundTitleMl = "";
        let foundLabel = "";
        let foundChildLabel = "";
        let foundChildTitleMl = "";

        for (const group of apiCats) {
          const groupLabel = (group.label || "").toLowerCase().trim();
          const groupTitleMl = (group.titleMl || "").toLowerCase().trim();
          const isGroupMatch =
            groupLabel === label.toLowerCase().trim() ||
            groupTitleMl === titleMl.toLowerCase().trim() ||
            group.slug === slug;

          if (isGroupMatch) {
            allSlugs.add(group.slug);
            if (group.titleMl) foundTitleMl = group.titleMl;
            if (group.label) foundLabel = group.label;
            for (const child of group.children || []) {
              allSlugs.add(child.slug);
              if (child.label) allLabels.add(child.label.toLowerCase().trim());
              if (child.titleMl) allTitleMls.add(child.titleMl.toLowerCase().trim());
            }
          }

          for (const child of group.children || []) {
            const childLabelLower = (child.label || "").toLowerCase().trim();
            const childTitleMlLower = (child.titleMl || "").toLowerCase().trim();
            if (
              childLabelLower === label.toLowerCase().trim() ||
              childTitleMlLower === titleMl.toLowerCase().trim() ||
              child.slug === slug
            ) {
              allSlugs.add(child.slug);
              allSlugs.add(group.slug);
              if (child.label) allLabels.add(childLabelLower);
              if (child.titleMl) allTitleMls.add(childTitleMlLower);
              if (child.titleMl) foundChildTitleMl = child.titleMl;
              if (child.label) foundChildLabel = child.label;
            }
          }
        }

        const display = foundChildTitleMl || foundChildLabel || foundTitleMl || foundLabel || titleMl || label || slug;
        if (!cancelled) setDisplayName(display);

        // Build backend category param: join all collected slugs + labels/titleMls for maximum compatibility
        // Backend now supports comma-separated `category` where each value is matched against category, categories, categoryMl
        const slugsArray = Array.from(allSlugs).filter(Boolean);
        const paramValues = slugsArray.length > 0 ? slugsArray : (slug ? [slug] : []);
        // Also include Malayalam variants to catch categoryMl-stored articles when slug list alone misses them
        // Keep unique and preserve slugs first
        const extraValues = [];
        for (const v of allTitleMls) if (v && !paramValues.includes(v)) extraValues.push(v);
        for (const v of allLabels) if (v && !paramValues.includes(v)) extraValues.push(v);
        // For leaf categories, paramValues already contains slug; adding Malayalam helps if article stored with categoryMl only
        const backendCategory = [...paramValues, ...extraValues].filter(Boolean).join(",");

        const fetchParams = { limit: 100 };
        if (backendCategory) fetchParams.category = backendCategory;

        try {
          const data = await fetchNews(fetchParams);
          const fetched = data.news || [];
          if (cancelled) return;
          if (fetched.length > 0) {
            setArticles(fetched);
            setLoading(false);
            return;
          }
          // Backend returned 0 – try broader fetch and client-side filter as fallback
          // This handles stale cache / parent expansion edge cases where backendCategory still missed due to casing
          const fallbackData = await fetchNews({ limit: 100 });
          const allFetched = fallbackData.news || [];
          const filtered = allFetched.filter((a) => {
            if (allSlugs.has(a.category)) return true;
            if (a.categories && a.categories.some((c) => allSlugs.has(c))) return true;
            const catMlLower = (a.categoryMl || "").toLowerCase().trim();
            const catLower = (a.category || "").toLowerCase().trim();
            if (catMlLower && allTitleMls.has(catMlLower)) return true;
            if (catLower && allLabels.has(catLower)) return true;
            if (catMlLower && allLabels.has(catMlLower)) return true;
            return false;
          });

          if (filtered.length > 0) {
            setArticles(filtered);
            setLoading(false);
            return;
          }

          // Final fallback to static data – only matching category, not full list
          const localFiltered = fallback.filter((a) => {
            const cat = (a.category || "").toLowerCase().trim();
            const catMl = (a.categoryMl || "").toLowerCase().trim();
            if (slugsArray.some((s) => s.toLowerCase() === cat)) return true;
            if (allLabels.has(cat)) return true;
            if (catMl && (allTitleMls.has(catMl) || allLabels.has(catMl))) return true;
            if (label && cat === label.toLowerCase().trim()) return true;
            if (titleMl && catMl === titleMl.toLowerCase().trim()) return true;
            return false;
          });

          // Show localFiltered if found, otherwise empty (show "no news" message instead of unrelated fallback)
          setArticles(localFiltered);
          setLoading(false);
        } catch {
          if (cancelled) return;
          const localFiltered = fallback.filter((a) => {
            const cat = (a.category || "").toLowerCase().trim();
            const catMl = (a.categoryMl || "").toLowerCase().trim();
            if (slug && cat === slug.toLowerCase()) return true;
            if (label && cat === label.toLowerCase().trim()) return true;
            if (titleMl && catMl === titleMl.toLowerCase().trim()) return true;
            return false;
          });
          setArticles(localFiltered);
          setLoading(false);
        }
      } catch {
        if (cancelled) return;
        // loadMenuGroups failed – try direct backend fetch by slug
        try {
          const params = slug ? { category: slug, limit: 100 } : { limit: 100 };
          const data = await fetchNews(params);
          const fetched = data.news || [];
          if (fetched.length > 0) {
            setArticles(fetched);
          } else {
            const localFiltered = fallback.filter((a) => {
              const cat = (a.category || "").toLowerCase().trim();
              if (slug && cat === slug.toLowerCase()) return true;
              if (label && cat === label.toLowerCase().trim()) return true;
              return false;
            });
            setArticles(localFiltered);
          }
        } catch {
          setArticles([]);
        }
        setDisplayName(label || titleMl || slug);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [categoryItem.label, categoryItem.titleMl, categoryItem.slug]);

  function parseDate(article) {
    if (article.createdAt) {
      const t = new Date(article.createdAt).getTime();
      if (!isNaN(t)) return t;
    }
    if (article.date) {
      const t = new Date(article.date).getTime();
      if (!isNaN(t)) return t;
    }
    return 0;
  }

  const sortedVisible = [...articles].sort((a, b) => parseDate(b) - parseDate(a));

  const totalPages = Math.ceil(sortedVisible.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentArticles = sortedVisible.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <PageLayout navigate={navigate}>
      <div className="page-title" data-aos="fade-up">
        <span>വിഭാഗം</span>
        <h1>{displayName}</h1>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#666" }}>
          <p>Loading...</p>
        </div>
      ) : (
        <>
          <div className="list-feed">
            {currentArticles.map((article, i) => (
              <ArticleCard
                key={article.id}
                article={article}
                navigate={navigate}
                variant="horizontal"
                dataAosDelay={i * 50}
              />
            ))}
          </div>

          {currentArticles.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#666" }}>
              <p>ഈ വിഭാഗത്തിൽ ഇപ്പോൾ വാർത്തകൾ ഇല്ല</p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="pagination" data-aos="zoom-in">
              <button className="pagination-btn" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>Previous</button>
              {[...Array(totalPages)].map((_, i) => (
                <button key={i + 1} className={`pagination-btn ${currentPage === i + 1 ? "active" : ""}`} onClick={() => handlePageChange(i + 1)}>{i + 1}</button>
              ))}
              <button className="pagination-btn" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>Next</button>
            </div>
          )}

          <div className="category-info">
            <p>Showing {sortedVisible.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, sortedVisible.length)} of {sortedVisible.length} articles</p>
          </div>
        </>
      )}

      <AdSlot slot="category" label="Category Leaderboard Ad" />
    </PageLayout>
  );
}
