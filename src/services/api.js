import { articles as fallbackArticles } from "../data/news.js";

const BASE = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_URL) || "https://api.malayalamitharam.in/api";
let backendAvailable = null;

function cacheSet(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

function cacheGet(key) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
  } catch { return null; }
}

function loadCachedArticles() {
  const saved = cacheGet("mm_articles");
  if (saved && Array.isArray(saved)) {
    fallbackArticles.length = 0;
    fallbackArticles.push(...saved);
  }
}

function saveCachedArticles() {
  cacheSet("mm_articles", fallbackArticles);
  window.dispatchEvent(new CustomEvent("mm-data-updated", { detail: { type: "articles" } }));
}

function articlePayload(result) {
  return result?.article || result?.news || result?.data || result;
}

function articleKey(article) {
  return article?.id || article?.slug || article?._id;
}

function mirrorLocalArticle(article) {
  article = articlePayload(article);
  if (!article || !articleKey(article)) return;
  const key = articleKey(article);
  const entry = { ...article, id: key, slug: article.slug || key };
  const idx = fallbackArticles.findIndex((a) => a.id === key || a.slug === key);
  if (idx === -1) fallbackArticles.unshift(entry);
  else fallbackArticles[idx] = { ...fallbackArticles[idx], ...entry };
  saveCachedArticles();
}

function removeLocalArticle(slug) {
  const idx = fallbackArticles.findIndex((a) => a.id === slug || a.slug === slug);
  if (idx !== -1) {
    fallbackArticles.splice(idx, 1);
    saveCachedArticles();
  }
}

function syncArticlesFromBackend(news) {
  if (!Array.isArray(news) || news.length === 0) return;
  fallbackArticles.length = 0;
  fallbackArticles.push(...news);
  saveCachedArticles();
}

let localAds = cacheGet("mm_ads") || [];
function saveLocalAds() { cacheSet("mm_ads", localAds); }

const defaultSettings = [
  { key: "site_name", value: "Malayalamithram", label: "Site Name", type: "text" },
  { key: "site_tagline", value: "Malayalamithram News", label: "Site Tagline", type: "text" },
  { key: "site_logo", value: "/images/malayalamithram-logo.png", label: "Site Logo", type: "image" },
  { key: "site_banner", value: "/images/malayala-mitra-banner.jpeg", label: "Site Banner", type: "image" },
  { key: "primary_color", value: "#bd1d25", label: "Primary Color", type: "color" },
  { key: "secondary_color", value: "#e6b313", label: "Secondary Color", type: "color" },
  { key: "title_bg_color", value: "#bd1d25", label: "Title Background Color", type: "color" },
  { key: "facebook_url", value: "", label: "Facebook URL", type: "text" },
  { key: "youtube_url", value: "", label: "Youtube URL", type: "text" },
  { key: "twitter_url", value: "", label: "Twitter URL", type: "text" },
  { key: "instagram_url", value: "", label: "Instagram URL", type: "text" },
  { key: "whatsapp_url", value: "", label: "WhatsApp URL", type: "text" },
  { key: "telegram_url", value: "", label: "Telegram URL", type: "text" },
  { key: "linkedin_url", value: "", label: "LinkedIn URL", type: "text" },
  { key: "articles_per_page", value: 12, label: "Articles Per Page", type: "number" },
];

let localSettings = cacheGet("mm_settings") || [];
function saveLocalSettings() { cacheSet("mm_settings", localSettings); }

function mergeSettings(base = [], overrides = []) {
  const map = new Map();
  [...base, ...overrides].forEach((item) => {
    if (item?.key) map.set(item.key, { ...(map.get(item.key) || {}), ...item });
  });
  return Array.from(map.values());
}

function settingsListToObject(settings) {
  return settings.reduce((acc, item) => {
    if (item?.key) acc[item.key] = item.value;
    return acc;
  }, {});
}

loadCachedArticles();

function getToken() {
  try {
    const stored = sessionStorage.getItem("mm_admin");
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.token || null;
    }
  } catch {}
  return null;
}

function headers(extra = {}) {
  const h = { "Content-Type": "application/json", ...extra };
  const token = getToken();
  if (token) h["Authorization"] = "Bearer " + token;
  return h;
}

