import { useState, useEffect, useMemo } from "react";
import { resolveImageUrl } from "../services/images.jsx";
import { getCategoryName } from "../services/categories.jsx";
import { useSettings } from "../context/DataContext.jsx";

function CarouselImage({ article, alt, isActive }) {
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
  }

  if (missing || !src) {
    return (
      <div className="carousel-image-placeholder" role="img" aria-label={alt || ""} />
    );
  }

  return (
    <img
      src={src}
      alt={alt || ""}
      loading="eager"
      fetchpriority={isActive ? "high" : "auto"}
    />
  );
}

export default function NewsCarousel({ articles, navigate, latestUpdates = [] }) {
  const settings = useSettings();
  const [currentIndex, setCurrentIndex] = useState(0);
  const categoryPad = Number(settings.carousel_category_width ?? 5);

  const displayArticles = useMemo(() => {
    const featured = articles.filter((article) => article.featured).slice(0, 5);
    return featured.length ? featured : articles.slice(0, 5);
  }, [articles]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayArticles.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [displayArticles.length]);

  if (displayArticles.length === 0) return null;

  return (
    <div className="news-carousel-wrapper container">
      <div className="news-carousel-left">
        <div className="carousel-container">
          {displayArticles.map((article, index) => (
            <div
              key={article.id}
              className={`carousel-slide ${index === currentIndex ? "active" : ""}`}
              onClick={() => navigate("/post/" + article.id)}
            >
              <div className="carousel-slide-content">
                <span className="carousel-category" style={{ padding: `2px ${categoryPad}px` }}>{getCategoryName(article)}</span>
                <h2>{article.title}</h2>
              </div>
              <CarouselImage article={article} alt={article.title} isActive={index === currentIndex} />
              {article.excerpt && (
                <p className="carousel-excerpt">{article.excerpt}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="news-carousel-right">
        <div className="latest-updates-header">
          <strong>Latest Updates</strong>
          <button type="button" onClick={() => navigate("/search")}>View all</button>
        </div>
        <div className="latest-updates-scroll">
          <div className="latest-updates-track">
            {[...latestUpdates, ...latestUpdates].map((article, i) => (
              <button key={article.id + "-" + i} type="button" className="latest-update-item" onClick={() => navigate("/post/" + article.id)}>
                <span>{getCategoryName(article)}</span>
                {article.title}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
