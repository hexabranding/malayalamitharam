import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { resolveImageUrl } from "../services/images.jsx";

function CarouselImage({ article, alt, isActive }) {
  const [missing, setMissing] = useState(false);
  const [src, setSrc] = useState(() => {
    const resolved = resolveImageUrl(article?.image);
    return resolved ? resolved + (resolved.startsWith("/uploads/") ? "?v=" + Date.now() : "") : "";
  });

  useEffect(() => {
    const resolved = resolveImageUrl(article?.image);
    setSrc(resolved ? resolved + (resolved.startsWith("/uploads/") ? "?v=" + Date.now() : "") : "");
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
      loading={isActive ? "eager" : "lazy"}
      fetchpriority={isActive ? "high" : "auto"}
    />
  );
}

export default function NewsCarousel({ articles, navigate }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  const displayArticles = useMemo(() => {
    const featured = articles.filter((article) => article.featured).slice(0, 5);
    return featured.length ? featured : articles.slice(0, 5);
  }, [articles]);

  useEffect(() => {
    if (!autoPlay) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayArticles.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [autoPlay, displayArticles.length]);

  const goToSlide = (index) => {
    setCurrentIndex(index);
    setAutoPlay(false);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % displayArticles.length);
    setAutoPlay(false);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + displayArticles.length) % displayArticles.length);
    setAutoPlay(false);
  };

  if (displayArticles.length === 0) return null;

  return (
    <div className="news-carousel">
      <div className="carousel-container">
        {displayArticles.map((article, index) => (
          <div
            key={article.id}
            className={`carousel-slide ${index === currentIndex ? "active" : ""}`}
            onClick={() => navigate("/post/" + article.id)}
          >
            <CarouselImage article={article} alt={article.title} isActive={index === currentIndex} />
            <div className="carousel-overlay">
              <span className="carousel-category">{article.categoryMl}</span>
              <h2>{article.title}</h2>
              <p>{article.excerpt}</p>
            </div>
          </div>
        ))}
        
        <button className="carousel-btn carousel-prev" onClick={(e) => { e.stopPropagation(); prevSlide(); }}>
          <ChevronLeft size={24} />
        </button>
        <button className="carousel-btn carousel-next" onClick={(e) => { e.stopPropagation(); nextSlide(); }}>
          <ChevronRight size={24} />
        </button>
      </div>

      <div className="carousel-dots">
        {displayArticles.map((_, index) => (
          <button
            key={index}
            className={`carousel-dot ${index === currentIndex ? "active" : ""}`}
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
