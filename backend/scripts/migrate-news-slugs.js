require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const Article = require("../models/Article");
const { suggestNewsSlug, slugifyManglish, isCleanNewsSlug } = require("../utils/newsSlug");

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
    const base = slugifyManglish(article.title, article.titleEn) || (isCleanNewsSlug(article.engSlug) ? article.engSlug : "");
    if (!base) {
      skipped++;
      console.warn(`Skipped ${article._id}: add an English title before migrating.`);
      continue;
    }
    const slug = await uniqueSlug(base, article._id);
    if (slug === article.slug) continue;
    await Article.updateOne(
      { _id: article._id },
      { $set: { slug, engSlug: slug, legacySlugs: [...new Set([...(article.legacySlugs || []), article.slug].filter(Boolean))] } }
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
