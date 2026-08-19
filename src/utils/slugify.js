const ML_MAP = {
  "\u0D05": "a", "\u0D06": "aa", "\u0D07": "i", "\u0D08": "ee",
  "\u0D09": "u", "\u0D0A": "oo", "\u0D0B": "e", "\u0D0C": "ai",
  "\u0D0E": "o", "\u0D0F": "oo", "\u0D10": "au",
  "\u0D12": "o", "\u0D13": "oo", "\u0D14": "au",
  "\u0D15": "ka", "\u0D16": "kha", "\u0D17": "ga", "\u0D18": "gha",
  "\u0D19": "nga", "\u0D1A": "cha", "\u0D1B": "chha", "\u0D1C": "ja",
  "\u0D1D": "jha", "\u0D1E": "nya", "\u0D1F": "tta", "\u0D20": "ttha",
  "\u0D21": "dda", "\u0D22": "ddha", "\u0D23": "nna", "\u0D24": "ta",
  "\u0D25": "tha", "\u0D26": "da", "\u0D27": "dha", "\u0D28": "na",
  "\u0D2A": "pa", "\u0D2B": "pha", "\u0D2C": "ba", "\u0D2D": "bha",
  "\u0D2E": "ma", "\u0D2F": "ya", "\u0D30": "ra", "\u0D31": "ra",
  "\u0D32": "la", "\u0D33": "la", "\u0D34": "zha", "\u0D35": "va",
  "\u0D36": "sha", "\u0D37": "sha", "\u0D38": "sa", "\u0D39": "ha",
  "\u0D3E": "aa", "\u0D3F": "i", "\u0D40": "ee", "\u0D41": "u",
  "\u0D42": "oo", "\u0D43": "ru", "\u0D46": "e", "\u0D47": "e",
  "\u0D48": "ai", "\u0D4B": "o", "\u0D4C": "au",
  "\u0D4D": "", "\u0D57": "",
  "\u0D66": "0", "\u0D67": "1", "\u0D68": "2", "\u0D69": "3",
  "\u0D6A": "4", "\u0D6B": "5", "\u0D6C": "6", "\u0D6D": "7",
  "\u0D6E": "8", "\u0D6F": "9",
};

function transliterate(text) {
  let result = "";
  for (const ch of text) {
    const code = ch.codePointAt(0);
    if (code >= 0x0D00 && code <= 0x0D7F) {
      const mapped = ML_MAP[ch] ?? "";
      result += mapped;
    } else {
      result += ch;
    }
  }
  return result;
}

export function slugify(text) {
  if (!text) return "";
  return transliterate(text)
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}
