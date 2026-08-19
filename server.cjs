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

const API_BASE = process.env.BACKEND_API_URL || "https://api.malayalamitharam.in/api";
const SITE_URL = process.env.SITE_URL || "https://demo.malayalamitharam.in";

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

function esc(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function injectMeta(html, title, description, image, url) {
  let result = html;
  const safeTitle = esc(title);
  const safeDesc = esc(description);
  const safeImage = esc(image);
  const safeUrl = esc(url);
  result = result.replace(/<title>[^<]*<\/title>/, `<title>${safeTitle}</title>`);
  result = result.replace(/<meta[^>]*name="description"[^>]*>/, `<meta name="description" content="${safeDesc}" />`);
  result = result.replace(/<meta[^>]*property="og:[^"]*"[^>]*>/g, "");
  result = result.replace(/<meta[^>]*name="twitter:[^"]*"[^>]*>/g, "");
  const ogTags = `
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="Malayala Mitra" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDesc}" />
    <meta property="og:url" content="${safeUrl}" />
    <meta property="og:image" content="${safeImage}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDesc}" />
    <meta name="twitter:image" content="${safeImage}" />`;
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
  return text
    .toLowerCase()
    .replace(/[^\w\s\u0D00-\u0D7F-]/g, "")
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
    const res = await fetch(`${API_BASE}/news?limit=500`, {
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
