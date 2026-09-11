import { useState, useEffect } from "react";
import { AtSign, Facebook, Instagram, Linkedin, MessageCircle, Send, ThumbsUp, Eye, Youtube, Play, Link2, Share2 } from "lucide-react";
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

function XLogo({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function getVideoEmbedUrl(url) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (match) return `https://www.youtube.com/embed/${match[1]}`;
  const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  const dailymotionMatch = url.match(/(?:dailymotion\.com\/video\/|dai\.ly\/)([a-zA-Z0-9]+)/);
  if (dailymotionMatch) return `https://www.dailymotion.com/embed/video/${dailymotionMatch[1]}`;
  const twitterMatch = url.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/);
  if (twitterMatch) return `https://platform.twitter.com/embed/Tweet.html?id=${twitterMatch[1]}&dnt=true&embedVersion=2a`;
  if (url.includes("facebook.com")) return null;
  if (url.includes("instagram.com")) return `https://www.instagram.com/p/${url.match(/\/p\/([^/]+)/)?.[1] || ""}/embed/`;
  if (url.includes("tiktok.com")) return `https://www.tiktok.com/embed/v2/${url.match(/\/video\/(\d+)/)?.[1] || ""}`;
  if (url.includes("/embed/") || url.includes("player.vimeo")) return url;
  return url;
}

function isFacebookUrl(url) {
  return url && url.includes("facebook.com");
}

function isVideoUrl(url) {
  if (!url) return false;
  return /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)/.test(url) ||
    /(?:vimeo\.com\/)(\d+)/.test(url) ||
    /(?:dailymotion\.com\/video\/|dai\.ly\/)/.test(url) ||
    /(?:twitter\.com|x\.com)\/\w+\/status\/\d+/.test(url) ||
    /facebook\.com\/.*(?:video|reel)/.test(url) ||
    /instagram\.com\/(?:p|reel)\//.test(url) ||
    /tiktok\.com\/@.*\/video\//.test(url);
}

function isImageUrl(url) {
  if (!url) return false;
  return /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?.*)?$/i.test(url) ||
    /\/image\/proxy\?/i.test(url) ||
    /images\.(?:googleusercontent|fbcdn|cloudfront|imgur|wikimedia)\.com/i.test(url) ||
    /pbs\.twimg\.com\/media\//i.test(url) ||
    /instagram\.[a-z]+\/.*\/media\//i.test(url);
}

