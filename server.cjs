process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err.message);
});
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err.message || err);
});

require("dotenv").config();
const express = require("express");
const compression = require("compression");
const path = require("path");
const cors = require("cors");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 4000;

const distPath = path.join(__dirname, "dist");
const indexPath = path.join(distPath, "index.html");
const indexHtml = fs.readFileSync(indexPath, "utf-8");

const API_BASE = process.env.VITE_API_URL || "https://api.malayalamitharam.in/api";
const SITE_URL = process.env.SITE_URL || "https://malayalamitharam.in";

const CRAWLER_RE = /facebookexternalhit|twitterbot|whatsapp|telegrambot|slackbot|linkedinbot|pinterest|applebot|bingbot|googlebot|yandexbot|duckduckbot/i;

app.use(compression());

const isProduction = process.env.NODE_ENV === "production";
const allowedOrigins = [process.env.FRONTEND_URL, process.env.ALLOWED_ORIGIN, "https://malayalamithram.in", "https://demo.malayalamithram.in", "https://malayalamitharam.in", "https://demo.malayalamitharam.in"].filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || !isProduction || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, true);
  },
  credentials: true,
}));

app.use(express.static(distPath, { index: false }));

function isCrawler(req) {
  const ua = req.headers["user-agent"] || "";
  return CRAWLER_RE.test(ua);
}

function injectMeta(html, title, description, image, url) {
  let result = html;
  result = result.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
  result = result.replace(/<meta[^>]*name="description"[^>]*>/, `<meta name="description" content="${description}" />`);
  const ogTags = `
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="Malayala Mitra" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${image}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />`;
  result = result.replace("</head>", ogTags + "\n  </head>");
  return result;
}

async function fetchArticleForCrawler(slug) {
  try {
    const res = await fetch(`${API_BASE}/news/${encodeURIComponent(slug)}`, {
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const text = await res.text();
    const data = JSON.parse(text);
    return data?.article || data?.news || data?.data || data;
  } catch {
    return null;
  }
}

function slugify(text) {
  if (!text) return "";
  const ML_MAP = {
    "\u0D05": "a", "\u0D06": "aa", "\u0D07": "i", "\u0D08": "ee",
    "\u0D09": "u", "\u0D0A": "oo", "\u0D0B": "e", "\u0D0C": "ai",
    "\u0D0E": "o", "\u0D0F": "oo", "\u0D10": "au",
    "\u0D12": "o", "\u0D13": "oo", "\u0D14": "au",
    "\u0D15": "ka", "\u0D16": "kha", "\u0D17": "ga", "\u0D18": "gha",
    "\u0D19": "nga", "\u0D1A": "cha", "\u0D1B": "chha", "\u0D1C": "ja",
    "\u0D1D": "jha", "\u0D1E": "nya", "\u0D1F": "tta", "\u0D20": "ttha",
    "\u0D21": "dda", "\u0D22": "ddha", "\u0D23": "nna", "\u0D24": "ta",
    "\u0D25": "tha", "\u0D26": "da", "\u0D27": "dha", "\u0D28": "na",
    "\u0D2A": "pa", "\u0D2B": "pha", "\u0D2C": "ba", "\u0D2D": "bha",
    "\u0D2E": "ma", "\u0D2F": "ya", "\u0D30": "ra", "\u0D31": "ra",
    "\u0D32": "la", "\u0D33": "la", "\u0D34": "zha", "\u0D35": "va",
    "\u0D36": "sha", "\u0D37": "sha", "\u0D38": "sa", "\u0D39": "ha",
    "\u0D3E": "aa", "\u0D3F": "i", "\u0D40": "ee", "\u0D41": "u",
    "\u0D42": "oo", "\u0D43": "ru", "\u0D46": "e", "\u0D47": "e",
    "\u0D48": "ai", "\u0D4B": "o", "\u0D4C": "au",
    "\u0D4D": "", "\u0D57": "",
    "\u0D66": "0", "\u0D67": "1", "\u0D68": "2", "\u0D69": "3",
    "\u0D6A": "4", "\u0D6B": "5", "\u0D6C": "6", "\u0D6D": "7",
    "\u0D6E": "8", "\u0D6F": "9",
  };
  let result = "";
  for (const ch of text) {
    const code = ch.codePointAt(0);
    if (code >= 0x0D00 && code <= 0x0D7F) {
      result += ML_MAP[ch] ?? "";
    } else {
      result += ch;
    }
  }
  return result
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function makeArticleSlug(article) {
  const cat = article.category || "news";
  const titleSlug = slugify(article.title);
  return titleSlug ? cat + "-" + titleSlug : (article.slug || article.id || "");
}

async function findArticleByTitleSlug(titleSlug) {
  try {
    const res = await fetch(`${API_BASE}/news?limit=100`, {
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const text = await res.text();
    const data = JSON.parse(text);
    const articles = data?.news || data?.articles || [];
    return articles.find(a => makeArticleSlug(a) === titleSlug) || null;
  } catch {
    return null;
  }
}

const spa = (_req, res) => res.sendFile(indexPath);

app.get("/post/:slug", async (req, res) => {
  if (!isCrawler(req)) return spa(req, res);
  let article = await fetchArticleForCrawler(req.params.slug);
  if (!article) {
    article = await findArticleByTitleSlug(req.params.slug);
  }
  if (!article) return spa(req, res);
  const title = (article.title || "Malayala Mitra") + " | Malayala Mitra";
  const description = article.excerpt || article.title || "Malayala Mitra - Malayalam News Portal";
    let image = article.image || article.thumbnail || "";
    if (image && !image.startsWith("http")) {
      image = API_BASE.replace(/\/api\/?$/, "") + (image.startsWith("/") ? image : "/" + image);
    }
    const url = SITE_URL + "/post/" + req.params.slug;
  res.send(injectMeta(indexHtml, title, description, image, url));
});

app.get("/category/:slug", spa);
app.get("/author/:name", spa);
app.get("/search", spa);
app.get("/news", spa);
app.get("/login", spa);
app.get("/admin", spa);
app.get("/admin/{*splat}", spa);

app.use(spa);

app.listen(PORT, () => {
  console.log("Frontend server running on port " + PORT);
});
