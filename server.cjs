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
const Article = require("./backend/models/Article");
const articleMongoose = Article.db.base;

const app = express();
const PORT = process.env.PORT || 4000;

const distPath = path.join(__dirname, "dist");
const indexPath = path.join(distPath, "index.html");
const indexHtml = fs.readFileSync(indexPath, "utf-8");

const SITE_URL = (process.env.SITE_URL || "https://www.malayalamithramonline.com").replace(/\/+$/, "");
const SITE_NAME = process.env.SITE_NAME || "Malayalamithram";
const UPLOADS_URL = (process.env.UPLOADS_URL || "https://api.malayalamitharam.in").replace(/\/+$/, "");
const DEFAULT_SOCIAL_IMAGE = process.env.DEFAULT_SOCIAL_IMAGE || "/images/malayala-mitra-banner.jpeg";
app.set("trust proxy", true);

const ARTICLE_CACHE_TTL = 10 * 60 * 1000;
const articleCache = new Map();

app.use(compression());

const isProduction = process.env.NODE_ENV === "production";
const allowedOrigins = [process.env.FRONTEND_URL, process.env.ALLOWED_ORIGIN, "https://malayalamithram.in", "https://demo.malayalamitharam.in", "https://malayalamitharam.in", "https://demo.malayalamitharam.in"].filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || !isProduction || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, true);
  },
  credentials: true,
}));

app.use(express.static(distPath, { index: false }));

// OG image proxy — serves article images from the SAME domain so social
// crawlers (WhatsApp, Facebook, Twitter) can fetch them without cross-origin
// issues.  The image is fetched from the API host and streamed back with a
// long cache.
app.get("/og-image", async (req, res) => {
  try {
    const src = String(req.query.src || "").trim();
    if (!src) return res.status(400).end();

    const baseUrl = getBaseUrl(req);
    let imageUrl;
    if (src.startsWith("http")) {
      imageUrl = src;
    } else if (src.startsWith("/uploads/")) {
      imageUrl = UPLOADS_URL + src;
    } else if (src.startsWith("/")) {
      imageUrl = `${baseUrl}${src}`;
    } else {
      imageUrl = `${baseUrl}/${src}`;
    }

    const upstream = await fetch(imageUrl, { redirect: "follow" });
    if (!upstream.ok) return res.status(404).end();

    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    res.set("Content-Type", contentType);
    res.set("Cache-Control", "public, max-age=86400");
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.send(buf);
  } catch (err) {
    console.error("[OG-IMAGE] proxy error:", err.message);
    res.status(502).end();
  }
});

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
  return t.slice(0, n - 1).trim() + "\u2026";
}

function articleDescription(article) {
  const body = Array.isArray(article.body) ? article.body.join(" ") : "";
  return truncate(stripHtml(article.excerpt || article.content || body || article.title || ""), 155);
}

function isCleanSlug(s) { return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(s||"")) && !/^new-\d{8,}/.test(String(s||"")) && !String(s||"").includes("---"); }
function pickEnglishSlug(article) {
  const candidates = [article.slug, article.engSlug].map(v=>String(v||"").trim()).filter(Boolean);
  for (const c of candidates) { const cleaned = c.replace(/^new-\d{8,}-?/, ""); if (cleaned && isCleanSlug(cleaned)) return cleaned; if (isCleanSlug(c)) return c; }
  for (const c of candidates) { const cleaned = c.replace(/^new-\d{8,}-?/, ""); if (cleaned && /^[a-z0-9-]+$/.test(cleaned) && !cleaned.includes("---")) return cleaned.replace(/^-+|-+$/g,"").replace(/-{2,}/g,"-"); }
  let base = "";
  if (article.titleEn) base = String(article.titleEn).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").replace(/-{2,}/g,"-").replace(/^new-\d{8,}-?/, "");
  if (base && isCleanSlug(base)) return base;
  base = String(article.title || "").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").replace(/-{2,}/g,"-").replace(/^new-\d{8,}-?/, "");
  if (base && base !== "news" && /^[a-z]+(?:-[a-z0-9]+)*$/.test(base) && !/^new-\d{8,}/.test(base)) return base;
  const fallback = String(article.titleEn || article.title || "").toLowerCase().replace(/[^a-z0-9\s-]+/g," ").trim().split(/[\s-]+/).filter(Boolean).join("-").replace(/^new-\d{8,}-?/, "").replace(/^-+|-+$/g,"").replace(/-{2,}/g,"-");
  if (fallback && isCleanSlug(fallback)) return fallback;
  return "";
}
function buildArticleMeta(article, baseUrl) {
  const title = String(article.title || "").trim();
  let description = articleDescription(article);
  if (!description) description = title;
  description = truncate(description, 150);
  const rawImage = (article.image || article.thumbnail || "").trim();
  const imgSrc = rawImage || DEFAULT_SOCIAL_IMAGE || "/images/malayala-mitra-banner.jpeg";
  const image = `${baseUrl}/og-image?src=${encodeURIComponent(imgSrc)}`;
  const slug = pickEnglishSlug(article);
  const url = slug ? `${baseUrl}/news/${slug}` : `${baseUrl}/`;
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
    const decoded = (() => { try { return decodeURIComponent(slug); } catch { return slug; } })();
    const identifiers = [...new Set([slug, decoded].filter(Boolean))];

    if (Article.db.readyState !== 1) {
      try {
        // VITE_API_URL is meant for the browser build and may be a relative
// path like "/api" (same-origin). Node's server-side fetch needs an
// absolute URL, so ignore relative values here and use a dedicated
// absolute base instead.
const isAbsolute = process.env.VITE_API_URL && /^https?:\/\//i.test(process.env.VITE_API_URL);
const BASE = (process.env.API_BASE_URL || (isAbsolute ? process.env.VITE_API_URL : null) || "https://api.malayalamitharam.in/api").replace(/\/+$/, "");
        const res = await fetch(`${BASE}/news/${encodeURIComponent(slug)}`);
        if (res.ok) {
          const data = await res.json();
          return data?.article || data?.news || data?.data || data;
        }
      } catch (e) {
        console.error("API fallback fetch failed:", e.message);
      }
      return null;
    }

    const strippedIds = identifiers.map(s => String(s).replace(/^new-\d{8,}-?/, "")).filter(s => s && !identifiers.includes(s));
    const allIds = [...new Set([...identifiers, ...strippedIds])];

    let article = await Article.findOne({
      published: true,
      $or: [
        { slug: { $in: allIds } },
        { legacySlugs: { $in: allIds } },
      ],
    }).lean();

    if (article) return article;

    if (slug.match(/^[0-9a-fA-F]{24}$/)) {
      article = await Article.findById(slug).lean();
      if (article) return article;
    }

    return null;
  } catch (err) {
    console.error("[OG] findArticleFromDB error:", err.message);
    return null;
  }
}