function extractMediaUrls(body) {
  if (!body || !Array.isArray(body)) return [];
  const items = [];
  const urlRegex = /https?:\/\/[^\s)>\]]+/g;
  body.forEach(paragraph => {
    const matches = paragraph.match(urlRegex);
    if (matches) {
      matches.forEach(url => {
        const cleanUrl = url.replace(/[.,;!?]+$/, "");
        if (isVideoUrl(cleanUrl) && !items.find(i => i.url === cleanUrl)) {
          items.push({ type: "video", url: cleanUrl });
        } else if (isImageUrl(cleanUrl) && !items.find(i => i.url === cleanUrl)) {
          items.push({ type: "image", url: cleanUrl });
        }
      });
    }
  });
  return items;
}

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
  const [copied, setCopied] = useState(false);
  const [authorData, setAuthorData] = useState(null);

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
      setAuthorData(null);
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
          if (data.author) {
            fetchAuthors().then(res => {
              if (!cancelled) {
                const list = res?.authors || res || [];
                const arr = Array.isArray(list) ? list : [];
                const authorName = (data.author || "").trim().toLowerCase();
                const found = arr.find(a => (a.name || "").trim().toLowerCase() === authorName);
                setAuthorData(found || null);
              }
            }).catch(() => {});
          }
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

  const shareUrl = window.location.origin + "/news/" + getShareUrl(article);
  const shareTitle = article.title;
  const shareText = article.title + "\n\n" + shareUrl;

  async function handleNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
      } catch {}
    } else {
      handleCopyLink();
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

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

        {(() => {
          const extractedMedia = extractMediaUrls(article.body);
          const extractedVideos = extractedMedia.filter(m => m.type === "video").map((m, i) => ({ videoUrl: m.url, title: article.title + " - Video " + (i + 1) }));
          const extractedImages = extractedMedia.filter(m => m.type === "image").map((m, i) => ({ imageUrl: m.url, title: article.title + " - Image " + (i + 1) }));
          const allRelatedVideos = [...(article.relatedVideos || []), ...extractedVideos];
          const hasMainVideo = article.videoUrl || allRelatedVideos.length > 0;
          const hasImages = extractedImages.length > 0;

          if (!hasMainVideo && !hasImages) return null;

          const mainVideoUrl = article.videoUrl || allRelatedVideos[0]?.videoUrl;

          return (
            <div className="article-video-section" data-aos="fade-up" data-aos-delay="230">
              {hasMainVideo && (
                <div className="article-video-container">
                  {showVideo && selectedVideo ? (
                    <div className="article-video-player">
                      {selectedVideo.imageUrl ? (
                        <img
                          src={selectedVideo.imageUrl}
                          alt={selectedVideo.title}
                          style={{ width: "100%", height: "100%", objectFit: "contain", background: "#000" }}
                        />
                      ) : isFacebookUrl(selectedVideo.videoUrl) ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", background: "#1877f2", color: "#fff", padding: "24px", textAlign: "center", position: "absolute", inset: 0 }}>
                          <svg width="64" height="64" viewBox="0 0 24 24" fill="white" style={{ marginBottom: "16px" }}><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                          <p style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>Facebook Video</p>
                          <a href={selectedVideo.videoUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "12px 24px", background: "#fff", color: "#1877f2", borderRadius: "8px", fontWeight: 600, textDecoration: "none", fontSize: "15px" }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877f2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                            Watch on Facebook
                          </a>
                        </div>
                      ) : (
                        <iframe
                          src={getVideoEmbedUrl(selectedVideo.videoUrl)}
                          title={selectedVideo.title}
                          frameBorder="0"
                          allow="autoplay; encrypted-media"
                          allowFullScreen
                        />
                      )}
                      <button className="video-close-btn" onClick={() => { setShowVideo(false); setSelectedVideo(null); }}>✕</button>
                    </div>
                  ) : (
                    <div
                      className="article-video-player clickable"
                      onClick={() => { setSelectedVideo({ videoUrl: mainVideoUrl, title: article.title }); setShowVideo(true); }}
                    >
                      {(article.image || article.thumbnail) && <img src={resolveImageUrl(article.image || article.thumbnail)} alt={article.title} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
                      {isFacebookUrl(mainVideoUrl) ? (
                        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "72px", height: "72px", background: "#1877f2", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 5 }}>
                          <svg width="36" height="36" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        </div>
                      ) : (
                        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "72px", height: "72px", background: "rgba(189,29,37,0.9)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 5 }}>
                          <Play size={36} fill="#fff" color="#fff" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {hasImages && (
                <div className="article-video-grid" style={{ marginTop: hasMainVideo ? "16px" : "0" }}>
                  {extractedImages.map((img, index) => (
                    <div
                      key={`img-${index}`}
                      className="article-video-card clickable"
                      onClick={() => { setSelectedVideo({ imageUrl: img.url, title: img.title }); setShowVideo(true); }}
                    >
                      <div className="article-video-thumb">
                        <img src={img.url} alt={img.title} />
                        <div className="article-video-play" style={{ background: "rgba(0,0,0,0.5)" }}>
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                        </div>
                      </div>
                      <span className="article-video-label">{img.title}</span>
                    </div>
                  ))}
                </div>
              )}

              {allRelatedVideos.length > 0 && showVideo && selectedVideo && (
                <div className="article-video-grid" style={{ marginTop: "16px" }}>
                  {allRelatedVideos.map((video, index) => (
                    <div
                      key={index}
                      className="article-video-card clickable"
                      onClick={() => { setSelectedVideo(video); }}
                    >
                      <div className="article-video-thumb">
                        {video.thumbnail && <img src={resolveImageUrl(video.thumbnail)} alt={video.title} />}
                        <div className="article-video-play"><Play size={28} fill="#fff" /></div>
                      </div>
                      <span className="article-video-label">{video.title || "Video " + (index + 1)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

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
          <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&picture=${encodeURIComponent(resolveImageUrl(article.image || article.thumbnail || "") || "")}`} target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook"><Facebook size={20} /></a>
          <a href={`https://x.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on X"><XLogo size={20} /></a>
          <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on WhatsApp"><MessageCircle size={20} /></a>
          <a href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on Telegram"><Send size={20} /></a>
          <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn"><Linkedin size={20} /></a>
          <a href={`https://www.youtube.com/`} target="_blank" rel="noopener noreferrer" aria-label="YouTube"><Youtube size={20} /></a>
          <button onClick={handleNativeShare} aria-label="Share on Instagram" title="Share on Instagram"><Instagram size={20} /></button>
          <a href={`https://www.threads.net/intent/post?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on Threads"><AtSign size={20} /></a>
          <a href={`https://aratt.ai/@malayalamithram_online`} target="_blank" rel="noopener noreferrer" aria-label="Aratt" style={{ fontSize: "13px", fontWeight: 600 }}>Aratt</a>
          <button onClick={handleCopyLink} aria-label="Copy link" title="Copy link to clipboard">
            {copied ? <span style={{ fontSize: "11px", color: "#22c55e", fontWeight: 700 }}>Copied!</span> : <Link2 size={20} />}
          </button>
        </div>

        <div className="article-author-card" data-aos="fade-up" data-aos-delay="350">
          {authorData?.photo ? (
            <img src={authorData.photo} alt={article.author} className="author-avatar" style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }} />
          ) : (
            <div className="author-avatar">{article.author.charAt(0)}</div>
          )}
          <div className="author-details">
            <h4>{authorData?.nameMl || article.author}</h4>
            {authorData?.role && <span className="author-role" style={{ fontSize: "13px", color: "#888", display: "block", marginBottom: 4 }}>{authorData.roleMl || authorData.role}</span>}
            <p>{authorData?.bio || "മലയാളമിത്രം ചീഫ് കറസ്‌പോണ്ടന്റ്. ദേശീയ-അന്തർദേശീയ വിഷയങ്ങളെക്കുറിച്ചും സാമൂഹിക മാറ്റങ്ങളെക്കുറിച്ചും വിശകലനം ചെയ്യുന്നു."}</p>
          </div>
        </div>

        <div className="article-follow-social" data-aos="fade-up" data-aos-delay="370" style={{ padding: "16px 0", borderTop: "1px solid #eee", marginTop: "16px" }}>
          <p style={{ fontWeight: 600, marginBottom: "10px", fontSize: "15px" }}>Follow Us:</p>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <a href={settings.facebook_url && settings.facebook_url !== "#" ? settings.facebook_url : "#"} target={settings.facebook_url && settings.facebook_url !== "#" ? "_blank" : undefined} rel={settings.facebook_url && settings.facebook_url !== "#" ? "noopener noreferrer" : undefined} style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 12px", background: "#1877f2", color: "#fff", borderRadius: "6px", fontSize: "13px", textDecoration: "none" }}><Facebook size={16} /> Facebook</a>
            <a href={settings.youtube_url && settings.youtube_url !== "#" ? settings.youtube_url : "#"} target={settings.youtube_url && settings.youtube_url !== "#" ? "_blank" : undefined} rel={settings.youtube_url && settings.youtube_url !== "#" ? "noopener noreferrer" : undefined} style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 12px", background: "#ff0000", color: "#fff", borderRadius: "6px", fontSize: "13px", textDecoration: "none" }}><Youtube size={16} /> YouTube</a>
            <a href={settings.twitter_url && settings.twitter_url !== "#" ? settings.twitter_url : "#"} target={settings.twitter_url && settings.twitter_url !== "#" ? "_blank" : undefined} rel={settings.twitter_url && settings.twitter_url !== "#" ? "noopener noreferrer" : undefined} style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 12px", background: "#000", color: "#fff", borderRadius: "6px", fontSize: "13px", textDecoration: "none" }}><XLogo size={16} /> X</a>
            <a href={settings.instagram_url && settings.instagram_url !== "#" ? settings.instagram_url : "#"} target={settings.instagram_url && settings.instagram_url !== "#" ? "_blank" : undefined} rel={settings.instagram_url && settings.instagram_url !== "#" ? "noopener noreferrer" : undefined} style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 12px", background: "#e4405f", color: "#fff", borderRadius: "6px", fontSize: "13px", textDecoration: "none" }}><Instagram size={16} /> Instagram</a>
            <a href={settings.whatsapp_url && settings.whatsapp_url !== "#" ? settings.whatsapp_url : "#"} target={settings.whatsapp_url && settings.whatsapp_url !== "#" ? "_blank" : undefined} rel={settings.whatsapp_url && settings.whatsapp_url !== "#" ? "noopener noreferrer" : undefined} style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 12px", background: "#25d366", color: "#fff", borderRadius: "6px", fontSize: "13px", textDecoration: "none" }}><MessageCircle size={16} /> WhatsApp</a>
            <a href={settings.telegram_url && settings.telegram_url !== "#" ? settings.telegram_url : "#"} target={settings.telegram_url && settings.telegram_url !== "#" ? "_blank" : undefined} rel={settings.telegram_url && settings.telegram_url !== "#" ? "noopener noreferrer" : undefined} style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 12px", background: "#0088cc", color: "#fff", borderRadius: "6px", fontSize: "13px", textDecoration: "none" }}><Send size={16} /> Telegram</a>
            <a href={settings.linkedin_url && settings.linkedin_url !== "#" ? settings.linkedin_url : "#"} target={settings.linkedin_url && settings.linkedin_url !== "#" ? "_blank" : undefined} rel={settings.linkedin_url && settings.linkedin_url !== "#" ? "noopener noreferrer" : undefined} style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 12px", background: "#0a66c2", color: "#fff", borderRadius: "6px", fontSize: "13px", textDecoration: "none" }}><Linkedin size={16} /> LinkedIn</a>
            <a href={settings.threads_url && settings.threads_url !== "#" ? settings.threads_url : "#"} target={settings.threads_url && settings.threads_url !== "#" ? "_blank" : undefined} rel={settings.threads_url && settings.threads_url !== "#" ? "noopener noreferrer" : undefined} style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 12px", background: "#000", color: "#fff", borderRadius: "6px", fontSize: "13px", textDecoration: "none" }}><AtSign size={16} /> Threads</a>
            <a href="https://aratt.ai/@malayalamithram_online" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 12px", background: "#6b21a8", color: "#fff", borderRadius: "6px", fontSize: "13px", textDecoration: "none" }}>Aratt</a>
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
