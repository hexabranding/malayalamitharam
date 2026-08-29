const MAP = {
  "\u0D05": "a", "\u0D06": "aa", "\u0D07": "i", "\u0D08": "ii",
  "\u0D09": "u", "\u0D0A": "uu", "\u0D0B": "ru",
  "\u0D0E": "e", "\u0D0F": "ee", "\u0D10": "ai",
  "\u0D12": "o", "\u0D13": "oo", "\u0D14": "ou",
  "\u0D15": "ka", "\u0D16": "kha", "\u0D17": "ga", "\u0D18": "gha", "\u0D19": "nga",
  "\u0D1A": "cha", "\u0D1B": "chha", "\u0D1C": "ja", "\u0D1D": "jha", "\u0D1E": "nya",
  "\u0D1F": "ta", "\u0D20": "tha", "\u0D21": "da", "\u0D22": "dha", "\u0D23": "na",
  "\u0D24": "th", "\u0D25": "thh", "\u0D26": "d", "\u0D27": "dh", "\u0D28": "n",
  "\u0D2A": "p", "\u0D2B": "f", "\u0D2C": "b", "\u0D2D": "bh", "\u0D2E": "m",
  "\u0D2F": "y", "\u0D30": "r", "\u0D32": "l", "\u0D35": "v",
  "\u0D36": "sh", "\u0D37": "sh", "\u0D38": "s", "\u0D39": "h",
  "\u0D33": "l", "\u0D34": "zh", "\u0D31": "r",
  "\u0D3E": "a", "\u0D3F": "i", "\u0D41": "u", "\u0D42": "oo", "\u0D43": "ru",
  "\u0D46": "e", "\u0D47": "ee", "\u0D48": "ai", "\u0D4A": "o", "\u0D4B": "oo", "\u0D4C": "ou",
  "\u0D02": "", "\u0D03": "",
  " ": "-",
};

export function toEnglishSlug(text) {
  if (!text) return "";
  let result = "";
  for (const ch of text) {
    if (MAP[ch] !== undefined) {
      result += MAP[ch];
    } else if (/[a-zA-Z0-9]/.test(ch)) {
      result += ch;
    } else if (ch === "-" || ch === "_") {
      result += "-";
    }
  }
  return result
    .toLowerCase()
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function getShareUrl(article) {
  if (article.engSlug) return article.engSlug;
  if (article.slug) return article.slug;
  return article.id || "";
}
