import { getKollavarsham, getHijriDate } from "./calendars.js";

export function toBool(value, def = true) {
  if (value === undefined || value === null || value === "") return def;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const s = String(value).trim().toLowerCase();
  if (s === "true" || s === "1" || s === "yes" || s === "on") return true;
  if (s === "false" || s === "0" || s === "no" || s === "off") return false;
  return def;
}

function isDaySet(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 1 && n <= 31;
}

function resolveDay(value, fallback) {
  return isDaySet(value) ? Number(value) : fallback;
}

function formatMalayalam(date, show, override, dayOverride) {
  const manual = typeof override === "string" ? override.trim() : "";
  if (manual) return manual;
  const k = getKollavarsham(date);
  const showDay = show.day || isDaySet(dayOverride);
  const segments = [];
  if (show.month || showDay) {
    const dm = [];
    if (show.month) dm.push(k.month);
    if (showDay) dm.push(String(resolveDay(dayOverride, k.day)));
    segments.push(dm.join(" "));
  }
  if (show.year) segments.push(String(k.year));
  let text = segments.join(", ");
  if (show.weekday) text = text ? `${k.weekday}, ${text}` : k.weekday;
  if (show.year && text) text += " കൊല്ലവർഷം";
  return text;
}

function formatArabic(date, show, lang, override, dayOverride) {
  const manual = typeof override === "string" ? override.trim() : "";
  if (manual) return { text: manual, rtl: lang === "arabic" };
  const h = getHijriDate(date);
  const month = lang === "arabic" ? h.monthAr : h.month;
  const weekday = lang === "arabic" ? h.weekdayAr : h.weekday;
  const showDay = show.day || isDaySet(dayOverride);
  const segments = [];
  if (showDay || show.month) {
    const dm = [];
    if (showDay) dm.push(String(resolveDay(dayOverride, h.day)));
    if (show.month) dm.push(month);
    segments.push(dm.join(" "));
  }
  if (show.year) segments.push(String(h.year));
  let text = segments.join(" ");
  if (show.weekday) text = text ? `${weekday}, ${text}` : weekday;
  return { text, rtl: lang === "arabic" };
}

export function buildDateDisplayItems(settings = {}, date = new Date()) {
  const order = settings.date_display_order || "kollavarsham-hijri";
  const showMalayalam = toBool(settings.show_kollavarsham, true) && order !== "hijri-only";
  const showArabic = toBool(settings.show_hijri_date, true) && order !== "kollavarsham-only";
  const lang = settings.hijri_month_lang === "arabic" ? "arabic" : "malayalam";

  const malayalamShow = {
    weekday: toBool(settings.ml_show_weekday, true),
    day: toBool(settings.ml_show_day, true),
    month: toBool(settings.ml_show_month, true),
    year: toBool(settings.ml_show_year, true),
  };
  const arabicShow = {
    weekday: toBool(settings.hijri_show_weekday, true),
    day: toBool(settings.hijri_show_day, true),
    month: toBool(settings.hijri_show_month, true),
    year: toBool(settings.hijri_show_year, true),
  };

  const malayalam = showMalayalam ? formatMalayalam(date, malayalamShow, settings.ml_date_override, settings.ml_day_override) : "";
  const arabic = showArabic ? formatArabic(date, arabicShow, lang, settings.hijri_date_override, settings.hijri_day_override) : null;

  const items = [];
  const push = (text, rtl = false) => {
    if (text && text.trim()) items.push({ text: text.trim(), rtl });
  };

  if (order === "hijri-kollavarsham") {
    if (arabic) push(arabic.text, arabic.rtl);
    push(malayalam);
  } else {
    push(malayalam);
    if (arabic) push(arabic.text, arabic.rtl);
  }

  return items;
}
