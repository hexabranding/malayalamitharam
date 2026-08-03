import { createContext, useContext, useState, useEffect } from "react";
import { fetchAdsBySlots } from "../services/api.js";

const AdsContext = createContext({});

const ALL_AD_SLOTS = [
  "top-leaderboard", "mid-leaderboard", "bottom-leaderboard",
  "sidebar", "article", "article-top", "video-top-ad",
  "home-footer-ad-1", "home-footer-ad-2", "home-footer-ad-3",
  "search", "search-bottom", "tags", "media", "page", "category"
];

export function AdsProvider({ children }) {
  const [ads, setAds] = useState({});

  useEffect(() => {
    fetchAdsBySlots(ALL_AD_SLOTS).then(data => {
      if (data && typeof data === "object" && !Array.isArray(data)) setAds(data);
    }).catch(() => {});

    function refresh() {
      fetchAdsBySlots(ALL_AD_SLOTS).then(data => {
        if (data && typeof data === "object" && !Array.isArray(data)) setAds(data);
      }).catch(() => {});
    }
    window.addEventListener("mm-data-updated", refresh);
    return () => window.removeEventListener("mm-data-updated", refresh);
  }, []);

  return (
    <AdsContext.Provider value={ads}>
      {children}
    </AdsContext.Provider>
  );
}

export function useAd(slot) {
  const ads = useContext(AdsContext);
  return ads[slot] || null;
}
