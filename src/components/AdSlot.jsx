import { useState, useEffect } from "react";
import { fetchAdBySlot } from "../services/api.js";
import { resolveImageUrl } from "../services/images.jsx";

export default function AdSlot({ slot, label = "Advertisement", compact = false }) {
  const [ad, setAd] = useState(null);

  useEffect(() => {
    if (!slot) return;
    fetchAdBySlot(slot).then(setAd).catch(() => setAd(null));
  }, [slot]);

  useEffect(() => {
    function refresh() {
      if (!slot) return;
      fetchAdBySlot(slot).then(setAd).catch(() => setAd(null));
    }
    window.addEventListener("mm-data-updated", refresh);
    return () => window.removeEventListener("mm-data-updated", refresh);
  }, [slot]);

  const imageUrl = resolveImageUrl(ad?.image);

  if (imageUrl) {
    const content = (
      <img
        src={imageUrl}
        alt={ad?.title || label}
        className="ad-slot-image"
        loading="lazy"
      />
    );

    return (
      <section className={compact ? "ad-slot compact-ad has-image" : "ad-slot has-image"} aria-label={label}>
        {ad?.link ? (
          <a href={ad.link} target="_blank" rel="noopener noreferrer">{content}</a>
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
