import { useState, useEffect } from "react";
import { fetchNews, fetchCategories } from "../services/api.js";
import { articles as fallback } from "../data/news.js";
import AdSlot from "../components/AdSlot.jsx";
import ArticleCard from "../components/ArticleCard.jsx";
import PageLayout from "../components/PageLayout.jsx";

const MALAYALAM_MAP = {
  "kerala": ["കേരളം", "Kerala"],
  "india": ["ഇന്ത്യ", "India", "ദേശിയം"],
  "world": ["ലോകം", "World", "അന്തർദേശിയം"],
  "gulf": ["ഗൾഫ്", "Gulf"],
  "cinema": ["സിനിമ", "Cinema"],
  "tech": ["ടെക്", "Tech"],
  "sports": ["കായികം", "Sports"],
  "football": ["ഫുട്ബോൾ", "Football"],
  "cricket": ["ക്രിക്കറ്റ്", "Cricket"],
  "health": ["ആരോഗ്യം", "Health"],
  "travel": ["യാത്ര", "Travel"],
  "food": ["ഭക്ഷണം", "Food"],
  "politics": ["രാഷ്ട്രീയം", "Politics"],
  "opinion": ["അഭിപ്രായം", "Opinion"],
  "education": ["വിദ്യാഭ്യാസം", "Education"],
  "business": ["ബിസിനസ്", "Business"],
};

export default function CategoryPage({ categoryItem, navigate }) {
  const [articles, setArticles] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchCategories().then(data => {
      if (Array.isArray(data)) setAllCategories(data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    const slug = categoryItem.slug;

    fetchNews({ category: slug, limit: 200 }).then(data => {
      const fetched = data.news || [];
      if (fetched.length > 0) {
        setArticles(fetched);
      } else {
        const local = fallback.filter(a =>
          a.category === slug ||
          (a.categories && a.categories.includes(slug))
        );
        setArticles(local);
      }
    }).catch(() => {
      setArticles(fallback.filter(a =>
        a.category === slug ||
        (a.categories && a.categories.includes(slug))
      ));
    });

    const group = allCategories.find(g => g.slug === slug);
    if (group && group.children && group.children.length > 0) {
      group.children.forEach(child => {
        fetchNews({ category: child.slug, limit: 100 }).then(data => {
          const extra = data.news || [];
          if (extra.length > 0) {
            setArticles(prev => {
              const ids = new Set(prev.map(a => a.id));
              const newArticles = extra.filter(a => !ids.has(a.id));
              return [...prev, ...newArticles];
            });
          }
        }).catch(() => {});
      });
    }
  }, [categoryItem.slug, allCategories]);

  const slugLower = categoryItem.slug?.toLowerCase() || "";
  const labelLower = categoryItem.label?.toLowerCase() || "";
  const titleMl = categoryItem.titleMl || "";
  const malayalamLabels = MALAYALAM_MAP[slugLower] || [];

  const list = articles.filter((article) => {
    const cat = article.category?.toLowerCase() || "";
    if (cat === slugLower || cat === labelLower) return true;
    if (article.categories && article.categories.some(c => c.toLowerCase() === slugLower)) return true;
    if (titleMl && article.categoryMl === titleMl) return true;
    if (malayalamLabels.length > 0) {
      if (malayalamLabels.some(l => article.categoryMl === l)) return true;
      if (malayalamLabels.some(l => article.category?.toLowerCase() === l.toLowerCase())) return true;
    }
    return false;
  });

  const visible = list.length > 0 ? list : articles;

  const sortedVisible = [...visible].sort((a, b) => {
    const dateA = new Date(a.date || a.createdAt || 0);
    const dateB = new Date(b.date || b.createdAt || 0);
    return dateB - dateA;
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedVisible.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentArticles = sortedVisible.slice(startIndex, endIndex);

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
        <p>Showing {startIndex + 1}-{Math.min(endIndex, sortedVisible.length)} of {sortedVisible.length} articles</p>
      </div>

      <AdSlot slot="category" label="Category Leaderboard Ad" />
    </PageLayout>
  );
}
