import { useState, useEffect } from "react";

const API_BASE = (import.meta.env.VITE_API_URL || "https://api.malayalamitharam.in/api").replace(/\/api\/?$/, "");

const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' fill='%23e8e8e8'%3E%3Crect width='600' height='400'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-size='18'%3ENo Photo%3C/text%3E%3C/svg%3E";

export function resolveImageUrl(image) {
  if (!image) return null;
  if (image.startsWith("http") || image.startsWith("data:")) return image;
  if (image.startsWith("/uploads/") || image.startsWith("uploads/")) {
    const path = image.startsWith("/") ? image : "/" + image;
    return API_BASE + path;
  }
  if (image.startsWith("/")) return image;
  return "/images/" + image;
}

export function ArticleImage({ article, className, alt, style }) {
  const [missing, setMissing] = useState(false);
  const [src, setSrc] = useState(() => {
    const resolved = resolveImageUrl(article?.image);
    return resolved || "";
  });

  useEffect(() => {
    const resolved = resolveImageUrl(article?.image);
    setSrc(resolved || "");
    setMissing(!resolved);
  }, [article?.image]);

  function handleError() {
    setSrc(PLACEHOLDER);
  }

  if (missing || !src) {
    return (
      <img
        src={PLACEHOLDER}
        alt={alt || "No photo"}
        className={className}
        style={style}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt || ""}
      className={className}
      style={style}
      onError={handleError}
      loading="lazy"
    />
  );
}
