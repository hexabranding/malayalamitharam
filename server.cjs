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
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 4000;
const isProduction = process.env.NODE_ENV === "production";
const allowedOrigins = [process.env.FRONTEND_URL, process.env.ALLOWED_ORIGIN, "https://malayalamithram.in", "https://demo.malayalamithram.in", "https://malayalamitharam.in", "https://demo.malayalamitharam.in"].filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || !isProduction || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS"));
  },
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "backend", "uploads")));

const authRoutes = require("./backend/routes/auth");
const newsRoutes = require("./backend/routes/news");
const categoriesRoutes = require("./backend/routes/categories");
const tagsRoutes = require("./backend/routes/tags");
const pagesRoutes = require("./backend/routes/pages");
const authorsRoutes = require("./backend/routes/authors");
const settingsRoutes = require("./backend/routes/settings");
const adsRoutes = require("./backend/routes/ads");
const uploadRoutes = require("./backend/routes/upload");
const Image = require("./backend/models/Image");

// Serve uploaded images from MongoDB if the file is not on disk (survives deploys).
app.get("/uploads/:filename", async (req, res) => {
  try {
    const img = await Image.findOne({ filename: req.params.filename });
    if (!img || !img.data) return res.status(404).json({ error: "Image not found" });
    res.set("Content-Type", img.contentType || "application/octet-stream");
    res.set("Cache-Control", "public, max-age=31536000, immutable");
    return res.send(img.data);
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/tags", tagsRoutes);
app.use("/api/pages", pagesRoutes);
app.use("/api/authors", authorsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/ads", adsRoutes);
app.use("/api/upload", uploadRoutes);

app.get("/api/setup/admin", async (_req, res) => {
  try {
    const User = require("./backend/models/User");
    const bcrypt = require("bcryptjs");
    const existing = await User.findOne({ username: "admin" });
    if (existing) return res.json({ message: "Admin user already exists", username: existing.username });
    const password = process.env.ADMIN_INITIAL_PASSWORD || "Admin@123";
    const passwordHash = await bcrypt.hash(password, 10);
    await User.create({
      username: "admin",
      email: "admin@malayalamithram.in",
      passwordHash,
      role: "admin",
      name: "Malayalamithram Admin",
    });
    res.json({ message: "Admin user created", username: "admin" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/health", (_req, res) => {
  const dbState = mongoose.connection.readyState;
  res.json({ status: "ok", db: dbState === 1 ? "connected" : "disconnected", timestamp: new Date().toISOString() });
});

app.get("/api/diag", async (_req, res) => {
  const hasMongoUri = !!process.env.MONGO_URI;
  const dbState = mongoose.connection.readyState;
  const dbStates = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };
  let userCount = 0;
  try {
    if (dbState === 1) {
      const User = require("./backend/models/User");
      userCount = await User.countDocuments();
    }
  } catch {}
  res.json({ hasMongoUri, dbState: dbStates[dbState] || "unknown", port: PORT, userCount, uptime: process.uptime() });
});

const fs = require("fs");
const distPath = path.join(__dirname, "dist");
const indexHtml = fs.readFileSync(path.join(distPath, "index.html"), "utf-8");

function resolveImageUrl(image) {
  if (!image) return null;
  if (image.startsWith("http") || image.startsWith("data:")) return image;
  if (image.startsWith("/uploads/") || image.startsWith("uploads/")) {
    const p = image.startsWith("/") ? image : "/" + image;
    return (process.env.API_URL || "") + p;
  }
  if (image.startsWith("/")) return image;
  return "/images/" + image;
}

function absoluteUrl(base, relative) {
  if (!relative) return null;
  if (relative.startsWith("http")) return relative;
  return base + relative;
}

const CRAWLER_RE = /bot|crawler|spider|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegram|slackbot|discordbot|googlebot|bingbot|yandexbot|baiduspider|applebot|pinterestbot|qwantify|semrushbot|ahrefsbot|mj12bot|dotbot|petalbot|sogou|exabot|facebot|ia_archiver/i;

const SITE_NAME = "Malayala Mitra";
const SITE_URL = "https://demo.malayalamitharam.in";
const DEFAULT_OG_IMAGE = SITE_URL + "/images/og-image.jpg";

app.get("/post/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;
    const Article = require("./backend/models/Article");
    let article = await Article.findOne({ slug }).lean();
    if (!article && slug.match(/^[0-9a-fA-F]{24}$/)) {
      article = await Article.findById(slug).lean();
    }
    if (!article || !article.published) {
      return res.status(404).send("Not Found");
    }
    const ua = req.headers["user-agent"] || "";
    const isBot = CRAWLER_RE.test(ua);
    if (!isBot) {
      return res.sendFile(path.join(distPath, "index.html"));
    }
    const ogTitle = (article.title || SITE_NAME) + " | " + SITE_NAME;
    const ogDesc = article.excerpt || article.title || "Malayala Mitra - Malayalam News Portal";
    const baseUrl = req.protocol + "://" + req.get("host");
    const resolvedImg = resolveImageUrl(article.image);
    const ogImage = absoluteUrl(baseUrl, resolvedImg) || DEFAULT_OG_IMAGE;
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

async function connectDB() {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.log("MONGO_URI not found in .env");
    return;
  }
  try {
    const conn = await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      heartbeatFrequencyMS: 30000,
    });
    console.log("MongoDB connected: " + conn.connection.host);
    const User = require("./backend/models/User");
    const bcrypt = require("bcryptjs");
    const userExists = await User.findOne({ username: "admin" });
    const initialPassword = process.env.ADMIN_INITIAL_PASSWORD;
    if (!userExists && initialPassword) {
      const passwordHash = await bcrypt.hash(initialPassword, 10);
      await User.create({
        username: "admin",
        email: "admin@malayalamithram.in",
        passwordHash,
        role: "admin",
        name: "Malayalamithram Admin",
      });
      console.log("Initial admin user created");
    } else if (!userExists) {
      console.warn("No admin user exists. Set ADMIN_INITIAL_PASSWORD to create the initial admin.");
    } else {
      console.log("Admin user exists");
    }
  } catch (err) {
    console.error("MongoDB error:", err.message);
    setTimeout(connectDB, 10000);
  }
}

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected. Reconnecting in 10s...");
  setTimeout(connectDB, 10000);
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB error:", err.message);
});

app.listen(PORT, () => {
  console.log("Backend running on port " + PORT);
  console.log("Health: http://localhost:" + PORT + "/api/health");
  connectDB();
});
