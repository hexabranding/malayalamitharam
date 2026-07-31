require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || "https://demo.malayalamitharam.in";

app.use(cors({ origin: true, credentials: true }));
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
  const hasMongoUri = !!process.env.MONGO_URI;
  const hasJwtSecret = !!process.env.JWT_SECRET;
  const dbState = mongoose.connection.readyState;
  const dbStates = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };
  let userCount = 0;
  try {
    if (dbState === 1) {
      const User = require("./backend/models/User");
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
    const User = require("./backend/models/User");
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
    res.status(500).json({ error: err.message });
  }
});

const distPath = path.join(__dirname, "dist");
app.use(express.static(distPath));
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Malayalamithram Backend running on http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
  console.log(`Diag: http://localhost:${PORT}/api/diag`);

  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.log("MONGO_URI not found in .env");
    return;
  }

  mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000 })
    .then(async (conn) => {
      console.log("MongoDB connected: " + conn.connection.host);
      try {
        const bcrypt = require("bcryptjs");
        const User = require("./backend/models/User");
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
          console.log("Default admin user created (admin / Admin@123)");
        } else {
          console.log("Admin user already exists");
        }
      } catch (e) {
        console.log("Auto-seed skipped:", e.message);
      }
    })
    .catch((err) => {
      console.error("MongoDB connection failed:", err.message);
    });
});
