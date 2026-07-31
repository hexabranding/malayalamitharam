import { useState, useEffect } from "react";
import { fetchNews } from "../services/api.js";
import { articles as fallback } from "../data/news.js";
import AdSlot from "../components/AdSlot.jsx";
import ArticleCard from "../components/ArticleCard.jsx";
import PageLayout from "../components/PageLayout.jsx";
import EmptyState from "../components/EmptyState.jsx";

export default function MediaPage({ type, title, navigate }) {
  const [articles, setArticles] = useState(fallback);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    setCurrentPage(1);
    fetchNews({ limit: 50 }).then(data => {
      const fetched = data.news || [];
      if (fetched.length > 0) setArticles(fetched);
    }).catch(() => {});
  }, [type]);

  const list = articles.filter((article) => article.media === type);
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
        <span>മൾട്ടിമീഡിയ</span>
        <h1>{title}</h1>
      </div>
      {list.length > 0 ? (
        <>
          <div className="card-grid">
            {currentArticles.map((article, i) => (
              <ArticleCard key={article.id} article={article} navigate={navigate} dataAosDelay={i * 50} />
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
            <p>Showing {startIndex + 1}-{Math.min(endIndex, list.length)} of {list.length} {type}s</p>
          </div>
          <AdSlot slot="media" label="Media Ad" />
        </>
      ) : (
        <EmptyState
          title="No media posts yet"
          message="Add a news item from admin, choose Photo or Video, and upload an image. It will appear here and on the home page."
          navigate={navigate}
        />
      )}
    </PageLayout>
  );
}
