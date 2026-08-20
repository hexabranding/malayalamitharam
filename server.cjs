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
const http = require("http");
const https = require("https");

const app = express();
const PORT = process.env.PORT || 4000;

const distPath = path.join(__dirname, "dist");
const indexPath = path.join(distPath, "index.html");
const indexHtml = fs.readFileSync(indexPath, "utf-8");

const API_BASE = process.env.BACKEND_API_URL || "https://api.malayalamitharam.in/api";
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, "");
const SITE_URL = (process.env.SITE_URL || "https://demo.malayalamitharam.in").replace(/\/+$/, "");
const SITE_NAME = process.env.SITE_NAME || "Malayalamitram";
const SITE_DESCRIPTION =
  process.env.SITE_DESCRIPTION ||
  "Malayalamitram - Malayalam News Portal. Breaking News, Kerala, India, World, Gulf, Sports, Business, Entertainment and Technology.";
const DEFAULT_IMAGE = SITE_URL + "/images/malayalamithram-logo.png";

const CRAWLER_RE =
  /facebookexternalhit|facebot|meta-externalagent|twitterbot|whatsapp|telegrambot|telegram-sandbox|slackbot|slack-imgproxy|linkedinbot|pinterest|applebot|bingbot|bingpreview|googlebot|yandexbot|duckduckbot|discordbot|viber|skypeuripreview|skype\b|line-preview|mixi-bot|mixi\b|naver|daum|vkshare|redditbot|cocoon|clck|quora|feedbot|outbrain|mediapartners|adsbot|facebookcatalog|mastodon|gotosocial|semrushbot|ahrefsbot|mj12bot|petalbot|gptbot|openai|embed|previewbot|crawler|spider|favicon|preview/i;

const ARTICLE_CACHE_TTL = 10 * 60 * 1000;
const articleCache = new Map();

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

function isPrivateHost(hostname) {
  if (!hostname) return true;
  const h = String(hostname).toLowerCase().trim();
  if (/invalid/.test(h)) return true;
  if (h === "localhost" || h === "127.0.0.1" || h === "0.0.0.0" || h === "::1" || h.endsWith(".localhost")) return true;
  if (/^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})$/.test(h)) return true;
  return false;
}

// Produce an absolute HTTPS (publicly reachable) or handled image URL.
// Never returns empty and never returns localhost/private-IP hosts.
function resolveAbsoluteImage(image) {
  if (!image || typeof image !== "string") return DEFAULT_IMAGE;
  let value = image.trim();
  if (!value || /^data:/i.test(value)) return DEFAULT_IMAGE;
  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value);
      if (isPrivateHost(parsed.hostname)) return DEFAULT_IMAGE;
      return value;
    } catch {
      return DEFAULT_IMAGE;
    }
  }
  if (value.startsWith("//")) value = "https:" + value;
  if (value.startsWith("/uploads/")) return API_ORIGIN + value;
  const prefixed = value.startsWith("/") ? value : "/" + value;
  return SITE_URL + prefixed;
}

function toIso(value) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString();
}

function httpGetJson(url, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https:") ? https : http;
    const req = lib.get(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; Malayalamitram Social Preview; +https://malayalamithram.in)",
      },
      timeout: timeoutMs,
    }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        body += chunk;
        if (body.length > 5 * 1024 * 1024) req.destroy(new Error("Response too large"));
      });
      res.on("end", () => {
        if (res.statusCode !== 200) return reject(new Error("HTTP " + res.statusCode));
        try {
          resolve(JSON.parse(body));
        } catch (err) {
          reject(err);
        }
      });
    });
    req.on("timeout", () => req.destroy(new Error("Request timed out")));
    req.on("error", reject);
  });
}

