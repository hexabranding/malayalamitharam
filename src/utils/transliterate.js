const MALAYALAM_MAP = {
  '\u0D02': 'm', '\u0D03': 'h',
  '\u0D05': 'a', '\u0D06': 'aa', '\u0D07': 'i', '\u0D08': 'ee',
  '\u0D09': 'u', '\u0D0A': 'uu', '\u0D0B': 'ri', '\u0D0C': 'lu',
  '\u0D0E': 'e', '\u0D0F': 'e', '\u0D10': 'ai',
  '\u0D12': 'o', '\u0D13': 'o', '\u0D14': 'au',
  '\u0D15': 'ka', '\u0D16': 'kha', '\u0D17': 'ga', '\u0D18': 'gha', '\u0D19': 'nga',
  '\u0D1A': 'cha', '\u0D1B': 'chha', '\u0D1C': 'ja', '\u0D1D': 'jha', '\u0D1E': 'nya',
  '\u0D1F': 'ta', '\u0D20': 'tha', '\u0D21': 'da', '\u0D22': 'dha', '\u0D23': 'na',
  '\u0D24': 'ta', '\u0D25': 'tha', '\u0D26': 'da', '\u0D27': 'dha', '\u0D28': 'na',
  '\u0D29': 'nn',
  '\u0D2A': 'pa', '\u0D2B': 'pha', '\u0D2C': 'ba', '\u0D2D': 'bha', '\u0D2E': 'ma',
  '\u0D2F': 'ya', '\u0D30': 'ra', '\u0D31': 'ra', '\u0D32': 'la', '\u0D33': 'la',
  '\u0D34': 'zha', '\u0D35': 'va', '\u0D36': 'sha', '\u0D37': 'sha',
  '\u0D38': 'sa', '\u0D39': 'ha',
  '\u0D3E': 'aa', '\u0D3F': 'i', '\u0D40': 'ee',
  '\u0D41': 'u', '\u0D42': 'uu', '\u0D43': 'ri', '\u0D44': 'ru',
  '\u0D46': 'e', '\u0D47': 'e', '\u0D48': 'ai',
  '\u0D4A': 'o', '\u0D4B': 'o', '\u0D4C': 'au',
  '\u0D4D': '',
  '\u0D57': '',
  '\u0D5F': 'ee',
  '\u0D60': 'oo', '\u0D61': 'oo',
  '\u0D7A': 'n', '\u0D7B': 'n', '\u0D7C': 'r', '\u0D7D': 'l', '\u0D7E': 'l', '\u0D7F': 'k',
  '\u200C': '', '\u200D': '',
};

const VIRAMA = '\u0D4D';

const STOP_WORDS = new Set(["a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "in", "is", "of", "on", "or", "the", "to", "with"]);

export function transliterateMalayalam(text) {
  if (!text) return '';
  let result = '';
  const chars = [...text];
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const mapped = MALAYALAM_MAP[ch];
    if (mapped !== undefined) {
      if (ch === VIRAMA) {
        if (i + 1 < chars.length) {
          const next = MALAYALAM_MAP[chars[i + 1]];
          if (next && next.length > 1) {
            result += next[0];
          }
        }
      } else {
        result += mapped;
      }
    } else if (ch >= '\u0D00' && ch <= '\u0D7F') {
      continue;
    } else {
      result += ch;
    }
  }
  return result;
}

export function generateSlugFromTitle(title, englishTitle) {
  const source = englishTitle || title || '';
  if (!source) return '';
  const hasMalayalam = /[\u0D00-\u0D7F]/.test(source);
  let words;
  if (hasMalayalam) {
    const transliterated = transliterateMalayalam(source);
    words = transliterated.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').trim().split(/[\s-]+/).filter(Boolean);
  } else {
    words = source.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').trim().split(/[\s-]+/).filter(Boolean);
  }
  const meaningful = words.filter((word, index) => index === 0 || !STOP_WORDS.has(word));
  let slug = meaningful.join('-');
  slug = slug.replace(/^new-\d{8,}-?/, '') || 'news';
  slug = slug.replace(/^-+|-+$/g, '').replace(/-{2,}/g, '-');
  return slug;
}

function stripNewPrefix(s) {
  return String(s || "").replace(/^new-\d{8,}-?/, "");
}
function isBadSlug(s) {
  return !s || /^new-\d{8,}/.test(s) || s.includes("---") || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s);
}

export function getShareUrl(article) {
  if (!article) return "";
  for (const raw of [article.slug, article.engSlug]) {
    if (!raw) continue;
    const cleaned = stripNewPrefix(raw);
    if (cleaned && !isBadSlug(cleaned)) return cleaned;
    if (!isBadSlug(raw)) return raw;
  }
  for (const raw of [article.slug, article.engSlug]) {
    if (!raw) continue;
    const cleaned = stripNewPrefix(raw);
    if (cleaned && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(cleaned) && !cleaned.includes("---")) return cleaned;
  }
  return "";
}
