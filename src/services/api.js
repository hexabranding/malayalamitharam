const BASE = import.meta.env.VITE_API_URL || "https://api.malayalamitharam.in/api";

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

async function request(url, options = {}, timeout = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(BASE + url, { ...options, signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(body.error || "Request failed");
    }
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      throw new Error("API is currently unavailable. Please try again later.");
    }
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

function articlePayload(result) {
  return result?.article || result?.news || result?.data || result;
}

function safeEncode(str) {
  try {
    return encodeURIComponent(decodeURIComponent(str));
  } catch {
    return encodeURIComponent(str);
  }
}

// News / Articles
export async function fetchNews(params = {}) {
  const q = new URLSearchParams();
  if (params.category) q.set("category", params.category);
  if (params.subcategory) q.set("subcategory", params.subcategory);
  if (params.featured !== undefined) q.set("featured", String(params.featured));
  if (params.breaking !== undefined) q.set("breaking", String(params.breaking));
  if (params.search) q.set("search", params.search);
  if (params.limit) q.set("limit", String(params.limit));
  if (params.page) q.set("page", String(params.page));
  const query = q.toString();
  return request("/news" + (query ? "?" + query : ""));
}

export async function fetchArticle(slug) {
  const result = await request("/news/" + safeEncode(slug));
  return articlePayload(result);
}

export async function fetchArticleByTitleSlug(titleSlug) {
  const result = await request("/news/title-slug/" + safeEncode(titleSlug));
  return articlePayload(result);
}

export async function createArticle(data) {
  return request("/news", { method: "POST", headers: headers(), body: JSON.stringify(data) });
}

export async function updateArticle(slug, data) {
  return request("/news/" + safeEncode(slug), { method: "PUT", headers: headers(), body: JSON.stringify(data) });
}

export async function incrementView(slug) {
  return request("/news/" + safeEncode(slug) + "/view", { method: "PATCH" });
}

export async function deleteArticle(slug) {
  return request("/news/" + safeEncode(slug), { method: "DELETE", headers: headers() });
}

// Categories
export async function fetchCategories() {
  return request("/categories");
}

export async function createCategory(data) {
  return request("/categories", { method: "POST", headers: headers(), body: JSON.stringify(data) });
}

export async function updateCategory(id, data) {
  return request("/categories/" + encodeURIComponent(id), { method: "PUT", headers: headers(), body: JSON.stringify(data) });
}

export async function deleteCategory(id) {
  return request("/categories/" + encodeURIComponent(id), { method: "DELETE", headers: headers() });
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
  return request("/tags");
}

export async function createTag(data) {
  return request("/tags", { method: "POST", headers: headers(), body: JSON.stringify(data) });
}

export async function updateTag(id, data) {
  return request("/tags/" + id, { method: "PUT", headers: headers(), body: JSON.stringify(data) });
}

export async function deleteTag(id) {
  return request("/tags/" + id, { method: "DELETE", headers: headers() });
}

// Pages
export async function fetchPages() {
  return request("/pages");
}

export async function createPage(data) {
  return request("/pages", { method: "POST", headers: headers(), body: JSON.stringify(data) });
}

export async function updatePage(id, data) {
  return request("/pages/" + id, { method: "PUT", headers: headers(), body: JSON.stringify(data) });
}

export async function deletePage(id) {
  return request("/pages/" + id, { method: "DELETE", headers: headers() });
}

// Authors
export async function fetchAuthors() {
  return request("/authors");
}

export async function createAuthor(data) {
  return request("/authors", { method: "POST", headers: headers(), body: JSON.stringify(data) });
}

export async function updateAuthor(id, data) {
  return request("/authors/" + id, { method: "PUT", headers: headers(), body: JSON.stringify(data) });
}

export async function deleteAuthor(id) {
  return request("/authors/" + id, { method: "DELETE", headers: headers() });
}

// Settings
function getSettingsCache() {
  try {
    const raw = sessionStorage.getItem("mm_settings_cache");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.time < 5 * 60 * 1000) return parsed.data;
  } catch {}
  return null;
}

function setSettingsCache(data) {
  try {
    sessionStorage.setItem("mm_settings_cache", JSON.stringify({ data, time: Date.now() }));
  } catch {}
}

export function clearSettingsCache() {
  try {
    sessionStorage.removeItem("mm_settings_cache");
  } catch {}
}

export async function fetchSettings() {
  const cached = getSettingsCache();
  if (cached) return cached;
  const data = await request("/settings");
  setSettingsCache(data);
  return data;
}

export async function fetchSettingsAll() {
  return request("/settings/all");
}

export async function updateSetting(key, value) {
  return request("/settings/" + encodeURIComponent(key), { method: "PUT", headers: headers(), body: JSON.stringify({ value }) });
}

