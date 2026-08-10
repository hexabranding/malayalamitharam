import { useState, useEffect } from "react";
import { fetchNews } from "../services/api.js";
import { articles as fallback } from "../data/news.js";
import AdSlot from "../components/AdSlot.jsx";
import ArticleCard from "../components/ArticleCard.jsx";
import PageLayout from "../components/PageLayout.jsx";

export default function CategoryPage({ categoryItem, navigate }) {
  const [articles, setArticles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
    fetchNews({ category: categoryItem.slug, limit: 200 }).then(data => {
      const fetched = data.news || [];
      if (fetched.length > 0) {
        setArticles(fetched);
      } else {
        setArticles(fallback.filter(a =>
          a.category === categoryItem.slug ||
          (a.categories && a.categories.includes(categoryItem.slug))
        ));
      }
    }).catch(() => {
      setArticles(fallback.filter(a =>
        a.category === categoryItem.slug ||
        (a.categories && a.categories.includes(categoryItem.slug))
      ));
    });
  }, [categoryItem.slug]);

  const slugLower = categoryItem.slug?.toLowerCase() || "";
  const labelLower = categoryItem.label?.toLowerCase() || "";
  const titleMl = categoryItem.titleMl || "";

  const list = articles.filter((article) => {
    const cat = article.category?.toLowerCase() || "";
    if (cat === slugLower || cat === labelLower) return true;
    if (article.categories && article.categories.some(c => c.toLowerCase() === slugLower)) return true;
    if (article.categoryMl && titleMl && article.categoryMl === titleMl) return true;
    if (article.categoryMl && ["കേരളം", "ഇന്ത്യ", "ലോകം", "ഗൾഫ്", "സിനിമ", "ടെക്", "കായികം"].includes(article.categoryMl)) {
      const labelMap = { "കേരളം": "kerala", "ഇന്ത്യ": "india", "ലോകം": "world", "ഗൾഫ്": "gulf", "സിനിമ": "cinema", "ടെക്": "tech", "കായികം": "sports" };
      if (labelMap[article.categoryMl] === slugLower) return true;
    }
    return false;
  });

  const visible = list.length > 0 ? list : articles;

  // Pagination logic
  const totalPages = Math.ceil(visible.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentArticles = visible.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        <p>Showing {startIndex + 1}-{Math.min(endIndex, visible.length)} of {visible.length} articles</p>
      </div>

      <AdSlot slot="category" label="Category Leaderboard Ad" />
    </PageLayout>
  );
}
