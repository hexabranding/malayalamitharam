import { useState, useEffect } from "react";
import { useAds } from "../context/AdsContext.jsx";
import { resolveImageUrl } from "../services/images.jsx";

const PART_SLOTS = ["article-part-1", "article-part-2", "article-part-3"];

export default function VisitingCarAd() {
  const allAds = PART_SLOTS.flatMap((slot) => useAds(slot));
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (allAds.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % allAds.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [allAds.length]);

  if (allAds.length === 0) return null;

  const currentAd = allAds[activeIndex];
  const imageUrl = resolveImageUrl(currentAd?.image);

  if (!imageUrl) return null;

  const content = (
    <img
      src={imageUrl}
      alt={currentAd?.title || "Ad"}
      className="visiting-car-image"
      loading="lazy"
    />
  );

  return (
    <div className="visiting-car-ad">
      <div className="visiting-car-slide">
        {currentAd?.link ? (
          <a href={currentAd.link} target="_blank" rel="noopener noreferrer">{content}</a>
        ) : content}
      </div>
      {allAds.length > 1 && (
        <div className="visiting-car-dots">
          {allAds.map((_, i) => (
            <button key={i} type="button" className={`visiting-car-dot ${i === activeIndex ? "active" : ""}`} onClick={() => setActiveIndex(i)} aria-label={`Ad ${i + 1}`} />
          ))}
        </div>
      )}
    </div>
  );
}