function spa(_req, res) {
  res.type("html");
  res.send(indexHtml);
}

function spaNotFound(_req, res) {
  res.type("html");
  res.status(404).send(indexHtml);
}

function getBaseUrl(req) {
  const proto = req.get("x-forwarded-proto") ? req.get("x-forwarded-proto").split(",")[0].trim() : req.protocol;
  return `${proto}://${req.get("host")}`;
}

async function articlePageHandler(req, res) {
  let slug = String(req.params.slug || "").replace(/\/+$/g, "");
  if (!slug) return spa(req, res);
  slug = slug.split("/").pop();

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

  const baseUrl = getBaseUrl(req);
  const cleanSlug = slug.replace(/^new-\d{8,}-?/, "");
  const cacheKey = articleCache.get(slug) ? slug : (articleCache.get(cleanSlug) ? cleanSlug : slug);
  const cached = articleCache.get(cacheKey);
  if (cached && Date.now() - cached.at < ARTICLE_CACHE_TTL) {
    const engSlug = pickEnglishSlug(cached.article);
    if (engSlug && engSlug !== slug && engSlug !== cleanSlug) return res.redirect(301, `/news/${engSlug}`);
    const meta = buildArticleMeta(cached.article, baseUrl);
    res.type("html");
    return res.send(injectMeta(indexHtml, meta));
  }

  let article = await findArticleFromDB(slug);

  if (!article) return spaNotFound(req, res);

  const engSlug = pickEnglishSlug(article);
  if (engSlug && engSlug !== slug && slug.replace(/^new-\d{8,}-?/, "") !== engSlug) {
    return res.redirect(301, `/news/${engSlug}`);
  }

  articleCache.set(slug, { article, at: Date.now() });
  if (engSlug) articleCache.set(engSlug, { article, at: Date.now() });
  articleCache.set(article.slug, { article, at: Date.now() });
  const meta = buildArticleMeta(article, baseUrl);
  res.type("html");
  res.send(injectMeta(indexHtml, meta));
}

async function categoryArticleHandler(req, res, next) {
  const slug = String(req.params.slug || "").replace(/\/+$/g, "");
  if (!slug) return next();
  const article = await findArticleFromDB(slug);
  if (!article) return next();
  req.params.slug = pickEnglishSlug(article) || article.slug;
  return articlePageHandler(req, res);
}

app.get("/post/:slug", (req, res) => {
  const cat = "news";
  res.redirect(301, `/${cat}/${req.params.slug}/`);
});
app.get("/news/:slug", articlePageHandler);
app.get("/news/:slug/", articlePageHandler);

app.get("/category/:slug", spa);
app.get("/author/:name", spa);
app.get("/search", spa);
app.get("/news", spa);
app.get("/login", spa);
app.get("/admin", spa);
app.get("/admin/*splat", spa);

app.get("/:category/:slug", categoryArticleHandler);
app.get("/:category/:slug/", categoryArticleHandler);

app.use(spa);

function start() {
  app.listen(PORT, "0.0.0.0", () => {
    console.log("Frontend server running on port " + PORT);
  });

  articleMongoose
    .connect(process.env.MONGO_URI, {})
    .then(() => {
      console.log("MongoDB connected for frontend server");
    })
    .catch((err) => {
      console.error("MongoDB connection failed:", err.message);
    });
}

if (require.main === module) start();

module.exports = { articleDescription, buildArticleMeta, injectMeta, resolveAbsoluteImage, start };
