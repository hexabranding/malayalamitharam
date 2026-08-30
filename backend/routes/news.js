const express = require("express");
const Article = require("../models/Article");
const { authMiddleware } = require("../middleware/auth");
const { isCleanNewsSlug } = require("../utils/newsSlug");
const { englishSlugSource } = require("../utils/englishNewsSlug");
const { sanitizeRelatedVideos, isSafeVideoUrl } = require("../utils/videoEmbed");

const router = express.Router();

const BG_COLORS = ["#c91f26", "#1565c0", "#2e7d32", "#ef6c00", "#6a1b9a"];

function getRandomBgColor() {
  return BG_COLORS[Math.floor(Math.random() * BG_COLORS.length)];
}

async function ensureUniqueSlug(baseSlug, excludeId) {
  let cleanBase = String(baseSlug || "").replace(/^new-\d{8,}-?/, "") || "news";
  let candidate = cleanBase;
  let counter = 2;
  while (true) {
    const existing = await Article.findOne({
      slug: candidate,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    });
    if (!existing) return candidate;
    candidate = cleanBase + "-" + counter;
    counter++;
  }
}

async function findArticleBySlug(slugParam, isAdmin) {
  const filter = isAdmin ? {} : { published: true };

  let article = await Article.findOne({ ...filter, slug: slugParam });
  if (article) return article;

  article = await Article.findOne({ ...filter, legacySlugs: slugParam });
  if (article) return article;

  const stripped = String(slugParam).replace(/^new-\d{8,}-?/, "");
  if (stripped && stripped !== slugParam) {
    article = await Article.findOne({ ...filter, slug: stripped });
    if (article) return article;
    article = await Article.findOne({ ...filter, legacySlugs: stripped });
    if (article) return article;
  }

  try {
    const decoded = decodeURIComponent(slugParam);
    if (decoded !== slugParam) {
      article = await Article.findOne({ ...filter, slug: decoded });
      if (article) return article;
      article = await Article.findOne({ ...filter, legacySlugs: decoded });
      if (article) return article;
    }
  } catch {}

  if (slugParam.match(/^[0-9a-fA-F]{24}$/)) {
    article = await Article.findOne({ ...filter, _id: slugParam });
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
    res.status(err.statusCode || 500).json({ error: err.statusCode ? err.message : "Server error" });
  }
});

router.get("/slug/:slug", async (req, res) => {
  try {
    const rawSlug = String(req.params.slug || "");
    const cleanedCheck = rawSlug.replace(/^new-\d{8,}-?/, "");
    if (!isCleanNewsSlug(rawSlug) && !isCleanNewsSlug(cleanedCheck)) {
      return res.status(400).json({ error: "A valid English news slug is required" });
    }
    const isAdmin = req.headers.authorization?.startsWith("Bearer ");
    const article = await findArticleBySlug(req.params.slug, isAdmin);
    if (!article) return res.status(404).json({ error: "Article not found" });
    if (!article.published && !isAdmin) return res.status(404).json({ error: "Article not found" });
    res.json(article.toJSON());
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.statusCode ? err.message : "Server error" });
  }
});

