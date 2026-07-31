process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err.message);
});
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err.message || err);
});

require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 4000;

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

const distPath = path.join(__dirname, "dist");
app.use(express.static(distPath));
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.use((_req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
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
    if (!userExists) {
      const passwordHash = await bcrypt.hash("Admin@123", 10);
      await User.create({
        username: "admin",
        email: "admin@malayalamithram.in",
        passwordHash,
        role: "admin",
        name: "Malayalamithram Admin",
      });
      console.log("Default admin created (admin / Admin@123)");
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
