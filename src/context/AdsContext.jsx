import { createContext, useContext, useState, useEffect } from "react";

const AdsContext = createContext({});

async function fetchAllActiveAds() {
  const res = await fetch("https://api.malayalamitharam.in/api/ads");
  if (!res.ok) return {};
  const data = await res.json();
  if (!Array.isArray(data)) return {};
  const map = {};
  data.forEach(a => { if (a.slot && a.active !== false) map[a.slot] = a; });
  return map;
}

export function AdsProvider({ children }) {
  const [ads, setAds] = useState({});

  useEffect(() => {
    fetchAllActiveAds().then(data => {
      if (data && typeof data === "object") setAds(data);
    }).catch(() => {});

    function refresh() {
      fetchAllActiveAds().then(data => {
        if (data && typeof data === "object") setAds(data);
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