router.get("/:slug", async (req, res) => {
  try {
    const rawSlug = String(req.params.slug || "");
    const cleanedCheck = rawSlug.replace(/^new-\d{8,}-?/, "");
    if (!isCleanNewsSlug(rawSlug) && !isCleanNewsSlug(cleanedCheck) && !/^[0-9a-fA-F]{24}$/.test(rawSlug)) {
      return res.status(400).json({ error: "A valid English news slug is required" });
    }
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
    const { title, titleEn, slug: requestedSlug, category, categories, subcategory, content, excerpt, image, tags, featured, breaking, published, author, body, media, videoUrl, relatedVideos, categoryMl, readTime, backgroundColor, likes, views, mainNews, popular } = req.body;
    if (!title || !category || !content) {
      return res.status(400).json({ error: "title, category, and content are required" });
    }
    const slugSource = await englishSlugSource(title, titleEn, requestedSlug);
    const slug = await ensureUniqueSlug(slugSource.baseSlug);
    const articleCategories = (categories && categories.length > 0) ? categories : [category];

    const sanitizedVideos = sanitizeRelatedVideos(relatedVideos);
    const safeVideoUrl = isSafeVideoUrl(videoUrl) ? String(videoUrl).trim() : "";
    const article = await Article.create({
      slug,
      engSlug: slug,
      title,
      titleEn: slugSource.englishTitle,
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
      videoUrl: safeVideoUrl,
      relatedVideos: sanitizedVideos,
      categoryMl: categoryMl || "",
      readTime: readTime || "3 മിനിറ്റ്",
      views: views || 0,
      likes: likes || 0,
      comments: 0,
      backgroundColor: backgroundColor || getRandomBgColor(),
    });

    res.status(201).json(article.toJSON());
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.statusCode ? err.message : "Server error" });
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const filter = req.params.id.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: req.params.id }
      : { slug: req.params.id };
    const updateData = { ...req.body, updatedAt: new Date().toISOString() };
    const existing = await Article.findOne(filter);
    if (!existing) return res.status(404).json({ error: "Article not found" });
    const slugFieldProvided = req.body.slug !== undefined || req.body.engSlug !== undefined;
    const requestedSlugRaw = req.body.slug !== undefined ? req.body.slug : (req.body.engSlug !== undefined ? req.body.engSlug : undefined);
    let computedLegacy = null;
    if (slugFieldProvided) {
      const requestedSlug = String(requestedSlugRaw || "").trim();
      if (requestedSlug === "" && !req.body.titleEn && !req.body.title) {
        // slug explicitly cleared but no title to generate from - keep existing slug
      } else {
        let slugSource;
        const effectiveRequested = requestedSlug;
        const titleForSlug = req.body.title || existing.title;
        const titleEnForSlug = req.body.titleEn !== undefined ? req.body.titleEn : existing.titleEn;
        if (effectiveRequested) {
          slugSource = await englishSlugSource(titleForSlug, titleEnForSlug, effectiveRequested);
        } else {
          slugSource = await englishSlugSource(titleForSlug, titleEnForSlug, "");
        }
        const slug = await ensureUniqueSlug(slugSource.baseSlug, existing._id);
        updateData.slug = slug;
        updateData.engSlug = slug;
        if (slugSource.englishTitle) updateData.titleEn = slugSource.englishTitle;
        if (slug !== existing.slug) {
          computedLegacy = [...new Set([...(existing.legacySlugs || []), existing.slug].filter(Boolean))];
        }
      }
    }
    if (req.body.relatedVideos !== undefined) {
      updateData.relatedVideos = sanitizeRelatedVideos(req.body.relatedVideos);
    }
    if (req.body.videoUrl !== undefined) {
      updateData.videoUrl = isSafeVideoUrl(req.body.videoUrl) ? String(req.body.videoUrl).trim() : "";
    }
    delete updateData.legacySlugs;
    delete updateData.slugManuallyEdited;
    if (computedLegacy) updateData.legacySlugs = computedLegacy;
    const article = await Article.findOneAndUpdate(
      filter,
      updateData,
      { new: true, runValidators: true }
    );
    if (!article) return res.status(404).json({ error: "Article not found" });
    res.json(article);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.statusCode ? err.message : "Server error" });
  }
});

router.patch("/:id/view", async (req, res) => {
  try {
    const raw = String(req.params.id || "");
    if (/^[0-9a-fA-F]{24}$/.test(raw)) {
      const article = await Article.findOneAndUpdate({ _id: raw }, { $inc: { views: 1 } }, { new: true, select: "views slug" });
      if (article) return res.json({ views: article.views });
      return res.status(404).json({ error: "Article not found" });
    }
    let article = await Article.findOneAndUpdate({ slug: raw }, { $inc: { views: 1 } }, { new: true, select: "views slug" });
    if (article) return res.json({ views: article.views });
    const stripped = raw.replace(/^new-\d{8,}-?/, "");
    if (stripped && stripped !== raw) {
      article = await Article.findOneAndUpdate({ slug: stripped }, { $inc: { views: 1 } }, { new: true, select: "views slug" });
      if (article) return res.json({ views: article.views });
      article = await Article.findOneAndUpdate({ legacySlugs: raw }, { $inc: { views: 1 } }, { new: true, select: "views slug" });
      if (article) return res.json({ views: article.views });
    }
    return res.status(404).json({ error: "Article not found" });
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

router.post("/migrate-slugs", authMiddleware, async (req, res) => {
  try {
    const articles = await Article.find({});
    let updated = 0, skipped = 0;
    for (const article of articles) {
      const stripped = String(article.slug || "").replace(/^new-\d{8,}-?/, "");
      let slugSource;
      let baseSlug = stripped && stripped !== article.slug ? stripped : null;
      if (!baseSlug) {
        try {
          slugSource = await englishSlugSource(article.title, article.titleEn, "", { forceTitleTranslation: true });
          baseSlug = slugSource.baseSlug;
        } catch (error) {
          if (stripped && stripped !== article.slug) baseSlug = stripped;
          else { skipped++; continue; }
        }
      } else {
        try { slugSource = await englishSlugSource(article.title, article.titleEn, stripped, { forceTitleTranslation: false }); baseSlug = slugSource.baseSlug; } catch { baseSlug = stripped; slugSource = { englishTitle: article.titleEn || "" }; }
      }
      const slug = await ensureUniqueSlug(baseSlug, article._id);
      if (slug !== article.slug) {
        await Article.updateOne({ _id: article._id }, { $set: { slug, engSlug: slug, titleEn: slugSource?.englishTitle || article.titleEn, legacySlugs: [...new Set([...(article.legacySlugs || []), article.slug].filter(Boolean))] } });
        updated++;
      } else if (slugSource && article.titleEn !== slugSource.englishTitle) {
        await Article.updateOne({ _id: article._id }, { $set: { titleEn: slugSource.englishTitle } });
        updated++;
      }
    }
    res.json({ message: "Migration complete", updated, skipped, total: articles.length });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
