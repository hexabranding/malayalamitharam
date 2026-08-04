import { resolveImageUrl } from "../services/images.jsx";
import { useAd, useAds } from "../context/AdsContext.jsx";
import { useState, useEffect } from "react";

export default function AdSlot({ slot, label = "Advertisement", compact = false, slider = false }) {
  const ad = useAd(slot);
  const ads = useAds(slot);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!slider || ads.length <= 1) return;
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % ads.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [slider, ads.length]);

  const currentAd = slider && ads.length ? ads[index] : ad;
  const imageUrl = resolveImageUrl(currentAd?.image);

  if (imageUrl) {
    const content = (
      <img
        src={imageUrl}
        alt={currentAd?.title || label}
        className="ad-slot-image"
      />
    );

    return (
      <section className={slider ? "ad-slot ad-slider has-image" : (compact ? "ad-slot compact-ad has-image" : "ad-slot has-image")} aria-label={label}>
        {slider && ads.length > 1 && (
          <div className="ad-slider-dots">
            {ads.map((_, i) => (
              <button key={i} type="button" className={`ad-dot ${i === index ? "active" : ""}`} onClick={() => setIndex(i)} aria-label={`Ad ${i + 1}`} />
            ))}
          </div>
        )}
        {currentAd?.link ? (
          <a href={currentAd.link} target="_blank" rel="noopener noreferrer">{content}</a>
        ) : content}
      </section>
    );
  }

  return (
      <section className={compact ? "ad-slot compact-ad" : "ad-slot"} aria-label={label}>
      <span>{label}</span>
      <strong>Ad Space</strong>
      <small>{compact ? "300 x 250" : "728 x 90 / 300 x 250"}</small>
    </section>
  );
}
