import { useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { resolveImageUrl } from "../services/images.jsx";

const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' fill='%23e8e8e8'%3E%3Crect width='600' height='400'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-size='18'%3ENo Photo%3C/text%3E%3C/svg%3E";

export default function ImageCarousel({ images = [], alt = "", className = "" }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const allImages = images.filter(Boolean);
  const hasMultiple = allImages.length > 1;

  const goTo = useCallback((index) => {
    setCurrentIndex((index + allImages.length) % allImages.length);
  }, [allImages.length]);

  const goPrev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);
  const goNext = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo]);

  useEffect(() => {
    if (!hasMultiple) return;
    const handler = (e) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [hasMultiple, goPrev, goNext]);

  const handleTouchStart = (e) => { setTouchEnd(null); setTouchStart(e.targetTouches[0].clientX); };
  const handleTouchMove = (e) => { setTouchEnd(e.targetTouches[0].clientX); };
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (Math.abs(distance) > 50) {
      if (distance > 0) goNext();
      else goPrev();
    }
  };

  if (allImages.length === 0) {
    return <img src={PLACEHOLDER} alt={alt} className={className} />;
  }

  if (!hasMultiple) {
    return (
      <div className={`detail-image-carousel ${className}`}>
        <div className="detail-image-carousel-slide">
          <img src={resolveImageUrl(allImages[0]) || allImages[0]} alt={alt} />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`detail-image-carousel has-multiple ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="detail-image-carousel-viewport">
        {allImages.map((img, index) => (
          <div
            key={index}
            className={`detail-image-carousel-slide ${index === currentIndex ? "active" : ""}`}
          >
            <img src={resolveImageUrl(img) || img} alt={`${alt} - ${index + 1}`} />
          </div>
        ))}
      </div>

      <button className="detail-image-carousel-btn prev" onClick={goPrev} aria-label="Previous image">
        <ChevronLeft size={24} />
      </button>
      <button className="detail-image-carousel-btn next" onClick={goNext} aria-label="Next image">
        <ChevronRight size={24} />
      </button>

      <div className="detail-image-carousel-dots">
        {allImages.map((_, index) => (
          <button
            key={index}
            className={`detail-image-carousel-dot ${index === currentIndex ? "active" : ""}`}
            onClick={() => goTo(index)}
            aria-label={`Go to image ${index + 1}`}
          />
        ))}
      </div>

      <div className="detail-image-carousel-counter">
        {currentIndex + 1} / {allImages.length}
      </div>
    </div>
  );
}
