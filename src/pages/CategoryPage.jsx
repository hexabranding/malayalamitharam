import { useState, useEffect } from "react";
import { fetchNews } from "../services/api.js";
import { articles as fallback, flatMenuItems } from "../data/news.js";
import AdSlot from "../components/AdSlot.jsx";
import ArticleCard from "../components/ArticleCard.jsx";
import PageLayout from "../components/PageLayout.jsx";

function getChildSlugs(slug) {
  const group = flatMenuItems.find(g => g.slug === slug);
  if (group && group.children) {
    return group.children.map(c => c.slug);
  }
  return [];
}

function matchArticle(article, slug, childSlugs, titleMl) {
  const cat = (article.category || "").toLowerCase();
  const allSlugs = [slug, ...childSlugs];
  if (allSlugs.some(s => s.toLowerCase() === cat)) return true;
  if (article.categories && article.categories.some(c => allSlugs.includes(c.toLowerCase()))) return true;
  if (titleMl && article.categoryMl === titleMl) return true;
  return false;
}

export default function CategoryPage({ categoryItem, navigate }) {
  const [articles, setArticles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
    const slug = categoryItem.slug;
    const childSlugs = getChildSlugs(slug);
    const titleMl = categoryItem.titleMl || "";

    const localArticles = fallback.filter(a => matchArticle(a, slug, childSlugs, titleMl));
    setArticles(localArticles);

    fetchNews({ category: slug, limit: 200 }).then(data => {
      const fetched = data.news || [];
      if (fetched.length > 0) {
        setArticles(prev => {
          const ids = new Set(prev.map(a => a.id));
          return [...prev, ...fetched.filter(a => !ids.has(a.id))];
        });
      }
    }).catch(() => {});

    childSlugs.forEach(childSlug => {
      fetchNews({ category: childSlug, limit: 100 }).then(data => {
        const extra = data.news || [];
        if (extra.length > 0) {
          setArticles(prev => {
            const ids = new Set(prev.map(a => a.id));
            return [...prev, ...extra.filter(a => !ids.has(a.id))];
          });
        }
      }).catch(() => {});
    });
  }, [categoryItem.slug]);

  function parseDate(article) {
    if (article.createdAt) return new Date(article.createdAt).getTime() || 0;
    if (article.updatedAt) return new Date(article.updatedAt).getTime() || 0;
    if (article.date) {
      const parsed = new Date(article.date);
      if (!isNaN(parsed.getTime())) return parsed.getTime();
    }
    if (article.id && typeof article.id === "string" && /^\d+$/.test(article.id)) {
      return parseInt(article.id, 10);
    }
    return 0;
  }

  const sortedVisible = [...articles].sort((a, b) => {
    const dateA = parseDate(a);
    const dateB = parseDate(b);
    if (dateA !== dateB) return dateB - dateA;
    return articles.indexOf(b) - articles.indexOf(a);
  });

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
        <h1>{categoryItem.titleMl || categoryItem.label}</h1>
      </div>

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
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>

          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i + 1}
              className={`pagination-btn ${currentPage === i + 1 ? "active" : ""}`}
              onClick={() => handlePageChange(i + 1)}
            >
              {i + 1}
            </button>
          ))}

          <button
            className="pagination-btn"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}

      <div className="category-info">
        <p>Showing {sortedVisible.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, sortedVisible.length)} of {sortedVisible.length} articles</p>
      </div>

      <AdSlot slot="category" label="Category Leaderboard Ad" />
    </PageLayout>
  );
}
