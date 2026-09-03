import { useState, useEffect } from "react";
import { AtSign, Facebook, Instagram, Linkedin, MessageCircle, Send, ThumbsUp, Eye, Youtube, Play } from "lucide-react";

function XIcon({ size = 20, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
import { fetchArticle, fetchNews, incrementView, fetchAuthors } from "../services/api.js";
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
import { detectPlatform, isSafeVideoUrl } from "../utils/videoEmbed.js";
import { VideoEmbedContainer, UnifiedVideoPlayer } from "../components/VideoEmbedContainer.jsx";

export default function ArticlePage({ slug, navigate }) {
  const settings = useSettings();
  const [authorDetails, setAuthorDetails] = useState(null);

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

  useEffect(() => {
    if (!article?.author) { setAuthorDetails(null); return; }
    let cancelled = false;
    fetchAuthors().then(data => {
      if (cancelled) return;
      const list = Array.isArray(data) ? data : [];
      const found = list.find(a => a.name && a.name.toLowerCase() === article.author.toLowerCase());
      setAuthorDetails(found || null);
    }).catch(() => { if (!cancelled) setAuthorDetails(null); });
    return () => { cancelled = true; };
  }, [article?.author]);

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
          {(article.body || []).slice(0, 3).map((paragraph, index) => (
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

        {(() => {
          const related = (article.relatedVideos || []).filter(v => isSafeVideoUrl(v.videoUrl));
          const mainVideoUrl = article.videoUrl && isSafeVideoUrl(article.videoUrl) ? article.videoUrl : "";
          const allVideos = mainVideoUrl && !related.some(v => v.videoUrl === mainVideoUrl)
            ? [{ videoUrl: mainVideoUrl, title: article.title, thumbnail: "", platform: detectPlatform(mainVideoUrl) }, ...related]
            : related;
          if (allVideos.length === 0) return null;
          return (
          <div className="article-video-section" data-aos="fade-up" data-aos-delay="230" style={{ maxWidth: 960, margin: "0 auto", width: "100%" }}>
            <h4 className="article-video-title" style={{ textAlign: "center" }}>
              <Play size={20} /> വീഡിയോകൾ (Videos)
            </h4>
            <div className="article-video-container" style={{ display: "flex", justifyContent: "center", width: "100%" }}>
              {(() => {
                const active = showVideo && selectedVideo ? selectedVideo : allVideos[0];
                return (
                <div style={{ width: "100%", maxWidth: 860, margin: "0 auto", position: "relative" }}>
                  <VideoEmbedContainer>
                    <UnifiedVideoPlayer url={active.videoUrl} title={active.title || "Video"} />
                  </VideoEmbedContainer>
                  {showVideo && selectedVideo && (
                    <button className="video-close-btn" onClick={() => { setShowVideo(false); setSelectedVideo(null); }} style={{ position: "absolute", top: 10, right: 10, zIndex: 2, background: "rgba(0,0,0,0.6)", color: "#fff", border: 0, borderRadius: "50%", width: 32, height: 32, cursor: "pointer" }}>✕</button>
                  )}
                </div>
                );
              })()}
            </div>
            {allVideos.length > 1 && (
              <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                {allVideos.map((v, i) => {
                  const activeUrl = (showVideo && selectedVideo ? selectedVideo.videoUrl : allVideos[0].videoUrl);
                  return (
                  <button key={i} onClick={() => { setSelectedVideo(v); setShowVideo(true); }} style={{ padding: "6px 12px", borderRadius: 6, border: activeUrl === v.videoUrl ? "2px solid #c91f26" : "1px solid #ddd", background: activeUrl === v.videoUrl ? "#c91f26" : "#fff", color: activeUrl === v.videoUrl ? "#fff" : "#333", fontSize: 12, cursor: "pointer" }}>{v.title || `Video ${i+1}`}</button>
                  );
                })}
              </div>
            )}
          </div>
          );
        })()}

        <div className="article-body-text" data-aos="fade-up" data-aos-delay="200">
          {(article.body || []).slice(3).map((paragraph, index) => (
            <div key={index + 3}>
              <p>{parseLinks(paragraph)}</p>
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
                <a href={`https://x.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on X"><XIcon size={20} /></a>
                <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on WhatsApp"><MessageCircle size={20} /></a>
                <a href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on Telegram"><Send size={20} /></a>
                <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn"><Linkedin size={20} /></a>
              </>
            );
          })()}
        </div>

        <div className="article-author-card" data-aos="fade-up" data-aos-delay="350">
          {authorDetails?.photo ? (
            <img src={resolveImageUrl(authorDetails.photo)} alt={article.author || "Author"} className="author-avatar" style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }} />
          ) : (
            <div className="author-avatar">{(article.author || "M").charAt(0).toUpperCase()}</div>
          )}
          <div className="author-details">
            <h4>{article.author || "Malayalamitram"}</h4>
            {authorDetails?.role ? (
              <p>{authorDetails.roleMl || authorDetails.role}</p>
            ) : (
              <p>മലയാളമിത്രം ചീഫ് കറസ്‌പോണ്ടന്റ്. ദേശീയ-അന്തർദേശീയ വിഷയങ്ങളെക്കുറിച്ചും സാമൂഹിക മാറ്റങ്ങളെക്കുറിച്ചും വിശകലനം ചെയ്യുന്നു.</p>
            )}
          </div>
        </div>

        <div className="article-follow-social" data-aos="fade-up" data-aos-delay="370" style={{ padding: "16px 0", borderTop: "1px solid #eee", marginTop: "16px" }}>
          <p style={{ fontWeight: 600, marginBottom: "10px", fontSize: "15px" }}>Follow Us:</p>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <a href={settings.facebook_url && settings.facebook_url !== "#" ? settings.facebook_url : "#"} target={settings.facebook_url && settings.facebook_url !== "#" ? "_blank" : undefined} rel={settings.facebook_url && settings.facebook_url !== "#" ? "noopener noreferrer" : undefined} style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 12px", background: "#1877f2", color: "#fff", borderRadius: "6px", fontSize: "13px", textDecoration: "none" }}><Facebook size={16} /> Facebook</a>
            <a href={settings.youtube_url && settings.youtube_url !== "#" ? settings.youtube_url : "#"} target={settings.youtube_url && settings.youtube_url !== "#" ? "_blank" : undefined} rel={settings.youtube_url && settings.youtube_url !== "#" ? "noopener noreferrer" : undefined} style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 12px", background: "#ff0000", color: "#fff", borderRadius: "6px", fontSize: "13px", textDecoration: "none" }}><Youtube size={16} /> YouTube</a>
            <a href={settings.twitter_url && settings.twitter_url !== "#" ? settings.twitter_url : "#"} target={settings.twitter_url && settings.twitter_url !== "#" ? "_blank" : undefined} rel={settings.twitter_url && settings.twitter_url !== "#" ? "noopener noreferrer" : undefined} style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 12px", background: "#000", color: "#fff", borderRadius: "6px", fontSize: "13px", textDecoration: "none" }}><XIcon size={16} /> X</a>
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
