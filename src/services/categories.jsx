import { API_BASE } from "./api.js";

let cachedCategories = null;
let cachePromise = null;
let slugToName = {};

const MALAYALAM_MAP = {
  kerala: "കേരളം", india: "ഇന്ത്യ", world: "ലോകം", gulf: "ഗൾഫ്",
  sports: "കായികം", cinema: "സിനിമ", politics: "രാഷ്ട്രീയം", opinion: "അഭിപ്രായം",
  business: "ബിസിനസ്", technology: "സാങ്കേതികം", health: "ആരോഗ്യം",
  education: "വിദ്യാഭ്യാസം", entertainment: "വിനോദം", lifestyle: "ലൈഫ് സ്റ്റൈൽ",
  photos: "ഫോട്ടോസ്", video: "വീഡിയോ", "middle east": "മധ്യപൂർവ്വേഷ്യ",
  "saudi arabia": "സൗദി അറേബ്യ", uae: "യുഎഇ", kuwait: "കുവൈത്ത്",
  bahrain: "ബഹ്റൈൻ", oman: "ഒമാൻ", qatar: "ഖത്തർ", cricket: "ക്രിക്കറ്റ്",
  football: "ഫുട്ബോൾ", olympics: "ഒളിമ്പിക്സ്", europe: "യൂറോപ്പ്",
  uk: "യുകെ", us: "യുഎസ്", community: "കമ്മ്യൂണിറ്റി",
  "editorial choice": "എഡിറ്റോറിയൽ ചോയ്‌സ്", "current affairs": "കറന്റ് അഫയേഴ്സ്",
  interview: "അഭിമുഖം", lekhanam: "ലേഖനം",
  "tv serial": "ടിവി സീരിയൽ", "web series": "വെബ് സീരീസ്", culture: "സംസ്കാരം",
  viral: "വൈറൽ", automobile: "ഓട്ടോബൈൽ", environment: "പരിസ്ഥിതി",
  food: "ഭക്ഷണം", travel: "യാത്ര", beauty: "സൗന്ദര്യം",
  "photo gallery": "ഫോട്ടോ ഗാലറി", podcast: "പോഡ്‌കാസ്റ്റ്",
  onam: "ഓണം", christmas: "ക്രിസ്മസ്", eid: "ঈദ്",
};

function looksLikeSlug(text) {
  return text && /^new-\d{10,}/.test(text);
}

function buildSlugMap(groups) {
  const map = {};
  for (const g of groups) {
    if (g.label) {
      map[g.slug] = g.titleMl || g.label;
      map[g.id] = g.titleMl || g.label;
    }
    for (const c of (g.children || [])) {
      if (c.label) {
        map[c.slug] = c.titleMl || c.label;
        map[c.id] = c.titleMl || c.label;
      }
    }
  }
  return map;
}

async function fetchAll() {
  if (cachedCategories) return cachedCategories;
  if (cachePromise) return cachePromise;
  cachePromise = fetch(API_BASE + "/categories")
    .then(r => r.ok ? r.json() : [])
    .then(data => {
      cachedCategories = Array.isArray(data) ? data : [];
      slugToName = buildSlugMap(cachedCategories);
      return cachedCategories;
    })
    .catch(() => { cachedCategories = []; return cachedCategories; });
  return cachePromise;
}

export function preloadCategories() {
  fetchAll();
}

export function clearCategoryCache() {
  cachedCategories = null;
  cachePromise = null;
  slugToName = {};
}

export function getCategoryName(article) {
  if (!article) return "";
  const ml = article.categoryMl;
  const cat = article.category;

  if (ml && !looksLikeSlug(ml)) return ml;

  if (cat && slugToName[cat]) return slugToName[cat];

  if (ml && slugToName[ml]) return slugToName[ml];

  if (cat && MALAYALAM_MAP[cat.toLowerCase()]) return MALAYALAM_MAP[cat.toLowerCase()];
  if (ml && MALAYALAM_MAP[ml.toLowerCase()]) return MALAYALAM_MAP[ml.toLowerCase()];

  if (looksLikeSlug(ml)) return "";
  return ml || "";
}
