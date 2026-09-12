import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { resolveImageUrl } from "../services/images.jsx";

export default function ArticleImageCarousel({ images }) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent(prev => (prev + 1) % images.length);
  }, [images.length]);

  const prev = useCallback(() => {
    setCurrent(prev => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (isPaused || images.length <= 1) return;
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [isPaused, next, images.length]);

  if (!images || images.length === 0) return null;

  const showNav = images.length > 1;

  return (
    <div
      className="article-image-carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="article-carousel-track">
        {images.map((img, index) => (
          <div
            key={index}
            className={`article-carousel-slide ${index === current ? "active" : ""}`}
          >
            <img
              src={resolveImageUrl(img.url) || img.url}
              alt={img.caption || ""}
              onError={(e) => { e.target.style.display = "none"; }}
            />
            {img.caption && (
              <div className="article-carousel-caption">{img.caption}</div>
            )}
          </div>
        ))}
      </div>

      {showNav && (
        <>
          <button className="article-carousel-nav prev" onClick={prev} aria-label="Previous image">
            <ChevronLeft size={22} />
          </button>
          <button className="article-carousel-nav next" onClick={next} aria-label="Next image">
            <ChevronRight size={22} />
          </button>
          <div className="article-carousel-dots">
            {images.map((_, index) => (
              <button
                key={index}
                className={`article-carousel-dot ${index === current ? "active" : ""}`}
                onClick={() => setCurrent(index)}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
