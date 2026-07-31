import { useState, useEffect } from "react";
import { fetchNews } from "../services/api.js";
import { articles as fallback } from "../data/news.js";
import AdSlot from "../components/AdSlot.jsx";
import ArticleCard from "../components/ArticleCard.jsx";
import PageLayout from "../components/PageLayout.jsx";
import EmptyState from "../components/EmptyState.jsx";

export default function TagsPage({ tag, navigate }) {
  const [list, setList] = useState(() => fallback.filter(a => (a.tags || []).includes(tag)));
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    setCurrentPage(1);
    fetchNews({ search: tag, limit: 50 }).then(data => {
      const tagged = (data.news || []).filter(a => (a.tags || []).includes(tag));
      if (tagged.length > 0) setList(tagged);
    }).catch(() => {});
  }, [tag]);

  const totalPages = Math.ceil(list.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentArticles = list.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <PageLayout navigate={navigate}>
      <div className="page-title" data-aos="fade-up">
        <span>ടാഗ്</span>
        <h1>{tag}</h1>
      </div>
      <AdSlot slot="tags" label="Tag Page Ad" />
      {list.length > 0 ? (
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
            <p>Showing {startIndex + 1}-{Math.min(endIndex, list.length)} of {list.length} articles</p>
          </div>
        </>
      ) : (
        <EmptyState
          title="No tagged news yet"
          message="When you add this tag from admin, stories will show here. For now, browse the latest sections."
          navigate={navigate}
          query={tag}
        />
      )}
    </PageLayout>
  );
}
