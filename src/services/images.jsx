import { useState, useEffect } from "react";

export function resolveImageUrl(image) {
  if (!image) return null;
  if (image.startsWith("http") || image.startsWith("/") || image.startsWith("data:")) return image;
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
    setMissing(true);
    setSrc("");
  }

  if (missing || !src) {
    return (
      <div
        className={["article-image-placeholder", className].filter(Boolean).join(" ")}
        style={style}
        role="img"
        aria-label={alt || "No photo added"}
      >
        <span>No photo added</span>
      </div>
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
