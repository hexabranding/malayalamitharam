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

app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
  credentials: true,
}));
app.use(express.json());
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

app.use((_req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});

app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n Malayalamithram Backend running on http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health\n`);
  });
});