export async function seedSettings() {
  return request("/settings/seed", { method: "POST", headers: headers() });
}

// Ads
export async function fetchAds() {
  return request("/ads");
}

export async function fetchAdsAll() {
  return request("/ads/all", { headers: headers() });
}

export async function fetchAdBySlot(slot) {
  return request("/ads/" + encodeURIComponent(slot));
}

export async function fetchAdsBySlots(slots) {
  return request("/ads/batch?slots=" + encodeURIComponent(slots.join(",")));
}

export async function saveAd(data) {
  return request("/ads", { method: "POST", headers: headers(), body: JSON.stringify(data) });
}

export async function deleteAd(slot) {
  return request("/ads/" + encodeURIComponent(slot), { method: "DELETE", headers: headers() });
}

export async function deleteAdById(id) {
  return request("/ads/" + encodeURIComponent(id), { method: "DELETE", headers: headers() });
}

// Upload
export async function uploadImage(file) {
  const formData = new FormData();
  formData.append("image", file);
  const token = getToken();
  const h = {};
  if (token) h["Authorization"] = "Bearer " + token;
  const res = await fetch(BASE + "/upload/image", { method: "POST", headers: h, body: formData });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || body.message || "Upload failed");
  }
  return res.json();
}

export const AD_SLOTS = [
  { slot: "article-top", label: "Article Top Ad (728 x 90)", title: "Article Top Advertisement" },
  { slot: "top-leaderboard", label: "Top Leaderboard (1280 x 250)", title: "Top Leaderboard" },
  { slot: "mid-leaderboard", label: "Mid Leaderboard (1280 x 250)", title: "Mid Leaderboard" },
  { slot: "bottom-leaderboard", label: "Bottom Leaderboard (1280 x 250)", title: "Bottom Leaderboard" },
  { slot: "sidebar", label: "Sidebar (300 x 250)", title: "സൈഡ് ബാർ പരസ്യം" },
  { slot: "category", label: "Category Page Ad", title: "വിഭാഗ പേജ് പരസ്യം" },
  { slot: "article-part-1", label: "In-Article Ad 1 (300 x 250)", title: "ലേഖന പരസ്യം ഭാഗം 1" },
  { slot: "article-part-2", label: "In-Article Ad 2 (300 x 250)", title: "ലേഖന പരസ്യം ഭാഗം 2" },
  { slot: "article-part-3", label: "In-Article Ad 3 (300 x 250)", title: "ലേഖന പരസ്യം ഭാഗം 3" },
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

export const menuGroups = [
  { label: "HOME", slug: "home", path: "/" },
  { label: "NEWS", slug: "news", children: [
    { label: "Kerala", slug: "kerala", titleMl: "കേരളം" },
    { label: "India", slug: "india", titleMl: "ദേശിയം" },
    { label: "World", slug: "world", titleMl: "അന്തർദേശിയം" },
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

function getMenuCache() {
  try {
    const raw = localStorage.getItem("mm_menu_cache");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.time < 5 * 60 * 1000) return parsed.data;
  } catch {}
  return null;
}

function setMenuCache(data) {
  try {
    localStorage.setItem("mm_menu_cache", JSON.stringify({ data, time: Date.now() }));
  } catch {}
}

export function clearMenuCache() {
  localStorage.removeItem("mm_menu_cache");
}

export async function loadMenuGroups() {
  const cached = getMenuCache();
  if (cached) return cached;
  try {
    const data = await fetchCategories();
    if (Array.isArray(data) && data.length > 0) {
      const home = { label: "HOME", slug: "home", path: "/" };
      const result = [home, ...data];
      setMenuCache(result);
      return result;
    }
  } catch {}
  return menuGroups;
}

export async function loadFlatMenuItems() {
  const groups = await loadMenuGroups();
  return groups.flatMap((group) => group.children ? group.children : [group]);
}

export const trendingTags = ["കേരളം", "മഴ", "പ്രവാസി", "എഐ", "ഫുട്ബോൾ", "സിനിമ", "വീട്"];

export const authors = [
  { name: "മലയാളമിത്രം ഡെസ്ക്", role: "ന്യൂസ് ഡെസ്ക്", count: 42 },
  { name: "പ്രവാസി വാർത്താ വിഭാഗം", role: "ഗൾഫ് റിപ്പോർട്ടിംഗ്", count: 28 },
  { name: "സ്പോർട്സ് ഡെസ്ക്", role: "കായിക വാർത്തകൾ", count: 31 },
  { name: "ലൈഫ് സ്റ്റൈൽ ഡെസ്ക്", role: "ആരോഗ്യം, യാത്ര, വീട്", count: 19 },
];
