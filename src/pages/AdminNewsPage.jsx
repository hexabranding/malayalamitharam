import { useState, useEffect, useRef } from "react";
import { Edit2, Trash2, Eye, Search, Filter, Plus, X } from "lucide-react";
import { fetchNews, deleteArticle, loadMenuGroups } from "../services/api.js";
import { articles as fallback } from "../data/news.js";
import { ArticleImage } from "../services/images.jsx";

export default function AdminNewsPage({ navigate }) {
  const [newsList, setNewsList] = useState(fallback);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [categoryMap, setCategoryMap] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);

  const itemsPerPage = 10;

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchNews({ limit: 200 }).then(data => {
      const fetched = data.news || [];
      if (fetched.length > 0) setNewsList(fetched);
    }).catch(() => {});
    loadMenuGroups().then(groups => {
      const map = {};
      groups.forEach(g => {
        map[g.slug] = g.titleMl || g.label;
        if (g.children) {
          g.children.forEach(c => { map[c.slug] = c.titleMl || c.label; });
        }
      });
      setCategoryMap(map);
    }).catch(() => {});
  }, []);

  function getCategoryName(slug) {
    if (categoryMap[slug]) return categoryMap[slug];
    const match = newsList.find(n => n.category === slug);
    if (match?.categoryMl) return match.categoryMl;
    return slug;
  }

  const categories = ["all", ...new Set(newsList.map(a => a.category))];

  const filteredNews = newsList.filter(news => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = !q ||
      news.title.toLowerCase().includes(q) ||
      news.excerpt.toLowerCase().includes(q) ||
      (news.categoryMl && news.categoryMl.toLowerCase().includes(q)) ||
      (news.author && news.author.toLowerCase().includes(q));
    const matchesCategory = selectedCategory === "all" || news.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  useEffect(() => {
    if (searchTerm.trim().length < 1) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      const q = searchTerm.toLowerCase();
      const matches = newsList.filter(n =>
        n.title.toLowerCase().includes(q) || n.excerpt.toLowerCase().includes(q)
      ).slice(0, 6);
      setSuggestions(matches);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchTerm, newsList]);

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
        <div className="admin-search" ref={searchRef} style={{ position: "relative" }}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Search news..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setShowSuggestions(true); }}
            onFocus={() => { if (searchTerm.trim()) setShowSuggestions(true); }}
          />
          {searchTerm && (
            <button onClick={() => { setSearchTerm(""); setSuggestions([]); setShowSuggestions(false); }} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "#888" }}>
              <X size={16} />
            </button>
          )}
          {showSuggestions && suggestions.length > 0 && (
            <div className="admin-search-suggestions">
              {suggestions.map((article) => (
                <button key={article.id} className="admin-suggestion-item" onClick={() => { navigate(`/admin/news/edit/${article.id}`); setShowSuggestions(false); }}>
                  <div className="admin-suggestion-info">
                    <span className="admin-suggestion-title">{article.title}</span>
                    <span className="admin-suggestion-cat">{getCategoryName(article.category)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="admin-filters">
          <Filter size={18} />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === "all" ? "All Categories" : getCategoryName(cat)}
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
