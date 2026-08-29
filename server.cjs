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
// Use the backend's existing model so the OG renderer always uses the same
// MongoDB collection and field definitions as the news API.
const Article = require("./backend/models/Article");
const articleMongoose = Article.db.base;

const app = express();
const PORT = process.env.PORT || 4000;

const distPath = path.join(__dirname, "dist");
const indexPath = path.join(distPath, "index.html");
const indexHtml = fs.readFileSync(indexPath, "utf-8");

const SITE_URL = (process.env.SITE_URL || "https://demo.malayalamitharam.in").replace(/\/+$/, "");
const SITE_NAME = process.env.SITE_NAME || "Malayalamitram";
// Uploaded news images are served by the API host, not by the static frontend
// host. This must match src/services/images.jsx so crawlers get a real image.
const UPLOADS_URL = (process.env.UPLOADS_URL || "https://api.malayalamitharam.in").replace(/\/+$/, "");
// Used only when an article genuinely has no featured image. This is deliberately
// not the Malayalamitram logo, because a logo is not a useful article preview.
const DEFAULT_SOCIAL_IMAGE = process.env.DEFAULT_SOCIAL_IMAGE || "/images/malayala-mitra-banner.jpeg";

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

function resolveAbsoluteImage(image) {
  if (!image || typeof image !== "string") return "";
  let value = image.trim();
  if (!value || /^data:/i.test(value)) return "";
  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value);
      if (isPrivateHost(parsed.hostname)) return "";
      // Social crawlers need a publicly accessible HTTPS resource. Upgrade
      // legacy http URLs instead of emitting a mixed-content preview URL.
      parsed.protocol = "https:";
      return parsed.toString();
    } catch {
      return "";
    }
  }
  if (value.startsWith("//")) value = "https:" + value;
  const prefixed = value.startsWith("/") ? value : "/" + value;
  if (prefixed.startsWith("/uploads/")) return UPLOADS_URL + prefixed;
  return SITE_URL + prefixed;
}

function toIso(value) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString();
}

function stripHtml(s) {
  return String(s || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
function truncate(s, n) {
  const t = String(s || "").trim();
  if (t.length <= n) return t;
  return t.slice(0, n - 1).trim() + "…";
}

function articleDescription(article) {
  const body = Array.isArray(article.body) ? article.body.join(" ") : "";
  return truncate(stripHtml(article.excerpt || article.content || body || article.title || ""), 155);
}

function buildArticleMeta(article) {
  // Keep the exact database headline. `esc()` later encodes quotes, ampersands
  // and angle brackets safely for the generated HTML attribute.
  const title = String(article.title || "").trim();
  let description = articleDescription(article);
  if (!description) description = title;
  const rawImage = (article.image || article.thumbnail || "").trim();
  // Article pages must never substitute the Malayalamitram logo. The Article
  // model's `image` field is the featured image managed by the news admin.
  const image = resolveAbsoluteImage(rawImage || DEFAULT_SOCIAL_IMAGE);
  const url = `${SITE_URL}/news/${encodeURIComponent(article.slug)}`;
  const publishedTime = toIso(article.createdAt || article.updatedAt || "");
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

  const imageTags = image ? `
    <meta property="og:image" content="${safeImage}" />
    <meta property="og:image:url" content="${safeImage}" />
    <meta property="og:image:secure_url" content="${safeImage}" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${safeTitle}" />
    <meta name="twitter:image" content="${safeImage}" />
    <meta name="twitter:image:alt" content="${safeTitle}" />` : "";

  const tags = `
    <link rel="canonical" href="${safeUrl}" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="${safeSiteName}" />
    <meta property="og:locale" content="ml_IN" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDesc}" />
    <meta property="og:url" content="${safeUrl}" />
    ${imageTags}${publishedTag}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDesc}" />
    <meta name="twitter:url" content="${safeUrl}" />
    <script type="application/ld+json">${jsonLd}</script>`;

  return result.replace("</head>", tags + "\n  </head>");
}

async function findArticleFromDB(slug) {
  try {
    if (Article.db.readyState !== 1) return null;
    const decoded = (()=>{ try{ return decodeURIComponent(slug);}catch{ return slug;}})();
    const identifiers = [...new Set([slug, decoded].filter(Boolean))];
    let article = await Article.findOne({
      published: true,
      $or: [
        { slug: { $in: identifiers } },
        { legacySlugs: { $in: identifiers } },
      ],
    }).lean();
    if (!article && slug.match(/^[0-9a-fA-F]{24}$/)) {
      article = await Article.findById(slug).lean();
    }
    return article;
  } catch (err) {
    console.error("MongoDB article lookup failed:", err.message);
    return null;
  }
}

const spa = (_req, res) => res.sendFile(indexPath);
const spaNotFound = (_req, res) => res.status(404).sendFile(indexPath);

const articlePageHandler = async (req, res) => {
  const slug = req.params.slug || "";
  if (!slug) return spa(req, res);

  // Backward compatibility: redirect old MongoDB _id URLs to slug
  if (slug.match(/^[0-9a-fA-F]{24}$/)) {
    try {
      if (Article.db.readyState === 1) {
        const article = await Article.findById(slug).lean();
        if (article && article.slug) {
          return res.redirect(301, `/news/${article.slug}`);
        }
      }
    } catch {}
  }

  const cached = articleCache.get(slug);
  if (cached && Date.now() - cached.at < ARTICLE_CACHE_TTL) {
    if (cached.article.slug !== slug) return res.redirect(301, `/news/${cached.article.slug}`);
    console.log("[OG] Cache hit for slug:", slug);
    const meta = buildArticleMeta(cached.article);
    res.type("html");
    return res.send(injectMeta(indexHtml, meta));
  }

  console.log("[OG] Fetching article for slug:", slug);
  let article = await findArticleFromDB(slug);

  if (article) {
    console.log("[OG] Found article:", article.title);
  } else {
    console.error("[OG] Article not found for slug:", slug);
  }

  if (!article) return spaNotFound(req, res);

  if (slug !== article.slug) return res.redirect(301, `/news/${article.slug}`);

  articleCache.set(slug, { article, at: Date.now() });
  const meta = buildArticleMeta(article);
  console.log("[OG] Injecting meta - title:", meta.title, "| image:", meta.image);
  res.type("html");
  res.send(injectMeta(indexHtml, meta));
};

app.get("/post/:slug", (req, res) => {
  res.redirect(301, `/news/${req.params.slug}`);
});
app.get("/news/:slug", articlePageHandler);

app.get("/category/:slug", spa);
app.get("/author/:name", spa);
app.get("/search", spa);
app.get("/news", spa);
app.get("/login", spa);
app.get("/admin", spa);
app.get("/admin/{*splat}", spa);

app.use(spa);

function start() {
  articleMongoose.connect(process.env.MONGO_URI, {})
    .then(() => {
      console.log("MongoDB connected for frontend server");
      app.listen(PORT, () => {
        console.log("Frontend server running on port " + PORT);
      });
    })
    .catch((err) => {
      console.error("MongoDB connection failed:", err.message);
      app.listen(PORT, () => {
        console.log("Frontend server running on port " + PORT + " (no MongoDB)");
      });
    });
}

if (require.main === module) start();

module.exports = { articleDescription, buildArticleMeta, injectMeta, resolveAbsoluteImage, start };
