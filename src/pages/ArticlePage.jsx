import { useState, useEffect } from "react";
import { AtSign, Facebook, Instagram, Linkedin, MessageCircle, Send, Twitter, ThumbsUp, Eye, Youtube } from "lucide-react";
import { fetchArticle, fetchNews, incrementView } from "../services/api.js";
import { ArticleImage } from "../services/images.jsx";
import { getCategoryName } from "../services/categories.jsx";
import { articles as fallback } from "../data/news.js";
import { useSettings } from "../context/DataContext.jsx";
import AdSlot from "../components/AdSlot.jsx";
import VisitingCarAd from "../components/VisitingCarAd.jsx";
import Meta from "../components/Meta.jsx";
import PageLayout from "../components/PageLayout.jsx";
import NotFoundPage from "./NotFoundPage.jsx";
import ArticleCard from "../components/ArticleCard.jsx";

export default function ArticlePage({ slug, navigate }) {
  const settings = useSettings();
  const fallbackArticle = fallback.find(a => a.id === slug);
  const [article, setArticle] = useState(fallbackArticle || null);
  const [loading, setLoading] = useState(!fallbackArticle);
  const [fontSize, setFontSize] = useState(null);
  const [related, setRelated] = useState(() => {
    if (!fallbackArticle) return [];
    return fallback.filter(a => a.category === fallbackArticle.category && a.id !== fallbackArticle.id).slice(0, 3);
  });

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchArticle(slug);
        if (data) setArticle(data);
        if (data) {
          incrementView(slug).catch(() => {});
          const relatedData = await fetchNews({ category: data.category, limit: 5 });
          const r = (relatedData.news || []).filter(a => a.id !== data.id).slice(0, 3);
          if (r.length > 0) setRelated(r);
        }
      } catch (err) {
        if (!fallbackArticle) setArticle(null);
      } finally {
        setLoading(false);
      }
    }
    if (slug) load();
  }, [slug]);

  if (loading) {
    return (
      <PageLayout navigate={navigate} className="article-page">
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh", flexDirection: "column", gap: "1rem" }}>
          <div className="loading-spinner" style={{ width: 40, height: 40, border: "4px solid #eee", borderTopColor: "#c91f26", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <p style={{ color: "#666" }}>Article loading...</p>
        </div>
      </PageLayout>
    );
  }

  if (!article) return <NotFoundPage navigate={navigate} />;

const displayRelated = related.length >= 2
    ? related
    : [];

  const articleTitle = (
    <header className="article-page-title" style={{ "--title-bg": article.backgroundColor || "#c91f26" }} data-aos="fade-up">
      <AdSlot slot="article-top" label="Article Top Advertisement (728 x 90)" />
      <span className="pill" data-aos="fade-up" data-aos-delay="50">{getCategoryName(article)}</span>
      <h1 data-aos="fade-left" data-aos-delay="100">{article.title}</h1>
    </header>
  );

  return (
    <PageLayout navigate={navigate} className="article-page" fullWidthHeader={articleTitle}>
        <article className="article-detail" style={{ "--title-bg": article.backgroundColor || "#c91f26" }} data-aos="fade-up">
        <Meta article={article} />

        <div data-aos="zoom-in" data-aos-delay="120">
          <ArticleImage article={article} alt={article.title} className="detail-image" />
        </div>

        <blockquote
          className="article-lead-blockquote"
          data-aos="fade-up"
          data-aos-delay="150"
          style={fontSize ? { fontSize: fontSize + "px" } : undefined}
          onClick={() => setFontSize(prev => Math.min((prev || 23) + 2, 36))}
        >
          {article.excerpt}
        </blockquote>

        <div className="article-body-text" data-aos="fade-up" data-aos-delay="200">
          {(article.body || []).map((paragraph, index) => (
            <div key={index}>
              {index === 1 && (
                <div className="in-article-ads">
                  <div data-aos="fade-right" data-aos-delay="0"><VisitingCarAd slot="article-part-1" /></div>
                  <div data-aos="fade-up" data-aos-delay="100"><VisitingCarAd slot="article-part-2" /></div>
                  <div data-aos="fade-left" data-aos-delay="200"><VisitingCarAd slot="article-part-3" /></div>
                </div>
              )}
              <p
                style={fontSize ? { fontSize: fontSize + "px" } : undefined}
                onClick={() => setFontSize(prev => Math.min((prev || 22) + 2, 36))}
              >{paragraph}</p>
            </div>
          ))}
        </div>

        <div className="tags" data-aos="fade-up" data-aos-delay="250">
          {(article.tags || []).map((tag) => (
            <button key={tag} type="button" onClick={() => navigate("/tags/" + encodeURIComponent(tag))}>
              #{tag}
            </button>
          ))}
        </div>

        <div className="article-stats" data-aos="fade-up" data-aos-delay="270" style={{ display: "flex", gap: "1.5rem", padding: "12px 0", borderTop: "1px solid #eee", borderBottom: "1px solid #eee", margin: "16px 0" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#555", fontSize: "15px" }}>
            <ThumbsUp size={18} /> {article.likes || 0} ലൈക്കുകൾ
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#555", fontSize: "15px" }}>
            <Eye size={18} /> {article.views || 0} വായനകൾ
          </span>
        </div>

        <div className="article-share" data-aos="fade-up" data-aos-delay="300">
          <span>Share:</span>
          <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook"><Facebook size={20} /></a>
          <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(article.title)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on Twitter"><Twitter size={20} /></a>
          <a href={`https://wa.me/?text=${encodeURIComponent(article.title + " " + window.location.href)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on WhatsApp"><MessageCircle size={20} /></a>
          <a href={`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(article.title)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on Telegram"><Send size={20} /></a>
          <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn"><Linkedin size={20} /></a>
        </div>

        <div className="article-author-card" data-aos="fade-up" data-aos-delay="350">
          <div className="author-avatar">{article.author.charAt(0)}</div>
          <div className="author-details">
            <h4>{article.author}</h4>
            <p>മലയാളമിത്രം ചീഫ് കറസ്‌പോണ്ടന്റ്. ദേശീയ-അന്തർദേശീയ വിഷയങ്ങളെക്കുറിച്ചും സാമൂഹിക മാറ്റങ്ങളെക്കുറിച്ചും വിശകലനം ചെയ്യുന്നു.</p>
          </div>
        </div>

        <div className="article-follow-social" data-aos="fade-up" data-aos-delay="370" style={{ padding: "16px 0", borderTop: "1px solid #eee", marginTop: "16px" }}>
          <p style={{ fontWeight: 600, marginBottom: "10px", fontSize: "15px" }}>Follow Us:</p>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {settings.facebook_url && settings.facebook_url !== "#" && <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 12px", background: "#1877f2", color: "#fff", borderRadius: "6px", fontSize: "13px", textDecoration: "none" }}><Facebook size={16} /> Facebook</a>}
            {settings.youtube_url && settings.youtube_url !== "#" && <a href={settings.youtube_url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 12px", background: "#ff0000", color: "#fff", borderRadius: "6px", fontSize: "13px", textDecoration: "none" }}><Youtube size={16} /> YouTube</a>}
            {settings.twitter_url && settings.twitter_url !== "#" && <a href={settings.twitter_url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 12px", background: "#1da1f2", color: "#fff", borderRadius: "6px", fontSize: "13px", textDecoration: "none" }}><Twitter size={16} /> Twitter</a>}
            {settings.instagram_url && settings.instagram_url !== "#" && <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 12px", background: "#e4405f", color: "#fff", borderRadius: "6px", fontSize: "13px", textDecoration: "none" }}><Instagram size={16} /> Instagram</a>}
            {settings.whatsapp_url && settings.whatsapp_url !== "#" && <a href={settings.whatsapp_url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 12px", background: "#25d366", color: "#fff", borderRadius: "6px", fontSize: "13px", textDecoration: "none" }}><MessageCircle size={16} /> WhatsApp</a>}
            {settings.telegram_url && settings.telegram_url !== "#" && <a href={settings.telegram_url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 12px", background: "#0088cc", color: "#fff", borderRadius: "6px", fontSize: "13px", textDecoration: "none" }}><Send size={16} /> Telegram</a>}
            {settings.linkedin_url && settings.linkedin_url !== "#" && <a href={settings.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 12px", background: "#0a66c2", color: "#fff", borderRadius: "6px", fontSize: "13px", textDecoration: "none" }}><Linkedin size={16} /> LinkedIn</a>}
            {settings.threads_url && settings.threads_url !== "#" && <a href={settings.threads_url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 12px", background: "#000", color: "#fff", borderRadius: "6px", fontSize: "13px", textDecoration: "none" }}><AtSign size={16} /> Threads</a>}
          </div>
        </div>
      </article>

      <section className="related-articles-section" data-aos="fade-up" data-aos-delay="400">
        <h3 className="section-block-title" data-aos="fade-left">
          <span>കൂടുതൽ വായിക്കൂ (Related Stories)</span>
        </h3>
        <div className="card-grid">
          {displayRelated.map((relatedStory, i) => (
            <ArticleCard
              key={relatedStory.id}
              article={relatedStory}
              navigate={navigate}
              dataAosDelay={i * 100}
            />
          ))}
        </div>
      </section>
    </PageLayout>
  );
}
