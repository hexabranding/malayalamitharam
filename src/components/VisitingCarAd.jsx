import { useState, useEffect } from "react";
import { ImageIcon } from "lucide-react";
import { useAds } from "../context/AdsContext.jsx";
import { resolveImageUrl } from "../services/images.jsx";

const SLIDE_INTERVAL = 3000;

export default function VisitingCarAd({ slot = "article-part-1", label = "In-Article Ad" }) {
  const ads = useAds(slot);
  const slides = ads.filter(ad => resolveImageUrl(ad?.image));
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % slides.length);
    }, SLIDE_INTERVAL);
    return () => clearInterval(interval);
  }, [slides.length]);

  if (slides.length === 0) {
    return (
      <div className="visiting-car-ad visiting-car-empty">
        <ImageIcon className="visiting-car-empty-icon" size={28} />
        <span>{label}</span>
        <strong>Ad Space</strong>
        <small>300 x 250</small>
      </div>
    );
  }

  const safeIndex = activeIndex >= slides.length ? 0 : activeIndex;

  return (
    <div className="visiting-car-ad">
      <div className="visiting-car-track" style={{ transform: `translateX(-${safeIndex * 100}%)` }}>
        {slides.map((ad, i) => {
          const url = resolveImageUrl(ad?.image);
          if (!url) return null;
          const image = (
            <img src={url} alt={ad.title || "Ad"} className="visiting-car-image" loading="lazy" />
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
    </div>
  );
}
