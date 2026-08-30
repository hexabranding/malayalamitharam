const { translate } = require("@vitalets/google-translate-api");
const { slugifyEnglish, isCleanNewsSlug } = require("./newsSlug");

function containsMalayalam(value) {
  return /[\u0D00-\u0D7F]/.test(String(value || ""));
}

/**
 * Returns an English, URL-safe slug source. Malayalam is translated, never
 * transliterated: URL text must describe the story in English.
 */
async function englishSlugSource(title, titleEn, requestedSlug, { forceTitleTranslation = false } = {}) {
  let suppliedSlug = slugifyEnglish(requestedSlug);
  suppliedSlug = suppliedSlug.replace(/^new-\d{8,}-?/, "");
  if (suppliedSlug && isCleanNewsSlug(suppliedSlug)) {
    return { englishTitle: String(titleEn || "").trim(), baseSlug: suppliedSlug };
  }

  const suppliedEnglishTitle = String(titleEn || "").trim();
  if (!forceTitleTranslation && suppliedEnglishTitle && !containsMalayalam(suppliedEnglishTitle)) {
    let baseSlug = slugifyEnglish(suppliedEnglishTitle);
    baseSlug = baseSlug.replace(/^new-\d{8,}-?/, "");
    if (baseSlug) return { englishTitle: suppliedEnglishTitle, baseSlug };
  }

  const sourceTitle = String(title || "").trim();
  if (!sourceTitle) throw new Error("A title is required to generate a slug");

  if (!containsMalayalam(sourceTitle)) {
    let baseSlug = slugifyEnglish(sourceTitle);
    baseSlug = baseSlug.replace(/^new-\d{8,}-?/, "");
    if (baseSlug) return { englishTitle: sourceTitle, baseSlug };
  }

  try {
    const result = await translate(sourceTitle, { from: "ml", to: "en" });
    const englishTitle = String(result.text || "").trim();
    let baseSlug = slugifyEnglish(englishTitle);
    baseSlug = baseSlug.replace(/^new-\d{8,}-?/, "");
    if (!baseSlug) throw new Error("translation did not produce English text");
    return { englishTitle, baseSlug };
  } catch (error) {
    const err = new Error("Could not translate the Malayalam title. Provide an English title and try again.");
    err.statusCode = 422;
    err.cause = error;
    throw err;
  }
}

module.exports = { englishSlugSource, containsMalayalam };
