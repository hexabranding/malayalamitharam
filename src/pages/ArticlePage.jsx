import { useState, useEffect } from "react";
import { AtSign, Facebook, Instagram, Linkedin, MessageCircle, Send, Twitter, ThumbsUp, Eye, Youtube, Play } from "lucide-react";
import { fetchArticle, fetchNews, incrementView } from "../services/api.js";
import { ArticleImage, resolveImageUrl } from "../services/images.jsx";
import { getCategoryName } from "../services/categories.jsx";
import { articles as fallback } from "../data/news.js";
import { useSettings } from "../context/DataContext.jsx";
import { parseLinks } from "../services/parseLinks.jsx";
import AdSlot from "../components/AdSlot.jsx";
import VisitingCarAd from "../components/VisitingCarAd.jsx";
import Meta from "../components/Meta.jsx";
import PageLayout from "../components/PageLayout.jsx";
import NotFoundPage from "./NotFoundPage.jsx";
import ArticleCard from "../components/ArticleCard.jsx";

function getYoutubeEmbedUrl(url) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (match) return `https://www.youtube.com/embed/${match[1]}`;
  if (url.includes("facebook.com") || url.includes("instagram.com")) return url;
  return url;
}

export default function ArticlePage({ slug, navigate }) {
  const settings = useSettings();
  const fallbackArticle = fallback.find(a => a.id === slug);
  const [article, setArticle] = useState(fallbackArticle || null);
  const [loading, setLoading] = useState(!fallbackArticle);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showVideo, setShowVideo] = useState(false);
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

const displayRelated = related.length >= 1
    ? related
    : [];

  const articleTitle = (
    <header className="article-page-title" style={{ "--title-bg": article.backgroundColor || "#c91f26" }} data-aos="fade-up">
      <AdSlot slot="article-top" label="Article Top Advertisement (728 x 90)" slider />
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
              <p>{parseLinks(paragraph)}</p>
            </div>
          ))}
        </div>

        {(article.relatedVideos?.length > 0 || article.videoUrl) && (
          <div className="article-video-section" data-aos="fade-up" data-aos-delay="230">
            <h4 className="article-video-title">
              <Play size={18} /> വീഡിയോകൾ (Videos)
            </h4>
            <div className="article-video-container">
              {showVideo && selectedVideo ? (
                <div className="article-video-player">
                  <iframe
                    src={getYoutubeEmbedUrl(selectedVideo.videoUrl)}
                    title={selectedVideo.title}
                    frameBorder="0"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                  />
                  <button className="video-close-btn" onClick={() => { setShowVideo(false); setSelectedVideo(null); }}>✕</button>
                </div>
              ) : (
                <div className="article-video-grid">
                  {article.videoUrl && (
                    <div
                      className="article-video-card clickable"
                      onClick={() => { setSelectedVideo({ videoUrl: article.videoUrl, title: article.title }); setShowVideo(true); }}
                    >
                      <div className="article-video-thumb">
                        {(article.image || article.thumbnail) && <img src={resolveImageUrl(article.image || article.thumbnail)} alt={article.title} />}
                        <div className="article-video-play"><Play size={24} fill="#fff" /></div>
                      </div>
                      <span className="article-video-label">{article.title}</span>
                    </div>
                  )}
                  {(article.relatedVideos || []).map((video, index) => (
                    <div
                      key={index}
                      className="article-video-card clickable"
                      onClick={() => { setSelectedVideo(video); setShowVideo(true); }}
                    >
                      <div className="article-video-thumb">
                        {video.thumbnail && <img src={resolveImageUrl(video.thumbnail)} alt={video.title} />}
                        <div className="article-video-play"><Play size={24} fill="#fff" /></div>
                      </div>
                      <span className="article-video-label">{video.title || "Video " + (index + 1)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

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
            <a href={settings.facebook_url && settings.facebook_url !== "#" ? settings.facebook_url : "#"} target={settings.facebook_url && settings.facebook_url !== "#" ? "_blank" : undefined} rel={settings.facebook_url && settings.facebook_url !== "#" ? "noopener noreferrer" : undefined} style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 12px", background: "#1877f2", color: "#fff", borderRadius: "6px", fontSize: "13px", textDecoration: "none" }}><Facebook size={16} /> Facebook</a>
            <a href={settings.youtube_url && settings.youtube_url !== "#" ? settings.youtube_url : "#"} target={settings.youtube_url && settings.youtube_url !== "#" ? "_blank" : undefined} rel={settings.youtube_url && settings.youtube_url !== "#" ? "noopener noreferrer" : undefined} style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 12px", background: "#ff0000", color: "#fff", borderRadius: "6px", fontSize: "13px", textDecoration: "none" }}><Youtube size={16} /> YouTube</a>
            <a href={settings.twitter_url && settings.twitter_url !== "#" ? settings.twitter_url : "#"} target={settings.twitter_url && settings.twitter_url !== "#" ? "_blank" : undefined} rel={settings.twitter_url && settings.twitter_url !== "#" ? "noopener noreferrer" : undefined} style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 12px", background: "#1da1f2", color: "#fff", borderRadius: "6px", fontSize: "13px", textDecoration: "none" }}><Twitter size={16} /> Twitter</a>
            <a href={settings.instagram_url && settings.instagram_url !== "#" ? settings.instagram_url : "#"} target={settings.instagram_url && settings.instagram_url !== "#" ? "_blank" : undefined} rel={settings.instagram_url && settings.instagram_url !== "#" ? "noopener noreferrer" : undefined} style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 12px", background: "#e4405f", color: "#fff", borderRadius: "6px", fontSize: "13px", textDecoration: "none" }}><Instagram size={16} /> Instagram</a>
            <a href={settings.whatsapp_url && settings.whatsapp_url !== "#" ? settings.whatsapp_url : "#"} target={settings.whatsapp_url && settings.whatsapp_url !== "#" ? "_blank" : undefined} rel={settings.whatsapp_url && settings.whatsapp_url !== "#" ? "noopener noreferrer" : undefined} style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 12px", background: "#25d366", color: "#fff", borderRadius: "6px", fontSize: "13px", textDecoration: "none" }}><MessageCircle size={16} /> WhatsApp</a>
            <a href={settings.telegram_url && settings.telegram_url !== "#" ? settings.telegram_url : "#"} target={settings.telegram_url && settings.telegram_url !== "#" ? "_blank" : undefined} rel={settings.telegram_url && settings.telegram_url !== "#" ? "noopener noreferrer" : undefined} style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 12px", background: "#0088cc", color: "#fff", borderRadius: "6px", fontSize: "13px", textDecoration: "none" }}><Send size={16} /> Telegram</a>
            <a href={settings.linkedin_url && settings.linkedin_url !== "#" ? settings.linkedin_url : "#"} target={settings.linkedin_url && settings.linkedin_url !== "#" ? "_blank" : undefined} rel={settings.linkedin_url && settings.linkedin_url !== "#" ? "noopener noreferrer" : undefined} style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 12px", background: "#0a66c2", color: "#fff", borderRadius: "6px", fontSize: "13px", textDecoration: "none" }}><Linkedin size={16} /> LinkedIn</a>
            <a href={settings.threads_url && settings.threads_url !== "#" ? settings.threads_url : "#"} target={settings.threads_url && settings.threads_url !== "#" ? "_blank" : undefined} rel={settings.threads_url && settings.threads_url !== "#" ? "noopener noreferrer" : undefined} style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 12px", background: "#000", color: "#fff", borderRadius: "6px", fontSize: "13px", textDecoration: "none" }}><AtSign size={16} /> Threads</a>
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
