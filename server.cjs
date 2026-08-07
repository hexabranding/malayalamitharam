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

const API_BASE = (process.env.VITE_API_URL || "https://api.malayalamitharam.in/api").replace(/\/api\/?$/, "");
const SITE_NAME = "Malayala Mitra";
const SITE_URL = "https://demo.malayalamitharam.in";
const DEFAULT_OG_IMAGE = SITE_URL + "/images/og-image.jpg";

const distPath = path.join(__dirname, "dist");
const indexHtml = fs.readFileSync(path.join(distPath, "index.html"), "utf-8");

const CRAWLER_RE = /bot|crawler|spider|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegram|slackbot|discordbot|googlebot|bingbot|yandexbot|baiduspider|applebot|pinterestbot|qwantify|semrushbot|ahrefsbot|mj12bot|dotbot|petalbot|sogou|exabot|facebot|ia_archiver/i;

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

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    client.get(url, { headers: { "User-Agent": "OGRenderer/1.0" } }, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error("Invalid JSON from API")); }
      });
    }).on("error", reject);
  });
}

function resolveImageUrl(image) {
  if (!image) return null;
  if (image.startsWith("http") || image.startsWith("data:")) return image;
  if (image.startsWith("/uploads/") || image.startsWith("uploads/")) {
    const p = image.startsWith("/") ? image : "/" + image;
    return API_BASE + p;
  }
  if (image.startsWith("/")) return SITE_URL + image;
  return SITE_URL + "/images/" + image;
}

function absoluteUrl(base, relative) {
  if (!relative) return null;
  if (relative.startsWith("http")) return relative;
  return base + relative;
}

app.get("/post/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;
    const ua = req.headers["user-agent"] || "";
    const isBot = CRAWLER_RE.test(ua);

    let article = null;
    try {
      if (slug.match(/^[0-9a-fA-F]{24}$/)) {
        article = await fetchJSON(`${API_BASE}/news/${slug}`);
      } else {
        const results = await fetchJSON(`${API_BASE}/news?slug=${encodeURIComponent(slug)}&limit=1`);
        article = Array.isArray(results) ? results[0] : results;
      }
    } catch {}

    if (!article || !article.published) {
      if (!isBot) return res.sendFile(path.join(distPath, "index.html"));
      return res.status(404).send("Not Found");
    }

    if (!isBot) {
      return res.sendFile(path.join(distPath, "index.html"));
    }

    const ogTitle = (article.title || SITE_NAME) + " | " + SITE_NAME;
    const ogDesc = article.excerpt || article.title || "Malayala Mitra - Malayalam News Portal";
    const baseUrl = req.protocol + "://" + req.get("host");
    const resolvedImg = resolveImageUrl(article.image);
    const ogImage = resolvedImg || DEFAULT_OG_IMAGE;
    const ogUrl = baseUrl + "/post/" + slug;

    let html = indexHtml
      .replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${ogTitle.replace(/"/g, '&quot;')}"`)
      .replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${ogDesc.replace(/"/g, '&quot;')}"`)
      .replace(/<meta property="og:image" content="[^"]*"/, `<meta property="og:image" content="${ogImage}"`)
      .replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${ogUrl}"`)
      .replace(/<meta name="twitter:card" content="[^"]*"/, `<meta name="twitter:card" content="summary_large_image"`)
      .replace(/<meta name="twitter:title" content="[^"]*"/, `<meta name="twitter:title" content="${ogTitle.replace(/"/g, '&quot;')}"`)
      .replace(/<meta name="twitter:description" content="[^"]*"/, `<meta name="twitter:description" content="${ogDesc.replace(/"/g, '&quot;')}"`)
      .replace(/<meta name="twitter:image" content="[^"]*"/, `<meta name="twitter:image" content="${ogImage}"`)
      .replace(/<title>[^<]*<\/title>/, `<title>${ogTitle.replace(/</g, '&lt;')}</title>`);

    res.set("Content-Type", "text/html");
    res.send(html);
  } catch (err) {
    console.error("Error in /post/:slug:", err.message);
    res.sendFile(path.join(distPath, "index.html"));
  }
});

app.use(express.static(distPath));

app.use((_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.use((err, _req, res, _next) => {
  console.error("Error:", err.message);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log("Frontend server running on port " + PORT);
  console.log("API upstream: " + API_BASE);
});
