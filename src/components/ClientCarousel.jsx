import { useState, useEffect, useRef } from "react";
import { ImageIcon } from "lucide-react";
import { useAds } from "../context/AdsContext.jsx";
import { resolveImageUrl } from "../services/images.jsx";

const SLIDE_INTERVAL = 3500;
const TRANSITION_MS = 450;

export default function ClientCarousel({ slots = ["article-part-1", "article-part-2", "article-part-3"], label = "Sponsored" }) {
  const ads1 = useAds(slots[0]);
  const ads2 = useAds(slots[1]);
  const ads3 = useAds(slots[2]);

  const allAds = [...ads1, ...ads2, ...ads3].filter(ad => resolveImageUrl(ad?.image));
  const total = allAds.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (paused || total <= 1) return;
    timerRef.current = setInterval(() => {
      setIsTransitioning(true);
      setActiveIndex(prev => (prev + 1) % total);
      setTimeout(() => setIsTransitioning(false), TRANSITION_MS);
    }, SLIDE_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [paused, total]);

  const handleMouseEnter = () => setPaused(true);
  const handleMouseLeave = () => setPaused(false);
  const handleTouchStart = () => setPaused(true);
  const handleTouchEnd = () => { setTimeout(() => setPaused(false), 100); };

  if (total === 0) {
    return (
      <div className="visiting-car-ad visiting-car-empty">
        <ImageIcon className="visiting-car-empty-icon" size={28} />
        <span>{label}</span>
        <strong>Ad Space</strong>
        <small>300 x 250</small>
      </div>
    );
  }

  const safeIndex = activeIndex >= total ? 0 : activeIndex;

  return (
    <div
      className="visiting-car-ad client-carousel"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="visiting-car-track"
        style={{
          transform: `translateX(-${safeIndex * 100}%)`,
          transition: isTransitioning ? `transform ${TRANSITION_MS}ms ease-in-out` : "none",
        }}
      >
        {allAds.map((ad, i) => {
          const url = resolveImageUrl(ad?.image);
          if (!url) return null;
          const image = (
            <img src={url} alt={ad.title || "Ad"} className="visiting-car-image" />
          );
          return (
            <div key={i} className="visiting-car-slide">
              <div className="visiting-car-card">
                {ad.link ? (
                  <a href={ad.link} target="_blank" rel="noopener noreferrer">{image}</a>
                ) : image}
              </div>
            </div>
          );
        })}
      </div>
      {total > 1 && (
        <div className="client-carousel-dots">
          {allAds.map((_, i) => (
            <span
              key={i}
              className={`client-carousel-dot ${i === safeIndex ? "active" : ""}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
