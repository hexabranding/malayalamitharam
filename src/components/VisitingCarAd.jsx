import { useState, useEffect } from "react";
import { useAds } from "../context/AdsContext.jsx";
import { resolveImageUrl } from "../services/images.jsx";

const PART_SLOTS = ["article-part-1", "article-part-2", "article-part-3"];

export default function VisitingCarAd() {
  const ads1 = useAds("article-part-1");
  const ads2 = useAds("article-part-2");
  const ads3 = useAds("article-part-3");
  const allAds = [...ads1, ...ads2, ...ads3];
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (allAds.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % allAds.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [allAds.length]);

  if (allAds.length === 0) {
    return (
      <div className="visiting-car-ad visiting-car-empty">
        <span>In-Article Ad</span>
        <strong>Ad Space</strong>
        <small>300 x 250</small>
      </div>
    );
  }

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
      <div className="visiting-car-track" style={{ transform: `translateX(-${activeIndex * 33.33}%)` }}>
        {allAds.map((ad, i) => {
          const url = resolveImageUrl(ad?.image);
          if (!url) return null;
          return (
            <div key={i} className="visiting-car-card">
              {ad.link ? (
                <a href={ad.link} target="_blank" rel="noopener noreferrer">
                  <img src={url} alt={ad.title || "Ad"} className="visiting-car-image" loading="lazy" />
                </a>
              ) : (
                <img src={url} alt={ad.title || "Ad"} className="visiting-car-image" loading="lazy" />
              )}
            </div>
          );
        })}
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