async function request(url, options = {}) {
  try {
    const res = await fetch(BASE + url, options);
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(body.error || "Request failed");
    }
    return res.json();
  } catch (e) {
    throw e;
  }
}

function filterFallback(params) {
  let result = [...fallbackArticles];
  if (params.category) result = result.filter(a => a.category === params.category);
  if (params.featured !== undefined) result = result.filter(a => String(a.featured) === params.featured);
  if (params.breaking !== undefined) result = result.filter(a => String(a.breaking) === params.breaking);
  if (params.search) {
    const q = params.search.toLowerCase();
    result = result.filter(a => (a.title + a.excerpt + a.tags.join(" ")).toLowerCase().includes(q));
  }
  if (params.limit) result = result.slice(0, Number(params.limit));
  return { news: result, total: result.length };
}

async function withFallback(apiCall, fallbackFn) {
  if (backendAvailable === false) return fallbackFn();
  try {
    const result = await apiCall();
    if (backendAvailable === null) backendAvailable = true;
    return result;
  } catch {
    backendAvailable = false;
    return fallbackFn();
  }
}

// News / Articles
export async function fetchNews(params = {}) {
  return withFallback(async () => {
    const q = new URLSearchParams();
    if (params.category) q.set("category", params.category);
    if (params.subcategory) q.set("subcategory", params.subcategory);
    if (params.featured !== undefined) q.set("featured", String(params.featured));
    if (params.breaking !== undefined) q.set("breaking", String(params.breaking));
    if (params.search) q.set("search", params.search);
    if (params.limit) q.set("limit", String(params.limit));
    if (params.page) q.set("page", String(params.page));
    const query = q.toString();
    const result = await request("/news" + (query ? "?" + query : ""));
    if (result?.news?.length) syncArticlesFromBackend(result.news);
    return result;
  }, () => filterFallback(params));
}

export async function fetchArticle(slug) {
  return withFallback(
    () => request("/news/" + encodeURIComponent(slug)),
    () => {
      const found = fallbackArticles.find(a => a.id === slug);
      if (!found) throw new Error("Article not found");
      return { ...found, id: found.id, slug: found.id };
    }
  );
}

export async function createArticle(data) {
  const result = await request("/news", { method: "POST", headers: headers(), body: JSON.stringify(data) });
  const saved = articlePayload(result) || {};
  const localId = saved.id || saved._id || saved.slug || data.id || data.slug || "article-" + Date.now();
  mirrorLocalArticle({ ...data, ...saved, id: localId, slug: saved.slug || localId });
  return result;
}

export async function updateArticle(slug, data) {
  const result = await request("/news/" + encodeURIComponent(slug), { method: "PUT", headers: headers(), body: JSON.stringify(data) });
  const saved = articlePayload(result);
  mirrorLocalArticle({ ...data, ...saved, id: saved?.id || saved?._id || slug, slug: saved?.slug || slug });
  return result;
}

export async function incrementView(slug) {
  return withFallback(
    () => request("/news/" + encodeURIComponent(slug) + "/view", { method: "PATCH" }),
    () => {
      const idx = fallbackArticles.findIndex(a => a.id === slug);
      if (idx !== -1) {
        fallbackArticles[idx] = { ...fallbackArticles[idx], views: (fallbackArticles[idx].views || 0) + 1 };
        saveCachedArticles();
      }
      return { views: idx !== -1 ? fallbackArticles[idx].views : 1 };
    }
  );
}

export async function deleteArticle(slug) {
  const result = await request("/news/" + encodeURIComponent(slug), { method: "DELETE", headers: headers() });
  removeLocalArticle(slug);
  return result;
}

// Categories
export async function fetchCategories() {
  return withFallback(
    () => request("/categories"),
    () => fallbackCategories
  );
}

export async function createCategory(data) {
  return withFallback(
    () => request("/categories", { method: "POST", headers: headers(), body: JSON.stringify(data) }),
    () => data
  );
}

export async function updateCategory(id, data) {
  return withFallback(
    () => request("/categories/" + encodeURIComponent(id), { method: "PUT", headers: headers(), body: JSON.stringify(data) }),
    () => data
  );
}