async function fetchArticleJson(url) {
  const key = url;
  const cached = articleCache.get(key);
  if (cached && Date.now() - cached.at < ARTICLE_CACHE_TTL) return cached.article;
  let article = null;
  try {
    const data = await httpGetJson(url);
    article = data?.article || data?.news || data?.data || data || null;
  } catch (err) {
    console.error("Social-preview article fetch failed:", key, "-", err.message);
  }
  if (article) articleCache.set(key, { article, at: Date.now() });
  return article;
}

function fetchArticleBySlug(slug) {
  return fetchArticleJson(`${API_BASE}/news/${encodeURIComponent(slug)}`);
}

function fetchArticleByTitleSlug(titleSlug) {
  return fetchArticleJson(`${API_BASE}/news/title-slug/${encodeURIComponent(titleSlug)}`);
}

function buildArticleMeta(article, pathSlug) {
  const title = String(article.title || SITE_NAME).trim();
  const description = String(article.excerpt || article.title || SITE_DESCRIPTION).trim();
  const image = resolveAbsoluteImage(article.image || article.thumbnail);
  const url = `${SITE_URL}/post/${encodeURIComponent(pathSlug)}`;
  const publishedTime = toIso(article.createdAt || article.datePublished || article.publishedAt || article.date || "");
  return { title, description, image, url, publishedTime };
}

function injectMeta(html, meta) {
  const { title, description, image, url, publishedTime } = meta;
  const pageTitle = title + " | " + SITE_NAME;
  const safeTitle = esc(title);
  const safePageTitle = esc(pageTitle);
  const safeDesc = esc(description);
  const safeImage = esc(image);
  const safeUrl = esc(url);
  const safeSiteName = esc(SITE_NAME);

  let result = html;
  result = result.replace(/<title>[^<]*<\/title>/, `<title>${safePageTitle}</title>`);
  result = result.replace(/<meta[^>]*name="description"[^>]*>/i, `<meta name="description" content="${safeDesc}" />`);
  result = result.replace(/<meta[^>]*property="og:[^"]*"[^>]*>/gi, "");
  result = result.replace(/<meta[^>]*property="article:[^"]*"[^>]*>/gi, "");
  result = result.replace(/<meta[^>]*name="twitter:[^"]*"[^>]*>/gi, "");
  result = result.replace(/<link[^>]*rel="canonical"[^>]*>/gi, "");
  result = result.replace(/<script[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi, "");

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: title,
    description,
    image: image ? [image] : undefined,
    datePublished: publishedTime || undefined,
    dateModified: publishedTime || undefined,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    publisher: { "@type": "Organization", name: SITE_NAME },
  }).replace(/</g, "\\u003c");

  const publishedTag = publishedTime ? `\n    <meta property="article:published_time" content="${esc(publishedTime)}" />` : "";

  const tags = `
    <link rel="canonical" href="${safeUrl}" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="${safeSiteName}" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDesc}" />
    <meta property="og:url" content="${safeUrl}" />
    <meta property="og:image" content="${safeImage}" />${publishedTag}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDesc}" />
    <meta name="twitter:image" content="${safeImage}" />
    <meta name="twitter:url" content="${safeUrl}" />
    <script type="application/ld+json">${jsonLd}</script>`;

  return result.replace("</head>", tags + "\n  </head>");
}

const spa = (_req, res) => res.sendFile(indexPath);

const articlePageHandler = async (req, res) => {
  if (!isCrawler(req)) return spa(req, res);
  const slug = req.params.slug || "";
  if (!slug) return spa(req, res);

  let article = await fetchArticleBySlug(slug);
  if (!article) article = await fetchArticleByTitleSlug(slug);
  if (!article) {
    const stripped = slug.replace(/^[a-z]+-\d+-/, "");
    if (stripped !== slug) article = await fetchArticleByTitleSlug(stripped);
  }
  if (!article) return spa(req, res);

  const meta = buildArticleMeta(article, slug);
  res.type("html");
  res.send(injectMeta(indexHtml, meta));
};

app.get("/post/:slug", articlePageHandler);
app.get("/news/:slug", articlePageHandler);

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