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
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

const app = express();
const PORT = process.env.PORT || 4000;

const distPath = path.join(__dirname, "dist");
const indexPath = path.join(distPath, "index.html");

app.use(compression());

const isProduction = process.env.NODE_ENV === "production";
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.ALLOWED_ORIGIN,
  "https://malayalamithram.in",
  "https://demo.malayalamithram.in",
  "https://malayalamitharam.in",
  "https://demo.malayalamitharam.in",
].filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || !isProduction || allowedOrigins.includes(origin))
      return callback(null, true);
    return callback(null, true);
  },
  credentials: true,
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Backend: MongoDB connection ──────────────────────────────────────────
const connectDB = require(path.join(__dirname, "backend", "config", "db"));

// ── Backend: Models ─────────────────────────────────────────────────────
const Image = require(path.join(__dirname, "backend", "models", "Image"));
const Ad = require(path.join(__dirname, "backend", "models", "Ad"));
const User = require(path.join(__dirname, "backend", "models", "User"));

// ── Backend: Routes ─────────────────────────────────────────────────────
const authRoutes = require(path.join(__dirname, "backend", "routes", "auth"));
const newsRoutes = require(path.join(__dirname, "backend", "routes", "news"));
const categoriesRoutes = require(path.join(__dirname, "backend", "routes", "categories"));
const tagsRoutes = require(path.join(__dirname, "backend", "routes", "tags"));
const pagesRoutes = require(path.join(__dirname, "backend", "routes", "pages"));
const authorsRoutes = require(path.join(__dirname, "backend", "routes", "authors"));
const settingsRoutes = require(path.join(__dirname, "backend", "routes", "settings"));
const adsRoutes = require(path.join(__dirname, "backend", "routes", "ads"));
const uploadRoutes = require(path.join(__dirname, "backend", "routes", "upload"));

// ── Backend: Serve uploads from disk ────────────────────────────────────
const uploadDir = path.join(__dirname, "backend", "uploads");
app.use("/uploads", express.static(uploadDir));

// ── Backend: Serve uploaded images from MongoDB if not on disk ──────────
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

// ── Backend: API request logger ─────────────────────────────────────────
app.use("/api", (req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Backend: API routes ─────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/tags", tagsRoutes);
app.use("/api/pages", pagesRoutes);
app.use("/api/authors", authorsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/ads", adsRoutes);
app.use("/api/upload", uploadRoutes);

app.get("/api/health", async (_req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStates = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };
  res.json({
    status: "ok",
    service: "Malayalamithram API",
    db: dbStates[dbState] || "unknown",
  });
});

// ── Frontend: SPA routes ────────────────────────────────────────────────
app.use(express.static(distPath, { index: false }));

const spa = (_req, res) => res.sendFile(indexPath);

app.get("/post/:slug", spa);
app.get("/category/:slug", spa);
app.get("/author/:name", spa);
app.get("/search", spa);
app.get("/news", spa);
app.get("/login", spa);
app.get("/admin", spa);
app.get("/admin/*", spa);

app.use(spa);

// ── Start server ────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n Malayalamithram server running on port ${PORT}`);
  console.log(`   Health: /api/health\n`);
});

// ── Connect to MongoDB and seed admin ───────────────────────────────────
connectDB().then(async (connection) => {
  if (connection) {
    try {
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
      }
    } catch (e) {
      console.log("Auto-seed skipped:", e.message);
    }

    try {
      const indexes = await Ad.collection.listIndexes().toArray();
      const hasSlotIndex = indexes.some((idx) => idx.key && idx.key.slot === 1);
      if (hasSlotIndex) {
        await Ad.collection.dropIndex("slot_1");
        console.log("Dropped old unique index on Ad.slot");
      }
    } catch (err) {
      console.log("Index cleanup skipped:", err.message);
    }
  }
});
