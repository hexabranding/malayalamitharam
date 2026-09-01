import { useState, useMemo } from "react";
import { ThumbsUp, Play, Clock, Youtube } from "lucide-react";
import { ArticleImage } from "../services/images.jsx";
import { useSettings } from "../context/DataContext.jsx";
import { getTitleSlug } from "../utils/articleStore.js";
import { getEmbedUrl, detectPlatform } from "../utils/videoEmbed.js";
import { VideoEmbedContainer, UnifiedVideoPlayer } from "./VideoEmbedContainer.jsx";
import AdSlot from "./AdSlot.jsx";

export default function VideoSection({ articles, navigate }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(142);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showVideo, setShowVideo] = useState(false);
  const settings = useSettings();
  const youtubeChannelUrl = settings.youtube_url || "";

  const getMainVideoUrl = (v) => v?.videoUrl?.trim() || v?.relatedVideos?.[0]?.videoUrl || "";
  const videoArticlesRaw = articles.filter((a) => (a.media === "video" || (a.videoUrl && a.videoUrl.trim()) || (a.relatedVideos && a.relatedVideos.length > 0)) && a.image);
  const videoArticles = (() => {
    if (videoArticlesRaw.length >= 6) return videoArticlesRaw.slice(0, 6);
    const fill = articles.filter((a) => a.image && !videoArticlesRaw.some((v) => v.id === a.id));
    return [...videoArticlesRaw, ...fill].slice(0, 6);
  })();
  const mainVideo = videoArticles.length > 0 ? (selectedVideo || videoArticles[0]) : null;
  const suggestions = mainVideo ? videoArticles.filter((v) => v.id !== mainVideo.id).slice(0, 5) : videoArticles.slice(0, 5);
  const rawUrl = useMemo(() => getMainVideoUrl(mainVideo), [mainVideo]);
  const embedUrl = useMemo(() => getEmbedUrl(rawUrl), [rawUrl]);
  const platform = useMemo(() => detectPlatform(rawUrl), [rawUrl]);

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
                  platform === "twitter" ? (
                    <div className="video-player" style={{ padding: 0, overflow: "hidden", background: "#000" }}>
                      <VideoEmbedContainer>
                        <UnifiedVideoPlayer url={rawUrl} title={mainVideo.title} />
                      </VideoEmbedContainer>
                    </div>
                  ) : (
                    <div className="video-player">
                      <iframe
                        src={embedUrl + (embedUrl.includes("?") ? "&" : "?") + "autoplay=1"}
                        title={mainVideo.title}
                        frameBorder="0"
                        allow="autoplay; encrypted-media"
                        allowFullScreen
                        style={{ width: "100%", height: "100%", position: "absolute", inset: 0, border: 0 }}
                      />
                    </div>
                  )
                ) : (
                  <div
                    className="video-player clickable"
                    onClick={() => {
                      if (embedUrl) setShowVideo(true);
                      else navigate("/news/" + getTitleSlug(mainVideo));
                    }}
                  >
                    <ArticleImage article={mainVideo} alt={mainVideo.title} className="video-thumbnail" />
                    <div className="video-play-overlay">
                      <Play size={48} />
                    </div>
                    <span className="video-duration">{getMainVideoUrl(mainVideo) ? "Watch" : "Live"}</span>
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
                      <span className="suggestion-duration">{getMainVideoUrl(video) ? "Watch" : "Live"}</span>
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