export async function deleteCategory(id) {
  return withFallback(
    () => request("/categories/" + encodeURIComponent(id), { method: "DELETE", headers: headers() }),
    () => ({ message: "Category deleted" })
  );
}

// Auth
export async function login(username, password) {
  return request("/auth/login", { method: "POST", headers: headers(), body: JSON.stringify({ username, password }) });
}

export async function fetchMe() {
  return request("/auth/me", { headers: headers() });
}

// Tags
export async function fetchTags() {
  return withFallback(
    () => request("/tags"),
    () => trendingTags.map(t => ({ name: t, slug: t }))
  );
}

export async function createTag(data) {
  return withFallback(
    () => request("/tags", { method: "POST", headers: headers(), body: JSON.stringify(data) }),
    () => data
  );
}

export async function updateTag(id, data) {
  return withFallback(
    () => request("/tags/" + id, { method: "PUT", headers: headers(), body: JSON.stringify(data) }),
    () => data
  );
}

export async function deleteTag(id) {
  return withFallback(
    () => request("/tags/" + id, { method: "DELETE", headers: headers() }),
    () => ({ message: "Tag deleted" })
  );
}

// Pages
export async function fetchPages() {
  return withFallback(() => request("/pages"), () => []);
}

export async function createPage(data) {
  return withFallback(
    () => request("/pages", { method: "POST", headers: headers(), body: JSON.stringify(data) }),
    () => data
  );
}

export async function updatePage(id, data) {
  return withFallback(
    () => request("/pages/" + id, { method: "PUT", headers: headers(), body: JSON.stringify(data) }),
    () => data
  );
}

export async function deletePage(id) {
  return withFallback(
    () => request("/pages/" + id, { method: "DELETE", headers: headers() }),
    () => ({ message: "Page deleted" })
  );
}

// Authors
export async function fetchAuthors() {
  return withFallback(() => request("/authors"), () => authors);
}

export async function createAuthor(data) {
  return withFallback(
    () => request("/authors", { method: "POST", headers: headers(), body: JSON.stringify(data) }),
    () => data
  );
}

export async function updateAuthor(id, data) {
  return withFallback(
    () => request("/authors/" + id, { method: "PUT", headers: headers(), body: JSON.stringify(data) }),
    () => data
  );
}

export async function deleteAuthor(id) {
  return withFallback(
    () => request("/authors/" + id, { method: "DELETE", headers: headers() }),
    () => ({ message: "Author deleted" })
  );
}

// Settings
export async function fetchSettings() {
  const localObject = settingsListToObject(mergeSettings(defaultSettings, localSettings));
  return withFallback(async () => {
    const remote = await request("/settings");
    return { ...remote, ...localObject };
  }, () => localObject);
}

export async function fetchSettingsAll() {
  return withFallback(async () => {
    const remote = await request("/settings/all");
    return mergeSettings(defaultSettings, mergeSettings(Array.isArray(remote) ? remote : [], localSettings));
  }, () => mergeSettings(defaultSettings, localSettings));
}

export async function updateSetting(key, value) {
  const existing = mergeSettings(defaultSettings, localSettings);
  const idx = existing.findIndex((setting) => setting.key === key);
  const entry = { ...(idx === -1 ? { key, label: key, type: "text" } : existing[idx]), value };
  if (idx === -1) existing.push(entry);
  else existing[idx] = entry;
  localSettings = existing;
  saveLocalSettings();

  return withFallback(
    () => request("/settings/" + encodeURIComponent(key), { method: "PUT", headers: headers(), body: JSON.stringify({ value }) }),
    () => ({ key, value })
  );
}

export async function seedSettings() {
  localSettings = mergeSettings(defaultSettings, localSettings);
  saveLocalSettings();
  return withFallback(
    () => request("/settings/seed", { method: "POST", headers: headers() }),
    () => ({ message: "Settings seeded" })
  );
}

// Ads
export async function fetchAds() {
  return withFallback(
    async () => {
      const remote = await request("/ads");
      const merged = mergeAds(remote, localAds);
      return merged.filter((a) => a.active !== false);
    },
    () => localAds.filter((a) => a.active !== false)
  );
}

export async function fetchAdsAll() {
  return withFallback(
    async () => {
      const remote = await request("/ads/all", { headers: headers() });
      return mergeAds(remote, localAds);
    },
    () => localAds
  );
}

