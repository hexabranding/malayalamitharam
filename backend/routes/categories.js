const express = require("express");
const Category = require("../models/Category");
const Article = require("../models/Article");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const categories = await Category.find().sort({ slug: 1 }).lean();
    const withCounts = await Promise.all(
      categories.map(async (cat) => ({
        ...cat,
        count: await Article.countDocuments({ category: cat.slug, published: true }),
      }))
    );

    const groups = withCounts.filter((c) => !c.parent);
    const children = withCounts.filter((c) => c.parent);

    const hierarchical = groups.map((group) => ({
      ...group,
      children: children
        .filter((child) => child.parent === group.slug)
        .sort((a, b) => a.slug.localeCompare(b.slug)),
    }));

    res.json(hierarchical);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { label, slug, titleMl, parent } = req.body;
    if (!label || !slug) {
      return res.status(400).json({ error: "label and slug are required" });
    }
    const existing = await Category.findOne({ slug });
    if (existing) {
      return res.status(409).json({ error: "Category already exists" });
    }
    const cat = await Category.create({ label, slug, titleMl: titleMl || "", parent: parent || null });
    res.status(201).json(cat);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:slug", authMiddleware, async (req, res) => {
  try {
    const oldSlug = req.params.slug;
    const newSlug = req.body.slug || oldSlug;
    const cat = await Category.findOne({ slug: oldSlug });
    if (!cat) return res.status(404).json({ error: "Category not found" });

    const updateData = { ...req.body };
    delete updateData.slug;

    if (newSlug !== oldSlug) {
      const existing = await Category.findOne({ slug: newSlug });
      if (existing) return res.status(409).json({ error: "A category with this slug already exists" });

      await Category.updateOne({ slug: oldSlug }, { slug: newSlug, ...updateData });
      await Article.updateMany({ category: oldSlug }, { $set: { category: newSlug } });
      await Article.updateMany({ categories: oldSlug }, { $set: { "categories.$": newSlug } });
    } else {
      await Category.updateOne({ slug: oldSlug }, updateData);
    }

    const updated = await Category.findOne({ slug: newSlug });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:slug", authMiddleware, async (req, res) => {
  try {
    const cat = await Category.findOneAndDelete({ slug: req.params.slug });
    if (!cat) return res.status(404).json({ error: "Category not found" });
    if (cat.parent === null) {
      await Category.deleteMany({ parent: cat.slug });
    }
    res.json({ message: "Category deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/migrate", authMiddleware, async (req, res) => {
  try {
    const result = await Category.updateMany({}, { $unset: { id: "" } });
    res.json({ message: "Migration complete", modified: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
