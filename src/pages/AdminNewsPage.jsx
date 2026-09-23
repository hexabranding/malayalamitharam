import { useState, useEffect, useRef } from "react";
import { Edit2, Trash2, Eye, Search, Filter, Plus, X } from "lucide-react";
import AdminPagination from "../components/AdminPagination.jsx";
import { fetchNews, deleteArticle, loadMenuGroups } from "../services/api.js";
import { articles as fallback } from "../data/news.js";
import { ArticleImage } from "../services/images.jsx";

export default function AdminNewsPage({ navigate }) {
  const [newsList, setNewsList] = useState(fallback);
  const [total, setTotal] = useState(fallback.length);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [categoryMap, setCategoryMap] = useState({});
  const [menuGroupsData, setMenuGroupsData] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
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

  // Debounce search input for server query (400ms)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedCategory]);

  // Server-side paginated fetch: uses API filtering so all 428+ items are browsable and newly added always appears on page 1
  useEffect(() => {
    let cancelled = false;
    async function loadNews() {
      setLoading(true);
      const params = { limit: itemsPerPage, page: currentPage };
      if (debouncedSearch) params.search = debouncedSearch;
      if (selectedCategory !== "all") params.category = selectedCategory;
      try {
        const data = await fetchNews(params);
        if (cancelled) return;
        const fetched = data.news || [];
        // If API returns empty on page 1 with no filters, keep fallback so admin never sees blank screen offline
        if (fetched.length === 0 && currentPage === 1 && !debouncedSearch && selectedCategory === "all" && data.total === 0) {
          // keep fallback? but total 0 means truly empty DB – show empty
          setNewsList([]);
        } else if (fetched.length > 0) {
          setNewsList(fetched);
        } else {
          setNewsList(fetched);
        }
        if (typeof data.total === "number") setTotal(data.total);
      } catch (err) {
        console.error("AdminNewsPage fetchNews failed:", err.message);
        // keep existing list (fallback or previous page) on error
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadNews();
    function onUpdated() { loadNews(); }
    // also listen for external updates (create/edit) – refetch current page
    window.addEventListener("mm-data-updated", onUpdated);
    return () => {
      cancelled = true;
      window.removeEventListener("mm-data-updated", onUpdated);
    };
  }, [currentPage, debouncedSearch, selectedCategory]);

  useEffect(() => {
    loadMenuGroups().then(groups => {
      setMenuGroupsData(groups);
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

  // Build filter dropdown from API categories + current page + fallback so admin can see all options even when paging
  const categories = ["all", ...new Set([
    ...menuGroupsData.flatMap(g => g.children ? g.children.map(c => c.slug) : [g.slug]),
    ...fallback.map(a => a.category),
    ...newsList.map(a => a.category),
  ].filter(Boolean))];

  useEffect(() => {
    if (debouncedSearch.length < 1) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      const q = debouncedSearch.toLowerCase();
      const matches = newsList.filter(n =>
        n.title.toLowerCase().includes(q) || n.excerpt.toLowerCase().includes(q)
      ).slice(0, 6);
      setSuggestions(matches);
      // also try server suggestion for broader match if local 0
      if (matches.length === 0) {
        fetchNews({ search: debouncedSearch, limit: 6 }).then(d => {
          const s = (d.news || []).slice(0, 6);
          if (s.length) setSuggestions(s);
        }).catch(() => {});
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [debouncedSearch, newsList]);

  // Server pagination – currentNews is already the page slice
  const totalPages = Math.ceil(total / itemsPerPage);
  const currentNews = newsList;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + currentNews.length;

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this news?")) {
      try {
        await deleteArticle(id);
        const updated = newsList.filter(news => news.id !== id);
        setNewsList(updated);
        setTotal((t) => Math.max(0, t - 1));
        window.dispatchEvent(new Event("mm-data-updated"));
      } catch (err) {
        alert("Failed to delete: " + err.message);
      }
    }
  };

  const handleEdit = (id) => {
    navigate(`/admin/news/edit/${id}`);
  };

  const handleView = (id) => {
    navigate(`/news/${id}`);
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
                <button className="admin-btn-icon view" onClick={() => handleView(news.slug)} title="View">
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
        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      <div className="admin-stats">
        <div className="stat-card">
          <strong>{total}</strong>
          <span>Total News</span>
        </div>
        <div className="stat-card">
          <strong>{newsList.filter(n => n.featured).length}</strong>
          <span>Featured</span>
        </div>
        <div className="stat-card">
          <strong>{new Set(newsList.map(n => n.category)).size}</strong>
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
