import { useState, useEffect } from "react";
import AdSlot from "./AdSlot.jsx";

const PART_SLOTS = ["article-part-1", "article-part-2", "article-part-3"];

export default function VisitingCarAd() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % PART_SLOTS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="visiting-car-ad">
      <div className="visiting-car-track" style={{ transform: `translateX(-${activeIndex * 33.33}%)` }}>
        {PART_SLOTS.map((slot, i) => (
          <div key={slot} className="visiting-car-part">
            <AdSlot slot={slot} label={`Article Ad Part ${i + 1} (300 x 250)`} compact slider />
          </div>
        ))}
      </div>
      <div className="visiting-car-dots">
        {PART_SLOTS.map((_, i) => (
          <button key={i} type="button" className={`visiting-car-dot ${i === activeIndex ? "active" : ""}`} onClick={() => setActiveIndex(i)} aria-label={`Ad part ${i + 1}`} />
        ))}
      </div>
    </div>
  );
}