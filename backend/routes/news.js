const express = require("express");
const Article = require("../models/Article");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

const BG_COLORS = ["#c91f26", "#1565c0", "#2e7d32", "#ef6c00", "#6a1b9a"];

function getRandomBgColor() {
  return BG_COLORS[Math.floor(Math.random() * BG_COLORS.length)];
}

function slugify(text) {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

const ML_MAP = {
  "\u0D05":"a","\u0D06":"aa","\u0D07":"i","\u0D08":"ii",
  "\u0D09":"u","\u0D0A":"uu","\u0D0B":"ru",
  "\u0D0E":"e","\u0D0F":"ee","\u0D10":"ai",
  "\u0D12":"o","\u0D13":"oo","\u0D14":"ou",
  "\u0D15":"ka","\u0D16":"kha","\u0D17":"ga","\u0D18":"gha","\u0D19":"nga",
  "\u0D1A":"cha","\u0D1B":"chha","\u0D1C":"ja","\u0D1D":"jha","\u0D1E":"nya",
  "\u0D1F":"ta","\u0D20":"tha","\u0D21":"da","\u0D22":"dha","\u0D23":"na",
  "\u0D24":"th","\u0D25":"thh","\u0D26":"d","\u0D27":"dh","\u0D28":"n",
  "\u0D2A":"p","\u0D2B":"f","\u0D2C":"b","\u0D2D":"bh","\u0D2E":"m",
  "\u0D2F":"y","\u0D30":"r","\u0D32":"l","\u0D35":"v",
  "\u0D36":"sh","\u0D37":"sh","\u0D38":"s","\u0D39":"h",
  "\u0D33":"l","\u0D34":"zh","\u0D31":"r",
  "\u0D3E":"a","\u0D3F":"i","\u0D41":"u","\u0D42":"oo","\u0D43":"ru",
  "\u0D46":"e","\u0D47":"ee","\u0D48":"ai","\u0D4A":"o","\u0D4B":"oo","\u0D4C":"ou",
  "\u0D02":"","\u0D03":"",
};

function toEnglishSlug(text) {
  if (!text) return "";
  let r = "";
  for (const ch of text) {
    if (ML_MAP[ch]) r += ML_MAP[ch];
    else if (/[a-zA-Z0-9]/.test(ch)) r += ch;
    else if (ch === " " || ch === "-" || ch === "_") r += "-";
  }
  return r.toLowerCase().replace(/-+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120);
}

function generateEngSlug(title, titleEn) {
  if (titleEn && titleEn.trim()) {
    const slug = slugify(titleEn);
    if (slug) return slug;
  }
  return toEnglishSlug(title) || "post-" + Date.now().toString(36);
}

async function ensureUniqueSlug(baseSlug, excludeId) {
  let candidate = baseSlug;
  let counter = 2;
  while (true) {
    const existing = await Article.findOne({
      engSlug: candidate,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    });
    if (!existing) return candidate;
    candidate = baseSlug + "-" + counter;
    counter++;
  }
}

async function findArticleBySlug(slugParam, isAdmin) {
  const filter = isAdmin ? {} : { published: true };

  let article = await Article.findOne({ ...filter, engSlug: slugParam });
  if (article) return article;

  article = await Article.findOne({ ...filter, slug: slugParam });
  if (article) return article;

  try {
    const decoded = decodeURIComponent(slugParam);
    if (decoded !== slugParam) {
      article = await Article.findOne({ ...filter, engSlug: decoded });
      if (article) return article;
      article = await Article.findOne({ ...filter, slug: decoded });
      if (article) return article;
    }
  } catch {}

  if (slugParam.match(/^[0-9a-fA-F]{24}$/)) {
    article = await Article.findById(slugParam);
    if (article) return article;
  }

  return null;
}

router.get("/", async (req, res) => {
  try {
    const { category, subcategory, featured, breaking, limit = 50, page = 1, search } = req.query;
    const filter = {};

    if (category) {
      filter.$or = [{ category: category }, { categories: category }, { categoryMl: category }];
    }
    if (subcategory) filter.subcategory = subcategory;
    if (featured !== undefined) filter.featured = featured === "true";
    if (breaking !== undefined) filter.breaking = breaking === "true";

    const isAdmin = req.headers.authorization?.startsWith("Bearer ");
    if (!isAdmin) filter.published = true;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    const total = await Article.countDocuments(filter);
    const docs = await Article.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * Number(limit))
      .limit(Number(limit));

    const news = docs.map(d => d.toJSON());

    res.json({ news, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/eng-slug/:slug", async (req, res) => {
  try {
    const isAdmin = req.headers.authorization?.startsWith("Bearer ");
    const article = await Article.findOne(
      isAdmin ? { engSlug: req.params.slug } : { engSlug: req.params.slug, published: true }
    );
    if (!article) return res.status(404).json({ error: "Article not found" });
    res.json(article.toJSON());
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/slug/:slug", async (req, res) => {
  try {
    const isAdmin = req.headers.authorization?.startsWith("Bearer ");
    const article = await findArticleBySlug(req.params.slug, isAdmin);
    if (!article) return res.status(404).json({ error: "Article not found" });
    if (!article.published && !isAdmin) return res.status(404).json({ error: "Article not found" });
    res.json(article.toJSON());
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:slug", async (req, res) => {
  try {
    const isAdmin = req.headers.authorization?.startsWith("Bearer ");
    const article = await findArticleBySlug(req.params.slug, isAdmin);
    if (!article) return res.status(404).json({ error: "Article not found" });
    if (!article.published && !isAdmin) return res.status(404).json({ error: "Article not found" });
    res.json(article.toJSON());
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, titleEn, category, categories, subcategory, content, excerpt, image, tags, featured, breaking, published, author, body, media, videoUrl, relatedVideos, categoryMl, readTime, backgroundColor, likes, views, mainNews, popular } = req.body;
    if (!title || !category || !content) {
      return res.status(400).json({ error: "title, category, and content are required" });
    }

    const titlePart = slugify(titleEn || title) || "post";
    const slug = slugify(category) + "-" + titlePart + "-" + Date.now().toString(36);
    const baseEngSlug = generateEngSlug(title, titleEn);
    const engSlug = await ensureUniqueSlug(baseEngSlug);
    const articleCategories = (categories && categories.length > 0) ? categories : [category];

    const article = await Article.create({
      slug,
      engSlug,
      title,
      titleEn: titleEn || "",
      category,
      categories: articleCategories,
      subcategory: subcategory || "",
      author: author || req.user.name,
      date: new Date().toISOString().split("T")[0],
      image: image || "/images/blog/1.jpg",
      excerpt: excerpt || content.slice(0, 120),
      content,
      body: body || [],
      tags: tags || [],
      featured: featured === true,
      breaking: breaking === true,
      mainNews: mainNews === true,
      popular: popular === true,
      published: published !== false,
      media: media || "standard",
      videoUrl: videoUrl || "",
      relatedVideos: relatedVideos || [],
      categoryMl: categoryMl || "",
      readTime: readTime || "3 മിനിറ്റ്",
      views: views || 0,
      likes: likes || 0,
      comments: 0,
      backgroundColor: backgroundColor || getRandomBgColor(),
    });

    res.status(201).json(article.toJSON());
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const filter = req.params.id.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: req.params.id }
      : { slug: req.params.id };
    const updateData = { ...req.body, updatedAt: new Date().toISOString() };
    if (req.body.title || req.body.titleEn) {
      const baseEngSlug = generateEngSlug(req.body.title, req.body.titleEn);
      const existing = await Article.findOne(filter);
      const excludeId = existing ? existing._id : null;
      updateData.engSlug = await ensureUniqueSlug(baseEngSlug, excludeId);
    }
    const article = await Article.findOneAndUpdate(
      filter,
      updateData,
      { new: true, runValidators: true }
    );
    if (!article) return res.status(404).json({ error: "Article not found" });
    res.json(article);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/:id/view", async (req, res) => {
  try {
    const filter = req.params.id.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: req.params.id }
      : { slug: req.params.id };
    const article = await Article.findOneAndUpdate(
      filter,
      { $inc: { views: 1 } },
      { new: true, select: "views slug" }
    );
    if (!article) return res.status(404).json({ error: "Article not found" });
    res.json({ views: article.views });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const filter = req.params.id.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: req.params.id }
      : { slug: req.params.id };
    const article = await Article.findOneAndDelete(filter);
    if (!article) return res.status(404).json({ error: "Article not found" });
    res.json({ message: "Article deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/migrate-engslug", authMiddleware, async (req, res) => {
  try {
    const articles = await Article.find({});
    let updated = 0;
    for (const article of articles) {
      const baseEngSlug = generateEngSlug(article.title, article.titleEn);
      const engSlug = await ensureUniqueSlug(baseEngSlug, article._id);
      await Article.updateOne({ _id: article._id }, { $set: { engSlug } });
      updated++;
    }
    res.json({ message: "Migration complete", updated, total: articles.length });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
