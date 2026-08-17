import { useState, useMemo } from "react";
import { ThumbsUp, Play, Clock, Youtube } from "lucide-react";
import { ArticleImage } from "../services/images.jsx";
import { useSettings } from "../context/DataContext.jsx";
import AdSlot from "./AdSlot.jsx";

function getYoutubeEmbedUrl(url) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (match) return `https://www.youtube.com/embed/${match[1]}?autoplay=1`;
  if (url.includes("facebook.com") || url.includes("instagram.com")) return url;
  return url;
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
  const embedUrl = useMemo(() => getYoutubeEmbedUrl(mainVideo?.videoUrl), [mainVideo?.videoUrl]);

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
                {embedUrl && showVideo ? (
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
                      else navigate("/post/" + mainVideo.id);
                    }}
                  >
                    <ArticleImage article={mainVideo} alt={mainVideo.title} className="video-thumbnail" />
                    <div className="video-play-overlay">
                      <Play size={48} />
                    </div>
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
