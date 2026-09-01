const { translate } = require("@vitalets/google-translate-api");
const { slugifyEnglish } = require("./newsSlug");

function containsMalayalam(value) {
  return /[\u0D00-\u0D7F]/.test(String(value || ""));
}

/**
 * Generate an English URL slug.
 *
 * Priority:
 * 1. If titleEn is already a valid English title, use it.
 * 2. Otherwise translate Malayalam title to English.
 *
 * IMPORTANT:
 * requestedSlug is intentionally NOT used as the source of the
 * automatically generated slug.
 */
async function englishSlugSource(
  title,
  titleEn,
  requestedSlug,
  { forceTitleTranslation = false } = {}
) {
  const suppliedEnglishTitle = String(titleEn || "").trim();

  // Use existing English title when available.
  if (
    !forceTitleTranslation &&
    suppliedEnglishTitle &&
    !containsMalayalam(suppliedEnglishTitle)
  ) {
    let baseSlug = slugifyEnglish(suppliedEnglishTitle);

    // Remove generated "new-123..." prefixes if they exist.
    baseSlug = baseSlug.replace(/^new-\d{8,}-?/, "");

    if (baseSlug) {
      return {
        englishTitle: suppliedEnglishTitle,
        baseSlug,
      };
    }
  }

  const sourceTitle = String(title || "").trim();

  if (!sourceTitle) {
    throw new Error("A title is required to generate a slug");
  }

  // If the original title is already English, use it directly.
  if (!containsMalayalam(sourceTitle)) {
    let baseSlug = slugifyEnglish(sourceTitle);

    baseSlug = baseSlug.replace(/^new-\d{8,}-?/, "");

    if (baseSlug) {
      return {
        englishTitle: sourceTitle,
        baseSlug,
      };
    }
  }

  // Malayalam → English translation
  try {
    const result = await translate(sourceTitle, {
      from: "ml",
      to: "en",
    });

    const englishTitle = String(result.text || "").trim();

    let baseSlug = slugifyEnglish(englishTitle);

    baseSlug = baseSlug.replace(/^new-\d{8,}-?/, "");

    if (!baseSlug) {
      throw new Error("Translation did not produce English text");
    }

    return {
      englishTitle,
      baseSlug,
    };
  } catch (error) {
    const err = new Error(
      "Could not translate the Malayalam title. Provide an English title and try again."
    );

    err.statusCode = 422;
    err.cause = error;

    throw err;
  }
}

module.exports = {
  englishSlugSource,
  containsMalayalam,
};