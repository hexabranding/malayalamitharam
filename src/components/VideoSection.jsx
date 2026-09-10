import { useState, useMemo } from "react";
import { ThumbsUp, Play, Clock, Youtube } from "lucide-react";
import { ArticleImage } from "../services/images.jsx";
import { useSettings } from "../context/DataContext.jsx";
import { getTitleSlug } from "../utils/articleStore.js";
import AdSlot from "./AdSlot.jsx";

function getVideoEmbedUrl(url) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (match) return `https://www.youtube.com/embed/${match[1]}?autoplay=1`;
  const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
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

export default function VideoSection({ articles, navigate }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(142);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showVideo, setShowVideo] = useState(false);
  const settings = useSettings();
  const youtubeChannelUrl = settings.youtube_url || "";

  const videoArticles = articles.filter((a) => (a.media === "video" || (a.videoUrl && a.videoUrl.trim())) && a.image);
  const mainVideo = videoArticles.length > 0 ? (selectedVideo || videoArticles[0]) : null;
  const suggestions = mainVideo ? videoArticles.filter((v) => v.id !== mainVideo.id).slice(0, 5) : [];
  const embedUrl = useMemo(() => getVideoEmbedUrl(mainVideo?.videoUrl), [mainVideo?.videoUrl]);

  if (!mainVideo && !youtubeChannelUrl) return null;

  const toggleLike = () => {
    setLiked((v) => !v);
    setLikeCount((v) => liked ? v - 1 : v + 1);
  };

  const handleSelectSuggestion = (video) => {
    setSelectedVideo(video);
    setShowVideo(false);
  };

  return (
    <section className="video-section">
      <div className="container">
        <div className="video-section-header">
          <span className="video-section-title">
            <Play size={20} /> Video / Live News
          </span>
        </div>

        <AdSlot slot="video-top-ad" label="Video Section Ad" compact />

        <div className="video-layout">
          {mainVideo ? (
            <>
              <div className="video-main">
                {showVideo && isFacebookUrl(mainVideo.videoUrl) ? (
                  <div className="video-player">
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", background: "#1877f2", color: "#fff", padding: "24px", textAlign: "center", position: "absolute", inset: 0 }}>
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="white" style={{ marginBottom: "16px" }}><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                      <p style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>Facebook Video</p>
                      <a href={mainVideo.videoUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "12px 24px", background: "#fff", color: "#1877f2", borderRadius: "8px", fontWeight: 600, textDecoration: "none", fontSize: "15px" }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877f2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        Watch on Facebook
                      </a>
                    </div>
                  </div>
                ) : embedUrl && showVideo ? (
                  <div className="video-player">
                    <iframe
                      src={embedUrl}
                      title={mainVideo.title}
                      frameBorder="0"
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                      style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}
                    />
                  </div>
                ) : (
                  <div
                    className="video-player clickable"
                    onClick={() => {
                      if (embedUrl) setShowVideo(true);
                      else if (isFacebookUrl(mainVideo.videoUrl)) setShowVideo(true);
                      else navigate("/news/" + getTitleSlug(mainVideo));
                    }}
                  >
                    <ArticleImage article={mainVideo} alt={mainVideo.title} className="video-thumbnail" />
                    {isFacebookUrl(mainVideo.videoUrl) ? (
                      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "72px", height: "72px", background: "#1877f2", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 5 }}>
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                      </div>
                    ) : (
                      <div className="video-play-overlay">
                        <Play size={48} />
                      </div>
                    )}
                    <span className="video-duration">{mainVideo.videoUrl ? "Watch" : "Live"}</span>
                  </div>
                )}
                <h3 className="video-title">{mainVideo.title}</h3>
                <div className="video-meta">
                  <span className="video-date"><Clock size={14} /> {mainVideo.date}</span>
                  <button className={`video-like-btn ${liked ? "liked" : ""}`} onClick={toggleLike}>
                    <ThumbsUp size={18} fill={liked ? "#bd1d25" : "none"} />
                    <span>{likeCount}</span>
                  </button>
                </div>
                <p className="video-excerpt">{mainVideo.excerpt}</p>
              </div>

              <aside className="video-suggestions">
                <h4>Suggestions</h4>
                {suggestions.map((video) => (
                  <div
                    key={video.id}
                    className="suggestion-card clickable"
                    onClick={() => handleSelectSuggestion(video)}
                  >
                    <div className="suggestion-thumb">
                      <ArticleImage article={video} alt={video.title} className="suggestion-img" />
                      <span className="suggestion-duration">{video.videoUrl ? "Watch" : "Live"}</span>
                    </div>
                    <div className="suggestion-info">
                      <h5>{video.title}</h5>
                      <small>{video.date}</small>
                    </div>
                  </div>
                ))}
                {youtubeChannelUrl && (
                  <div className="video-youtube-suggestion">
                    <h5>YouTube</h5>
                    <a href={youtubeChannelUrl} target="_blank" rel="noopener noreferrer" className="youtube-channel-link">
                      <Youtube size={20} />
                      <span>Visit our channel</span>
                    </a>
                  </div>
                )}
              </aside>
            </>
          ) : (
            <div className="video-main" style={{ width: "100%" }}>
              {youtubeChannelUrl && (
                <div className="video-youtube-suggestion" style={{ textAlign: "center", padding: "40px 0" }}>
                  <h4 style={{ marginBottom: "16px" }}>Watch our videos on YouTube</h4>
                  <a href={youtubeChannelUrl} target="_blank" rel="noopener noreferrer" className="youtube-channel-link" style={{ fontSize: "18px" }}>
                    <Youtube size={24} />
                    <span>Visit our channel</span>
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
