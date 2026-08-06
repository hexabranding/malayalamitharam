import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import { useAds } from "../context/AdsContext.jsx";
import { resolveImageUrl } from "../services/images.jsx";

const SLIDE_INTERVAL = 3500;
const TRANSITION_MS = 450;

export default function ClientCarousel({ slots = ["article-part-1", "article-part-2", "article-part-3"], label = "Sponsored" }) {
  const ads1 = useAds(slots[0]);
  const ads2 = useAds(slots[1]);
  const ads3 = useAds(slots[2]);

  const allAds = [...ads1, ...ads2, ...ads3].filter(ad => resolveImageUrl(ad?.image));
  const [visibleCount, setVisibleCount] = useState(3);

  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      setVisibleCount(w <= 640 ? 1 : w <= 1024 ? 2 : 3);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const total = allAds.length;
  const maxIndex = Math.max(0, total - visibleCount);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayIndex, setDisplayIndex] = useState(0);
  const timerRef = useRef(null);

  const goTo = useCallback((idx) => {
    const clamped = Math.max(0, Math.min(idx, maxIndex));
    setIsTransitioning(true);
    setDisplayIndex(clamped);
    setCurrentIndex(clamped);
    setTimeout(() => setIsTransitioning(false), TRANSITION_MS);
  }, [maxIndex]);

  const goNext = useCallback(() => {
    if (currentIndex >= maxIndex) {
      goTo(0);
    } else {
      goTo(currentIndex + 1);
    }
  }, [currentIndex, maxIndex, goTo]);

  const goPrev = useCallback(() => {
    if (currentIndex <= 0) {
      goTo(maxIndex);
    } else {
      goTo(currentIndex - 1);
    }
  }, [currentIndex, maxIndex, goTo]);

  useEffect(() => {
    if (paused || total <= visibleCount) return;
    timerRef.current = setInterval(goNext, SLIDE_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [paused, goNext, total, visibleCount]);

  const handleMouseEnter = () => setPaused(true);
  const handleMouseLeave = () => setPaused(false);
  const handleTouchStart = () => setPaused(true);
  const handleTouchEnd = () => { setTimeout(() => setPaused(false), 100); };

  if (total === 0) {
    return (
      <div className="client-carousel client-carousel-empty">
        <ImageIcon className="client-carousel-empty-icon" size={28} />
        <span>{label}</span>
        <strong>Ad Space</strong>
        <small>300 x 250</small>
      </div>
    );
  }

  const slideWidth = 100 / visibleCount;

  return (
    <div
      className="client-carousel"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <button className="client-carousel-arrow client-carousel-arrow-left" onClick={goPrev} aria-label="Previous">
        <ChevronLeft size={20} />
      </button>

      <div className="client-carousel-viewport">
        <div
          className="client-carousel-track"
          style={{
            transform: `translateX(-${displayIndex * slideWidth}%)`,
            transition: isTransitioning ? `transform ${TRANSITION_MS}ms ease-in-out` : "none",
          }}
        >
          {allAds.map((ad, i) => {
            const url = resolveImageUrl(ad?.image);
            if (!url) return null;
            const card = (
              <div className="client-carousel-card">
                <img src={url} alt={ad.title || "Client"} className="client-carousel-logo" />
              </div>
            );
            return (
              <div key={i} className="client-carousel-slide" style={{ flex: `0 0 ${slideWidth}%` }}>
                {ad.link ? (
                  <a href={ad.link} target="_blank" rel="noopener noreferrer" className="client-carousel-link">{card}</a>
                ) : card}
              </div>
            );
          })}
        </div>
      </div>

      <button className="client-carousel-arrow client-carousel-arrow-right" onClick={goNext} aria-label="Next">
        <ChevronRight size={20} />
      </button>

      {total > visibleCount && (
        <div className="client-carousel-dots">
          {Array.from({ length: maxIndex + 1 }, (_, i) => (
            <button
              key={i}
              className={`client-carousel-dot ${i === currentIndex ? "active" : ""}`}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
