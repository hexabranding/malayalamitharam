import { useState, useEffect } from "react";
import { Edit2, Trash2, Eye, Search, Filter, Plus } from "lucide-react";
import { fetchNews, deleteArticle } from "../services/api.js";
import { articles as fallback } from "../data/news.js";
import { ArticleImage } from "../services/images.jsx";

export default function AdminNewsPage({ navigate }) {
  const [newsList, setNewsList] = useState(fallback);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  useEffect(() => {
    fetchNews({ limit: 200 }).then(data => {
      const fetched = data.news || [];
      if (fetched.length > 0) setNewsList(fetched);
    }).catch(() => {});
  }, []);

  const categories = ["all", ...new Set(newsList.map(a => a.category))];

  const filteredNews = newsList.filter(news => {
    const matchesSearch = news.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         news.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || news.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Pagination
  const totalPages = Math.ceil(filteredNews.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentNews = filteredNews.slice(startIndex, endIndex);

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this news?")) {
      try {
        await deleteArticle(id);
        setNewsList(newsList.filter(news => news.id !== id));
      } catch (err) {
        alert("Failed to delete: " + err.message);
      }
    }
  };

  const handleEdit = (id) => {
    navigate(`/admin/news/edit/${id}`);
  };

  const handleView = (id) => {
    navigate(`/post/${id}`);
  };

  const handleAddNew = () => {
    navigate("/admin/news/new");
  };

  return (
    <div className="admin-news-page">
      <div className="admin-toolbar">
        <div className="admin-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search news..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="admin-filters">
          <Filter size={18} />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === "all" ? "All Categories" : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <button className="admin-btn primary" onClick={handleAddNew}>
          <Plus size={18} />
          Add News
        </button>
      </div>

      <div className="admin-news-grid">
        {currentNews.map((news) => (
          <div key={news.id} className="admin-news-card">
            <div className="admin-news-image">
              <ArticleImage article={news} alt={news.title} />
              <span className={`admin-news-status ${news.featured ? "featured" : "standard"}`}>
                {news.featured ? "Featured" : news.mainNews ? "Main" : news.popular ? "Popular" : "Standard"}
              </span>
            </div>
            <div className="admin-news-content">
              <div className="admin-news-meta">
                <span className="admin-news-category">{news.categoryMl}</span>
                <span className="admin-news-date">{news.date} | <Eye size={12} /> {news.views || 0}</span>
              </div>
              <h3>{news.title}</h3>
              <p>{news.excerpt}</p>
              <div className="admin-news-actions">
                <button className="admin-btn-icon view" onClick={() => handleView(news.id)} title="View">
                  <Eye size={16} />
                </button>
                <button className="admin-btn-icon edit" onClick={() => handleEdit(news.id)} title="Edit">
                  <Edit2 size={16} />
                </button>
                <button className="admin-btn-icon delete" onClick={() => handleDelete(news.id)} title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="admin-pagination">
          <button
            className="admin-pagination-btn"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i + 1}
              className={`admin-pagination-btn ${currentPage === i + 1 ? "active" : ""}`}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          
          <button
            className="admin-pagination-btn"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}

      <div className="admin-stats">
        <div className="stat-card">
          <strong>{newsList.length}</strong>
          <span>Total News</span>
        </div>
        <div className="stat-card">
          <strong>{newsList.filter(n => n.featured).length}</strong>
          <span>Featured</span>
        </div>
        <div className="stat-card">
          <strong>{categories.length - 1}</strong>
          <span>Categories</span>
        </div>
        <div className="stat-card">
          <strong>{newsList.reduce((acc, n) => acc + (n.views || 0), 0)}</strong>
          <span>Total Views</span>
        </div>
      </div>
    </div>
  );
}
