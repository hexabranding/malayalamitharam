import { useState, useEffect } from "react";
import { fetchNews } from "../services/api.js";
import { articles as fallback } from "../data/news.js";
import { ArticleImage } from "../services/images.jsx";
import { Newspaper, Eye, MessageSquare, TrendingUp, Calendar, Heart, Zap } from "lucide-react";

export default function AdminDashboard({ navigate }) {
  const [articles, setArticles] = useState(fallback);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    async function loadArticles() {
      try {
        let allArticles = [];
        let page = 1;
        let hasMore = true;
        while (hasMore) {
          const data = await fetchNews({ limit: 100, page });
          const batch = data.news || [];
          allArticles = [...allArticles, ...batch];
          setTotalCount(data.total || allArticles.length);
          if (batch.length < 100) hasMore = false;
          else page++;
        }
        if (allArticles.length > 0) setArticles(allArticles);
      } catch {}
    }
    loadArticles();
    const interval = setInterval(loadArticles, 30000);
    window.addEventListener("mm-data-updated", loadArticles);
    return () => {
      clearInterval(interval);
      window.removeEventListener("mm-data-updated", loadArticles);
    };
  }, []);

  const totalNews = totalCount || articles.length;
  const featuredNews = articles.filter(a => a.featured).length;
  const breakingNews = articles.filter(a => a.breaking).length;
  const totalViews = articles.reduce((acc, a) => acc + (a.views || 0), 0);
  const totalComments = articles.reduce((acc, a) => acc + (a.comments || 0), 0);

  const recentNews = articles.slice(0, 5);
  const categories = [...new Set(articles.map(a => a.category))];
  const leadStory = articles.find((a) => a.featured) || articles[0];
  const popular = [...articles].sort((a, b) => (b.comments || 0) - (a.comments || 0)).slice(0, 4);
  const mainNews = articles.filter((a) => a.id !== leadStory?.id).slice(0, 4);

  const quickActions = [
    { label: "Add News", icon: Newspaper, path: "/admin/news/new", color: "#bd1d25" },
    { label: "View All News", icon: Eye, path: "/admin/news", color: "#0d4228" },
    { label: "Manage Ads", icon: TrendingUp, path: "/admin/ads", color: "#e6b313" },
    { label: "Settings", icon: Calendar, path: "/admin/settings", color: "#6b7280" },
  ];

  return (
    <div className="admin-dashboard">
      <div className="dashboard-stats">
        <div className="stat-card-large">
          <div className="stat-icon" style={{ background: "#bd1d25" }}>
            <Newspaper size={24} />
          </div>
          <div className="stat-info">
            <strong>{totalNews}</strong>
            <span>Total News Articles</span>
          </div>
        </div>

        <div className="stat-card-large">
          <div className="stat-icon" style={{ background: "#e6b313" }}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <strong>{featuredNews}</strong>
            <span>Featured Stories</span>
          </div>
        </div>

        <div className="stat-card-large">
          <div className="stat-icon" style={{ background: "#0d4228" }}>
            <Eye size={24} />
          </div>
          <div className="stat-info">
            <strong>{totalViews}</strong>
            <span>Total Views</span>
          </div>
        </div>

        <div className="stat-card-large">
          <div className="stat-icon" style={{ background: "#6b7280" }}>
            <MessageSquare size={24} />
          </div>
          <div className="stat-info">
            <strong>{totalComments}</strong>
            <span>Total Comments</span>
          </div>
        </div>

        <div className="stat-card-large">
          <div className="stat-icon" style={{ background: "#c91f26" }}>
            <Zap size={24} />
          </div>
          <div className="stat-info">
            <strong>{breakingNews}</strong>
            <span>Breaking News</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-section">
          <h3>Quick Actions</h3>
          <div className="quick-actions-grid">
            {quickActions.map((action, index) => (
              <button
                key={index}
                className="quick-action-card"
                onClick={() => navigate(action.path)}
                style={{ borderColor: action.color }}
              >
                <action.icon size={32} style={{ color: action.color }} />
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="dashboard-section">
          <h3>Recent News</h3>
          <div className="recent-news-list">
            {recentNews.map((news) => (
              <div key={news.id} className="recent-news-item">
                <div className="recent-news-info">
                  <span className="recent-news-category">{news.categoryMl}</span>
                  <h4>{news.title}</h4>
                  <small>{news.date}</small>
                </div>
                <div className="recent-news-stats">
                  <span><Eye size={14} /> {news.views || 0}</span>
                  <span><Heart size={14} /> {news.comments}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-section">
          <h3>Categories Overview</h3>
          <div className="categories-overview">
            {categories.map((category) => {
              const count = articles.filter(a => a.category === category).length;
              const percentage = (count / totalNews) * 100;
              return (
                <div key={category} className="category-stat">
                  <div className="category-stat-header">
                    <span className="category-name">{category.charAt(0).toUpperCase() + category.slice(1)}</span>
                  </div>
                  <div className="category-progress">
                    <div
                      className="category-progress-bar"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="dashboard-section admin-readonly-preview">
          <h3>Main News <small>(User site preview — auto from news)</small></h3>
          <div className="admin-mini-news-list">
            {mainNews.map((story) => (
              <div key={story.id} className="admin-mini-news-item">
                <ArticleImage article={story} alt="" className="admin-mini-news-img" />
                <span>{story.title}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-section admin-readonly-preview">
          <h3>Popular <small>(User site preview — auto from comments)</small></h3>
          <div className="admin-mini-news-list">
            {popular.map((story) => (
              <div key={story.id} className="admin-mini-news-item">
                <ArticleImage article={story} alt="" className="admin-mini-news-img" />
                <span>{story.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