export async function fetchAdBySlot(slot) {
  const local = localAds.find((a) => a.slot === slot && a.active !== false);
  if (local) return local;
  return withFallback(
    () => request("/ads/" + encodeURIComponent(slot)),
    () => localAds.find((a) => a.slot === slot && a.active !== false) || null
  );
}

function mergeAds(remote = [], local = []) {
  const map = new Map();
  [...remote, ...local].forEach((item) => {
    if (item?.slot) map.set(item.slot, { ...(map.get(item.slot) || {}), ...item });
  });
  return Array.from(map.values());
}

export async function saveAd(data) {
  const result = await withFallback(
    () => request("/ads", { method: "POST", headers: headers(), body: JSON.stringify(data) }),
    () => {
      const idx = localAds.findIndex((a) => a.slot === data.slot);
      const entry = { ...data, id: data.slot, active: data.active !== false };
      if (idx === -1) localAds.push(entry);
      else localAds[idx] = { ...localAds[idx], ...entry };
      saveLocalAds();
      return entry;
    }
  );
  const idx = localAds.findIndex((a) => a.slot === data.slot);
  const entry = { ...data, ...result, id: result?.id || data.slot, active: data.active !== false };
  if (idx === -1) localAds.push(entry);
  else localAds[idx] = { ...localAds[idx], ...entry };
  saveLocalAds();
  window.dispatchEvent(new CustomEvent("mm-data-updated", { detail: { type: "ads" } }));
  return result;
}

export async function deleteAd(slot) {
  const result = await withFallback(
    () => request("/ads/" + encodeURIComponent(slot), { method: "DELETE", headers: headers() }),
    () => {
      localAds = localAds.filter((a) => a.slot !== slot);
      saveLocalAds();
      return { message: "Ad deleted" };
    }
  );
  localAds = localAds.filter((a) => a.slot !== slot);
  saveLocalAds();
  window.dispatchEvent(new CustomEvent("mm-data-updated", { detail: { type: "ads" } }));
  return result;
}

