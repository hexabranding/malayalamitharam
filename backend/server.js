require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/auth");
const newsRoutes = require("./routes/news");
const categoriesRoutes = require("./routes/categories");
const tagsRoutes = require("./routes/tags");
const pagesRoutes = require("./routes/pages");
const authorsRoutes = require("./routes/authors");
const settingsRoutes = require("./routes/settings");
const adsRoutes = require("./routes/ads");
const uploadRoutes = require("./routes/upload");

const app = express();
const PORT = process.env.PORT || 4000;

const FRONTEND_URL = process.env.FRONTEND_URL || "https://demo.malayalamitharam.in";

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || process.env.NODE_ENV !== "production") {
      return callback(null, true);
    }
    const allowed = [
      FRONTEND_URL,
      process.env.ALLOWED_ORIGIN,
      "https://demo.malayalamitharam.in",
      "https://malayalamitharam.in",
    ].filter(Boolean);
    if (allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
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

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "Malayalamithram API", timestamp: new Date().toISOString() });
});

app.get("/api/diag", async (_req, res) => {
  const mongoose = require("mongoose");
  const hasMongoUri = !!process.env.MONGO_URI;
  const hasJwtSecret = !!process.env.JWT_SECRET;
  const dbState = mongoose.connection.readyState;
  const dbStates = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };
  let userCount = 0;
  try {
    if (dbState === 1) {
      const User = require("./models/User");
      userCount = await User.countDocuments();
    }
  } catch {}
  res.json({
    hasMongoUri,
    hasJwtSecret,
    mongoUriPreview: hasMongoUri ? process.env.MONGO_URI.substring(0, 30) + "..." : "missing",
    dbState: dbStates[dbState] || "unknown",
    nodeEnv: process.env.NODE_ENV || "development",
    port: PORT,
    userCount,
    uptime: process.uptime(),
  });
});

app.post("/api/setup/admin", async (req, res) => {
  try {
    const bcrypt = require("bcryptjs");
    const User = require("./models/User");
    const { username, password, email } = req.body;
    const uname = username || "admin";
    const pw = password || "Admin@123";
    const em = email || "admin@malayalamithram.in";

    const exists = await User.findOne({ username: uname });
    if (exists) return res.json({ message: "Admin user already exists", user: { username: exists.username, email: exists.email } });

    const passwordHash = await bcrypt.hash(pw, 10);
    const user = await User.create({ username: uname, email: em, passwordHash, role: "admin", name: "Malayalamithram Admin" });
    res.json({ message: "Admin user created successfully", user: { username: user.username, email: user.email } });
  } catch (err) {
    console.error("Setup admin error:", err);
    res.status(500).json({ error: err.message });
  }
});

const distPath = path.join(__dirname, "..", "dist");
app.use(express.static(distPath));
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.use((_req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});

app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`\n Malayalamithram Backend running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   Diag:   http://localhost:${PORT}/api/diag`);
  console.log(`   Setup:  http://localhost:${PORT}/api/setup/admin`);
  console.log("");

  connectDB().then(async (conn) => {
    if (conn) {
      console.log(" MongoDB connected successfully");
      try {
        const bcrypt = require("bcryptjs");
        const User = require("./models/User");
        const userExists = await User.findOne({ username: "admin" });
        if (!userExists) {
          const passwordHash = await bcrypt.hash("Admin@123", 10);
          await User.create({
            username: "admin",
            email: "admin@malayalamithram.in",
            passwordHash,
            role: "admin",
            name: "Malayalamithram Admin",
          });
          console.log(" Default admin user created (admin / Admin@123)");
        } else {
          console.log(" Admin user already exists");
        }
      } catch (e) {
        console.log(" Auto-seed skipped:", e.message);
      }
    } else {
      console.log(" ⚠ MongoDB NOT connected. Check MONGO_URI in .env");
      console.log("   Visit /api/diag to see configuration status");
    }
  });
});
