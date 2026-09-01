import { useEffect, useRef } from "react";
import { getEmbedUrl, detectPlatform } from "../utils/videoEmbed.js";

export function VideoEmbedContainer({ children }) {
  return (
    <div
      style={{
        width: "100%",
        aspectRatio: "16 / 9",
        maxWidth: "100%",
        overflow: "hidden",
        borderRadius: "12px",
        background: "#000",
        position: "relative",
        margin: "0 auto",
      }}
    >
      <div style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>{children}</div>
    </div>
  );
}

export function UnifiedVideoPlayer({ url, title }) {
  const platform = detectPlatform(url);
  const embedUrl = getEmbedUrl(url);
  const ref = useRef(null);

  useEffect(() => {
    if (platform !== "twitter") return;
    const load = () => {
      if (window.twttr && window.twttr.widgets && ref.current) window.twttr.widgets.load(ref.current);
    };
    if (document.querySelector('script[src="https://platform.twitter.com/widgets.js"]')) {
      load();
      return;
    }
    const s = document.createElement("script");
    s.src = "https://platform.twitter.com/widgets.js";
    s.async = true;
    s.charset = "utf-8";
    s.onload = load;
    document.body.appendChild(s);
  }, [url, platform]);

  if (platform === "twitter") {
    return (
      <div
        ref={ref}
        style={{
          width: "100%",
          height: "100%",
          overflow: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#000",
        }}
      >
        <blockquote className="twitter-tweet" data-dnt="true" style={{ margin: 0, width: "100%", maxWidth: "100%" }}>
          <a href={url}></a>
        </blockquote>
      </div>
    );
  }

  if (!embedUrl) return null;

  return (
    <iframe
      src={embedUrl}
      title={title || "Video"}
      style={{ width: "100%", height: "100%", border: 0 }}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
    />
  );
}
