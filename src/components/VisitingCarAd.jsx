import { useState, useEffect } from "react";
import { useAds } from "../context/AdsContext.jsx";
import { resolveImageUrl } from "../services/images.jsx";

const PART_SLOTS = ["article-part-1", "article-part-2", "article-part-3"];
const CAROUSEL_SIZE = 3;

export default function VisitingCarAd() {
  const ads1 = useAds("article-part-1");
  const ads2 = useAds("article-part-2");
  const ads3 = useAds("article-part-3");
  const allAds = [...ads1, ...ads2, ...ads3];
  const totalSlides = Math.ceil(allAds.length / CAROUSEL_SIZE);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    if (totalSlides <= 1) return;
    const interval = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % totalSlides);
    }, 3000);
    return () => clearInterval(interval);
  }, [totalSlides]);

  if (allAds.length === 0) {
    return (
      <div className="visiting-car-ad visiting-car-empty">
        <span>In-Article Ad</span>
        <strong>Ad Space</strong>
        <small>300 x 250</small>
      </div>
    );
  }

  const slides = [];
  for (let i = 0; i < allAds.length; i += CAROUSEL_SIZE) {
    slides.push(allAds.slice(i, i + CAROUSEL_SIZE));
  }

  const currentSlide = slides[activeSlide] || [];

  return (
    <div className="visiting-car-ad">
      <div className="visiting-car-track" style={{ transform: `translateX(-${activeSlide * 100}%)` }}>
        {slides.map((slide, si) => (
          <div key={si} className="visiting-car-slide">
            {slide.map((ad, i) => {
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
        ))}
      </div>
      {totalSlides > 1 && (
        <div className="visiting-car-dots">
          {slides.map((_, i) => (
            <button key={i} type="button" className={`visiting-car-dot ${i === activeSlide ? "active" : ""}`} onClick={() => setActiveSlide(i)} aria-label={`Slide ${i + 1}`} />
          ))}
        </div>
      )}
    </div>
  );
}