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
import { getArticleBySlug, getTitleSlug, registerArticle } from "../utils/articleStore.js";
import { getShareUrl } from "../utils/transliterate.js";
import { getEmbedUrl, detectPlatform, isSafeVideoUrl } from "../utils/videoEmbed.js";

export default function ArticlePage({ slug, navigate }) {
  const settings = useSettings();

  const fallbackBySlug = fallback.find(a => a.slug === slug || a.id === slug);
  const fallbackById = fallback.find(a => a.id === slug);
  const fallbackArticle = fallbackBySlug || fallbackById;

  const cachedArticle = !fallbackArticle ? getArticleBySlug(slug) : null;

  const [article, setArticle] = useState(fallbackArticle || cachedArticle || null);
  const [loading, setLoading] = useState(!fallbackArticle && !cachedArticle);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showVideo, setShowVideo] = useState(false);
  const [related, setRelated] = useState(() => {
    const base = fallbackArticle || cachedArticle;
    if (!base) return [];
    const cat = base.category || "";
    let items = fallback.filter(a => a.category === cat && a.id !== base.id);
    if (items.length === 0) {
      items = fallback.filter(a => a.id !== base.id);
    }
    return items.slice(0, 3);
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setArticle(null);
      setRelated([]);
      try {
        if (fallbackArticle) {
          if (!cancelled) {
            setArticle(fallbackArticle);
            const cat = fallbackArticle.category || "";
            let items = fallback.filter(a => a.category === cat && a.id !== fallbackArticle.id);
            if (items.length === 0) {
              items = fallback.filter(a => a.id !== fallbackArticle.id);
            }
            setRelated(items.slice(0, 3));
            setLoading(false);
          }
          return;
        }
        let data = await fetchArticle(slug);
        if (!cancelled && data) {
          if (data.slug && data.slug !== slug) {
            try { window.history.replaceState({}, "", "/news/" + data.slug); } catch {}
          }
          setArticle(data);
          registerArticle(data);
          incrementView(data.slug || data.id).catch(() => {});
          try {
            if (data.category) {
              const relatedData = await fetchNews({ category: data.category, limit: 50 });
              let r = (relatedData.news || []).filter(a => a.slug !== data.slug).slice(0, 3);
              if (r.length === 0) {
                r = (relatedData.news || []).filter(a => a.id !== data.id).slice(0, 3);
              }
              setRelated(r);
            }
          } catch {
            if (data.category) {
              let items = fallback.filter(a => a.category === data.category && a.id !== data.id).slice(0, 3);
              setRelated(items);
            }
          }
        } else if (!cancelled) {
          setArticle(null);
        }
      } catch (err) {
        if (!cancelled && !fallbackArticle && !cachedArticle) setArticle(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (slug) load();
    return () => { cancelled = true; };
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
          <div className="article-video-section" data-aos="fade-up" data-aos-delay="230" style={{ maxWidth: 960, margin: "0 auto", width: "100%" }}>
            <h4 className="article-video-title" style={{ textAlign: "center" }}>
              <Play size={20} /> വീഡിയോകൾ (Videos)
            </h4>
            <div className="article-video-container" style={{ display: "flex", justifyContent: "center", width: "100%" }}>
              {showVideo && selectedVideo ? (
                <div className="article-video-player" style={{ position: "relative", paddingBottom: "62%", height: 0, overflow: "hidden", borderRadius: 12, width: "100%", maxWidth: 860, margin: "0 auto", background: "#000", boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
                  <iframe
                    src={getEmbedUrl(selectedVideo.videoUrl) || selectedVideo.videoUrl}
                    title={selectedVideo.title || "Video"}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
                  />
                  <button className="video-close-btn" onClick={() => { setShowVideo(false); setSelectedVideo(null); }} style={{ position: "absolute", top: 10, right: 10, zIndex: 2, background: "rgba(0,0,0,0.6)", color: "#fff", border: 0, borderRadius: "50%", width: 32, height: 32, cursor: "pointer" }}>✕</button>
                </div>
              ) : (
                <div className="article-video-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 18, width: "100%", maxWidth: 900, justifyItems: "center" }}>
                  {article.videoUrl && isSafeVideoUrl(article.videoUrl) && (
                    <div
                      className="article-video-card clickable"
                      onClick={() => { setSelectedVideo({ videoUrl: article.videoUrl, title: article.title }); setShowVideo(true); }}
                    >
                      <div className="article-video-thumb" style={{ position: "relative", paddingBottom: "56.25%", background: "#000", borderRadius: 8, overflow: "hidden" }}>
                        {(article.image || article.thumbnail) && <img src={resolveImageUrl(article.image || article.thumbnail)} alt={article.title} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover" }} />}
                        <div className="article-video-play" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.35)" }}><Play size={28} fill="#fff" color="#fff" /></div>
                        <span style={{ position: "absolute", bottom: 6, left: 6, background: "rgba(0,0,0,0.7)", color: "#fff", fontSize: 11, padding: "2px 6px", borderRadius: 4 }}>{detectPlatform(article.videoUrl)}</span>
                      </div>
                      <span className="article-video-label" style={{ display: "block", marginTop: 6, fontWeight: 600 }}>{article.title}</span>
                    </div>
                  )}
                  {(article.relatedVideos || []).filter(v => isSafeVideoUrl(v.videoUrl)).map((video, index) => (
                    <div
                      key={index}
                      className="article-video-card clickable"
                      onClick={() => { setSelectedVideo(video); setShowVideo(true); }}
                      style={{ width: "100%", maxWidth: 420 }}
                    >
                      <div className="article-video-thumb" style={{ position: "relative", paddingBottom: "62%", background: "#000", borderRadius: 10, overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.12)" }}>
                        {video.thumbnail ? <img src={resolveImageUrl(video.thumbnail)} alt={video.title} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,#1a1a1a,#333)", display: "flex", alignItems: "center", justifyContent: "center" }}><Play size={36} color="#fff" /></div>}
                        <div className="article-video-play" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.25)" }}><Play size={32} fill="#fff" color="#fff" /></div>
                        <span style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(0,0,0,0.75)", color: "#fff", fontSize: 11, padding: "3px 8px", borderRadius: 6 }}>{video.platform || detectPlatform(video.videoUrl)}</span>
                      </div>
                      <span className="article-video-label" style={{ display: "block", marginTop: 8, fontWeight: 600, textAlign: "center" }}>{video.title || "Video " + (index + 1)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {showVideo && selectedVideo && (
              <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                {(article.relatedVideos || []).filter(v => isSafeVideoUrl(v.videoUrl)).map((v, i) => (
                  <button key={i} onClick={() => setSelectedVideo(v)} style={{ padding: "6px 12px", borderRadius: 6, border: selectedVideo.videoUrl === v.videoUrl ? "2px solid #c91f26" : "1px solid #ddd", background: selectedVideo.videoUrl === v.videoUrl ? "#c91f26" : "#fff", color: selectedVideo.videoUrl === v.videoUrl ? "#fff" : "#333", fontSize: 12, cursor: "pointer" }}>{v.title || `Video ${i+1}`}</button>
                ))}
              </div>
            )}
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
          {(() => {
            const shareSlug = getShareUrl(article);
            const origin = window.location.origin;
            const shareUrl = `${origin}/news/${shareSlug}`;
            const shareTitle = article.title;
            const rawImage = article.image || article.thumbnail || "";
            let shareImage = resolveImageUrl(rawImage) || "";
            if (shareImage && !shareImage.startsWith("http")) {
              shareImage = origin + shareImage;
            }
            const shareText = `${shareTitle}\n\n${shareUrl}`;
            return (
              <>
                <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&picture=${encodeURIComponent(shareImage)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook"><Facebook size={20} /></a>
                <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on Twitter"><Twitter size={20} /></a>
                <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on WhatsApp"><MessageCircle size={20} /></a>
                <a href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on Telegram"><Send size={20} /></a>
                <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn"><Linkedin size={20} /></a>
              </>
            );
          })()}
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

      {displayRelated.length > 0 && (
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
      )}
    </PageLayout>
  );
}