// Upload
export async function uploadImage(file) {
  const formData = new FormData();
  formData.append("image", file);
  const token = getToken();
  const h = {};
  if (token) h["Authorization"] = "Bearer " + token;

  try {
    const res = await fetch(BASE + "/upload/image", { method: "POST", headers: h, body: formData });
    if (!res.ok) throw new Error("Upload failed");
    return res.json();
  } catch {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const MAX_W = 1920;
          let w = img.width, h = img.height;
          if (w > MAX_W) { h = h * MAX_W / w; w = MAX_W; }
          const c = document.createElement("canvas");
          c.width = w; c.height = h;
          const ctx = c.getContext("2d");
          ctx.drawImage(img, 0, 0, w, h);
          resolve({ url: c.toDataURL("image/jpeg", 0.85) });
        };
        img.onerror = reject;
        img.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

export const AD_SLOTS = [
  { slot: "top-leaderboard", label: "Top Leaderboard (1280 x 250)", title: "Top Leaderboard" },
  { slot: "mid-leaderboard", label: "Mid Leaderboard (1280 x 250)", title: "Mid Leaderboard" },
  { slot: "bottom-leaderboard", label: "Bottom Leaderboard (1280 x 250)", title: "Bottom Leaderboard" },
  { slot: "sidebar", label: "Sidebar (300 x 250)", title: "സൈഡ് ബാർ പരസ്യം" },
  { slot: "category", label: "Category Page Ad", title: "വിഭാഗ പേജ് പരസ്യം" },
  { slot: "article", label: "In-Article Ad (300 x 250)", title: "ലേഖന പരസ്യം" },
  { slot: "search", label: "Search Page Ad", title: "തിരച്ചിൽ പേജ് പരസ്യം" },
  { slot: "search-bottom", label: "Search Bottom Ad", title: "തിരച്ചിൽ ചുവടെ" },
  { slot: "tags", label: "Tags Page Ad", title: "ടാഗ് പേജ് പരസ്യം" },
  { slot: "media", label: "Media Page Ad", title: "മീഡിയ പേജ് പരസ്യം" },
  { slot: "page", label: "Info Page Ad", title: "ഇൻഫോ പേജ് പരസ്യം" },
  { slot: "video-top-ad", label: "Video Section Ad (728 x 90)", title: "Video Section Ad" },
  { slot: "home-footer-ad-1", label: "Home Before Footer Ad 1 (300 x 160)", title: "Home Footer Ad 1" },
  { slot: "home-footer-ad-2", label: "Home Before Footer Ad 2 (300 x 160)", title: "Home Footer Ad 2" },
  { slot: "home-footer-ad-3", label: "Home Before Footer Ad 3 (300 x 160)", title: "Home Footer Ad 3" },
];

const fallbackCategories = [
  { id: "kerala", label: "കേരളം", slug: "kerala", count: 3 },
  { id: "india", label: "ഇന്ത്യ", slug: "india", count: 3 },
  { id: "world", label: "ലോകം", slug: "world", count: 3 },
  { id: "business", label: "ബിസിനസ്", slug: "business", count: 2 },
  { id: "politics", label: "രാഷ്ട്രീയം", slug: "politics", count: 2 },
  { id: "cinema", label: "സിനിമ", slug: "cinema", count: 2 },
  { id: "pravasi", label: "പ്രവാസി", slug: "pravasi", count: 2 },
  { id: "uae", label: "യുഎഇ", slug: "uae", count: 2 },
  { id: "football", label: "ഫുട്ബോൾ", slug: "football", count: 2 },
  { id: "cricket", label: "ക്രിക്കറ്റ്", slug: "cricket", count: 2 },
  { id: "tech", label: "സാങ്കേതികം", slug: "tech", count: 2 },
  { id: "property", label: "പ്രോപ്പർട്ടി", slug: "property", count: 2 },
  { id: "editorial", label: "എഡിറ്റോറിയൽ", slug: "editorial", count: 2 },
  { id: "health", label: "ആരോഗ്യം", slug: "health", count: 2 },
  { id: "saudi", label: "സൗദി", slug: "saudi", count: 2 },
  { id: "qatar", label: "ഖത്തർ", slug: "qatar", count: 2 },
  { id: "music", label: "സംഗീതം", slug: "music", count: 2 },
  { id: "television", label: "ടെലിവിഷൻ", slug: "television", count: 2 },
  { id: "other-sports", label: "മറ്റ് കായികം", slug: "other-sports", count: 2 },
  { id: "travel", label: "യാത്ര", slug: "travel", count: 2 },
  { id: "food", label: "ഭക്ഷണം", slug: "food", count: 2 },
  { id: "photos", label: "ഫോട്ടോകൾ", slug: "photos", count: 2 },
  { id: "videos", label: "വീഡിയോകൾ", slug: "videos", count: 2 },
  { id: "audio", label: "ഓഡിയോ", slug: "audio", count: 2 },
  { id: "veedu-home", label: "വീട്", slug: "veedu-home", count: 2 },
  { id: "garden", label: "തോട്ടം", slug: "garden", count: 2 },
  { id: "opinion", label: "അഭിപ്രായം", slug: "opinion", count: 2 },
  { id: "readers", label: "വായനക്കാർ", slug: "readers", count: 2 },
  { id: "education", label: "വിദ്യാഭ്യാസം", slug: "education", count: 2 },
];

export const menuGroups = [
  { label: "HOME", slug: "home", path: "/" },
  { label: "NEWS", slug: "news", children: [
    { label: "Kerala", slug: "kerala", titleMl: "കേരളം" },
    { label: "India", slug: "india", titleMl: "ഇന്ത്യ" },
    { label: "World", slug: "world", titleMl: "ലോകം" },
    { label: "Politics", slug: "politics", titleMl: "രാഷ്ട്രീയം" },
  ]},
  { label: "GULF", slug: "gulf", children: [
    { label: "UAE", slug: "uae", titleMl: "യുഎഇ" },
    { label: "Saudi", slug: "saudi", titleMl: "സൗദി" },
    { label: "Qatar", slug: "qatar", titleMl: "ഖത്തർ" },
    { label: "Pravasi", slug: "pravasi", titleMl: "പ്രവാസി" },
  ]},
  { label: "ENTERTAINMENT", slug: "entertainment", children: [
    { label: "Cinema", slug: "cinema", titleMl: "സിനിമ" },
    { label: "Music", slug: "music", titleMl: "സംഗീതം" },
    { label: "Television", slug: "television", titleMl: "ടെലിവിഷൻ" },
  ]},
  { label: "SPORTS", slug: "sports", children: [
    { label: "Football", slug: "football", titleMl: "ഫുട്ബോൾ" },
    { label: "Cricket", slug: "cricket", titleMl: "ക്രിക്കറ്റ്" },
    { label: "Other Sports", slug: "other-sports", titleMl: "മറ്റ് കായികം" },
  ]},
  { label: "LIFE STYLE", slug: "life-style", children: [
    { label: "Health", slug: "health", titleMl: "ആരോഗ്യം" },
    { label: "Travel", slug: "travel", titleMl: "യാത്ര" },
    { label: "Food", slug: "food", titleMl: "ഭക്ഷണം" },
  ]},
  { label: "MULTI MEDIA", slug: "multi-media", children: [
    { label: "Photos", slug: "photos", titleMl: "ഫോട്ടോകൾ", mediaType: "photo" },
    { label: "Videos", slug: "videos", titleMl: "വീഡിയോകൾ", mediaType: "video" },
    { label: "Audio", slug: "audio", titleMl: "ഓഡിയോ", mediaType: "audio" },
  ]},
  { label: "VEEDU", slug: "veedu", children: [
    { label: "Home", slug: "veedu-home", titleMl: "വീട്" },
    { label: "Property", slug: "property", titleMl: "പ്രോപ്പർട്ടി" },
    { label: "Garden", slug: "garden", titleMl: "തോട്ടം" },
  ]},
  { label: "COLUMN", slug: "column", children: [
    { label: "Opinion", slug: "opinion", titleMl: "അഭിപ്രായം" },
    { label: "Editorial", slug: "editorial", titleMl: "എഡിറ്റോറിയൽ" },
    { label: "Readers", slug: "readers", titleMl: "വായനക്കാർ" },
  ]},
  { label: "MORE", slug: "more", children: [
    { label: "Business", slug: "business", titleMl: "ബിസിനസ്" },
    { label: "Tech", slug: "tech", titleMl: "സാങ്കേതികം" },
    { label: "Education", slug: "education", titleMl: "വിദ്യാഭ്യാസം" },
    { label: "Contact", slug: "contact", path: "/contact", titleMl: "ബന്ധപ്പെടുക" },
    { label: "Author", slug: "author", path: "/author", titleMl: "ലേഖകർ" },
  ]},
];

export const flatMenuItems = menuGroups.flatMap((group) => group.children ? group.children : [group]);

export const trendingTags = ["കേരളം", "മഴ", "പ്രവാസി", "എഐ", "ഫുട്ബോൾ", "സിനിമ", "വീട്"];

// Sync from other tabs via localStorage cross-tab events
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === "mm_articles" && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        fallbackArticles.length = 0;
        fallbackArticles.push(...parsed);
      } catch {}
      window.dispatchEvent(new CustomEvent("mm-data-updated", { detail: { type: "articles" } }));
    } else if (e.key === "mm_ads" && e.newValue) {
      try { localAds = JSON.parse(e.newValue); } catch {}
      window.dispatchEvent(new CustomEvent("mm-data-updated", { detail: { type: "ads" } }));
    } else if (e.key === "mm_settings" && e.newValue) {
      try { localSettings = JSON.parse(e.newValue); } catch {}
      window.dispatchEvent(new CustomEvent("mm-data-updated", { detail: { type: "settings" } }));
    }
  });
}

export const authors = [
  { name: "മലയാളമിത്രം ഡെസ്ക്", role: "ന്യൂസ് ഡെസ്ക്", count: 42 },
  { name: "പ്രവാസി വാർത്താ വിഭാഗം", role: "ഗൾഫ് റിപ്പോർട്ടിംഗ്", count: 28 },
  { name: "സ്പോർട്സ് ഡെസ്ക്", role: "കായിക വാർത്തകൾ", count: 31 },
  { name: "ലൈഫ് സ്റ്റൈൽ ഡെസ്ക്", role: "ആരോഗ്യം, യാത്ര, വീട്", count: 19 },
];
