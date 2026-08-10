import { useState, useEffect } from "react";
import { fetchNews, fetchCategories } from "../services/api.js";
import { articles as fallback, flatMenuItems } from "../data/news.js";
import AdSlot from "../components/AdSlot.jsx";
import ArticleCard from "../components/ArticleCard.jsx";
import PageLayout from "../components/PageLayout.jsx";

function flattenApiCategories(categories) {
  const flat = [];
  for (const cat of categories) {
    if (cat.children) {
      for (const child of cat.children) {
        flat.push(child);
      }
    }
    flat.push(cat);
  }
  return flat;
}

export default function CategoryPage({ categoryItem, navigate }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [displayName, setDisplayName] = useState(categoryItem.titleMl || categoryItem.label || "");
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
    setLoading(true);
    const label = categoryItem.label || "";
    const titleMl = categoryItem.titleMl || "";
    const slug = categoryItem.slug || "";

    fetchCategories().then(apiCats => {
      const allSlugs = new Set();
      const allLabels = new Set();
      const allTitleMls = new Set();

      if (label) allLabels.add(label.toLowerCase());
      if (titleMl) allTitleMls.add(titleMl.toLowerCase());
      if (slug) allSlugs.add(slug);

      let foundTitleMl = titleMl;
      let foundLabel = label;

      for (const group of apiCats) {
        const groupLabel = (group.label || "").toLowerCase();
        const groupTitleMl = (group.titleMl || "").toLowerCase();
        const isMatch = groupLabel === label.toLowerCase() || groupTitleMl === titleMl.toLowerCase() || group.slug === slug;

        if (isMatch) {
          allSlugs.add(group.slug);
          if (group.titleMl) foundTitleMl = group.titleMl;
          if (group.label) foundLabel = group.label;
          for (const child of (group.children || [])) {
            allSlugs.add(child.slug);
            allLabels.add((child.label || "").toLowerCase());
            allTitleMls.add((child.titleMl || "").toLowerCase());
          }
        }

        for (const child of (group.children || [])) {
          if ((child.label || "").toLowerCase() === label.toLowerCase() || (child.titleMl || "").toLowerCase() === titleMl.toLowerCase() || child.slug === slug) {
            allSlugs.add(child.slug);
            allSlugs.add(group.slug);
            allLabels.add((child.label || "").toLowerCase());
            allTitleMls.add((child.titleMl || "").toLowerCase());
            if (group.titleMl) foundTitleMl = group.titleMl;
            if (group.label) foundLabel = group.label;
          }
        }
      }

      setDisplayName(foundTitleMl || foundLabel || slug);

      fetchNews({ limit: 500 }).then(data => {
        const fetched = data.news || [];
        const filtered = fetched.filter(a => {
          if (allSlugs.has(a.category)) return true;
          if (a.categories && a.categories.some(c => allSlugs.has(c))) return true;
          if (a.categoryMl && allTitleMls.has(a.categoryMl.toLowerCase())) return true;
          if (a.category && allLabels.has(a.category.toLowerCase())) return true;
          if (a.categoryMl && allLabels.has(a.categoryMl.toLowerCase())) return true;
          return false;
        });

        if (filtered.length > 0) {
          setArticles(filtered);
        } else {
          const localFiltered = fallback.filter(a => {
            const cat = (a.category || "").toLowerCase();
            if (allLabels.has(cat)) return true;
            if (a.categoryMl && allTitleMls.has(a.categoryMl.toLowerCase())) return true;
            return false;
          });
          setArticles(localFiltered.length > 0 ? localFiltered : fallback);
        }
        setLoading(false);
      }).catch(() => {
        const localFiltered = fallback.filter(a => {
          const cat = (a.category || "").toLowerCase();
          if (allLabels.has(cat)) return true;
          if (a.categoryMl && allTitleMls.has(a.categoryMl.toLowerCase())) return true;
          return false;
        });
        setArticles(localFiltered.length > 0 ? localFiltered : fallback);
        setLoading(false);
      });
    }).catch(() => {
      fetchNews({ limit: 500 }).then(data => {
        const fetched = data.news || [];
        const filtered = fetched.filter(a => {
          if (slug && a.category === slug) return true;
          if (label && a.category === label) return true;
          if (titleMl && a.categoryMl === titleMl) return true;
          return false;
        });
        setArticles(filtered.length > 0 ? filtered : fallback);
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      });
    });
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
