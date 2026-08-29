require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const Article = require("../models/Article");
const { englishSlugSource } = require("../utils/englishNewsSlug");

async function uniqueSlug(base, id) {
  let candidate = base;
  let suffix = 2;
  while (await Article.exists({ slug: candidate, _id: { $ne: id } })) {
    candidate = `${base}-${suffix++}`;
  }
  return candidate;
}

async function migrate() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required");
  await mongoose.connect(process.env.MONGO_URI);
  const articles = await Article.find({});
  let updated = 0;
  let skipped = 0;
  for (const article of articles) {
    let source;
    try {
      source = await englishSlugSource(article.title, article.titleEn, "", { forceTitleTranslation: true });
    } catch (error) {
      skipped++;
      console.warn(`Skipped ${article._id}: ${error.message}`);
      continue;
    }
    const slug = await uniqueSlug(source.baseSlug, article._id);
    if (slug === article.slug && article.titleEn === source.englishTitle) continue;
    await Article.updateOne(
      { _id: article._id },
      { $set: { slug, engSlug: slug, titleEn: source.englishTitle, legacySlugs: [...new Set([...(article.legacySlugs || []), article.slug].filter(Boolean))] } }
    );
    updated++;
  }
  console.log(JSON.stringify({ updated, skipped, total: articles.length }));
  await mongoose.disconnect();
}

migrate().catch(async error => {
  console.error(error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
