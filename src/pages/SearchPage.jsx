import { useState, useEffect } from "react";
import { fetchNews } from "../services/api.js";
import { articles as fallback } from "../data/news.js";
import AdSlot from "../components/AdSlot.jsx";
import ArticleCard from "../components/ArticleCard.jsx";
import PageLayout from "../components/PageLayout.jsx";
import EmptyState from "../components/EmptyState.jsx";

export default function SearchPage({ path, navigate }) {
  const params = new URLSearchParams(path.split("?")[1] || "");
  const query = params.get("q") || "";
  const normalized = query.trim();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const fallbackResults = () => {
    if (!normalized) return fallback;
    const lowerQuery = normalized.toLowerCase();
    return fallback.filter((article) => {
      const searchable = [
        article.title,
        article.titleEn,
        article.excerpt,
        article.category,
        article.categoryMl,
        article.author,
        ...(article.tags || []),
      ].filter(Boolean).join(" ").toLowerCase();
      return searchable.includes(lowerQuery);
    });
  };

  const [results, setResults] = useState(fallbackResults);

  useEffect(() => {
    setCurrentPage(1);
    fetchNews({ search: normalized || undefined, limit: 50 }).then(data => {
      const fetched = data.news || [];
      const localMatches = fallbackResults();
      setResults(fetched.length > 0 || localMatches.length === 0 ? fetched : localMatches);
    }).catch(() => {
      setResults(fallbackResults());
    });
  }, [normalized]);

  const totalPages = Math.ceil(results.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentArticles = results.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <PageLayout navigate={navigate}>
      <div className="page-title" data-aos="fade-up">
        <span>തിരച്ചിൽ</span>
        <h1>{normalized ? "\"" + normalized + "\"" : "എല്ലാ വാർത്തകളും"}</h1>
      </div>
      {results.length > 0 ? (
        <>
          <div className="list-feed">
            {currentArticles.map((article, i) => (
              <ArticleCard key={article.id} article={article} navigate={navigate} variant="horizontal" dataAosDelay={i * 50} />
            ))}
          </div>
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
            <p>Showing {startIndex + 1}-{Math.min(endIndex, results.length)} of {results.length} results</p>
          </div>
          <AdSlot slot="search-bottom" label="Search Bottom Ad" />
        </>
      ) : (
        <EmptyState
          title="No news found"
          message="Try another word, or open a main category from below. New admin posts will appear here automatically."
          navigate={navigate}
          query={normalized}
        />
      )}
    </PageLayout>
  );
}
