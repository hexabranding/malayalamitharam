const MALAYALAM_MONTHS = [
  "മേടം", "ഇടവം", "മിഥുനം", "കര്‍ക്കടകം",
  "ചിങ്ങം", "കന്നി", "തുലാം", "വൃശ്ചികം",
  "ധനു", "മകരം", "കുംഭം", "മീനം"
];

const MALAYALAM_WEEKDAYS = [
  "ഞായറാഴ്ച", "തിങ്കളാഴ്ച", "ചൊവ്വാഴ്ച", "ബുധനാഴ്ച",
  "വ്യാഴാഴ്ച", "വെള്ളിയാഴ്ച", "ശനിയാഴ്ച"
];

const HIJRI_MONTHS_ML = [
  "മുഹറം", "സഫർ", "റബീഉൽ അവ്വൽ", "റബീഉൽ ആഖിർ",
  "ജുമാദ ഉൽ ഉലാ", "ജുമാദ ഉൽ ആഖിറ", "റജബ്", "ശഅബാൻ",
  "റമദാൻ", "ശവ്വൽ", "ദുൽ ഖഅദ്", "ദുൽ ഹിജ്ജ"
];

const GREGORIAN_MONTHS_ML = [
  "ജനുവരി", "ഫെബ്രുവരി", "മാർച്ച്", "ഏപ്രിൽ",
  "മേയ്", "ജൂൺ", "ജൂലൈ", "ഓഗസ്റ്റ്",
  "സെപ്തംബർ", "ഒക്ടോബർ", "നവംബർ", "ഡിസംബർ"
];

function toJulianDay(year, month, day) {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

function gregorianToHijri(date) {
  const jd = toJulianDay(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const l2 = l - 10631 * n + 354;
  const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) +
            Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
  const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
             Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const hm = Math.floor((24 * l3) / 709);
  const hd = l3 - Math.floor((709 * hm) / 24);
  const hy = 30 * n + j - 30;
  return { year: hy, month: hm, day: hd };
}

function getVishuDate(year) {
  const a14 = new Date(Date.UTC(year, 3, 14));
  const jd14 = toJulianDay(year, 4, 14);
  const dow = (jd14 + 1) % 7;
  if (dow === 1 || dow === 2) return new Date(Date.UTC(year, 3, 15));
  return new Date(Date.UTC(year, 3, 14));
}

export function getKollavarsham(date = new Date()) {
  const gy = date.getFullYear();
  const gm = date.getMonth() + 1;
  const gd = date.getDate();
  const jd = toJulianDay(gy, gm, gd);
  const vishuCurrent = getVishuDate(gy);
  const vishuNext = getVishuDate(gy + 1);
  const currentJD = jd;
  const vishuCurrentJD = toJulianDay(vishuCurrent.getFullYear(), vishuCurrent.getMonth() + 1, vishuCurrent.getDate());

  const isAfterVishu = currentJD >= vishuCurrentJD;
  const ksYear = isAfterVishu ? gy - 824 : gy - 825;

  const monthLengths = [31, 31, 32, 29, 30, 30, 29, 29, 30, 30, 29, 30];
  let ksMonth = 0;
  let ksDay = 1;
  let daysSinceVishu = currentJD - vishuCurrentJD;
  if (daysSinceVishu < 0) {
    const prevVishu = getVishuDate(gy - 1);
    const prevVishuJD = toJulianDay(prevVishu.getFullYear(), prevVishu.getMonth() + 1, prevVishu.getDate());
    daysSinceVishu = currentJD - prevVishuJD;
  }

  let accumulated = 0;
  for (let i = 0; i < 12; i++) {
    if (daysSinceVishu < accumulated + monthLengths[i]) {
      ksMonth = i;
      ksDay = daysSinceVishu - accumulated + 1;
      break;
    }
    accumulated += monthLengths[i];
  }

  return {
    day: ksDay,
    month: MALAYALAM_MONTHS[ksMonth],
    monthIndex: ksMonth,
    year: ksYear,
    weekday: MALAYALAM_WEEKDAYS[(jd + 1) % 7],
    formatted: `${MALAYALAM_MONTHS[ksMonth]} ${ksDay}, ${ksYear}`
  };
}

export function getHijriDate(date = new Date()) {
  const h = gregorianToHijri(date);
  return {
    day: h.day,
    month: HIJRI_MONTHS_ML[h.month - 1] || HIJRI_MONTHS_ML[0],
    monthIndex: h.month,
    year: h.year,
    formatted: `${h.day} ${HIJRI_MONTHS_ML[h.month - 1] || HIJRI_MONTHS_ML[0]} ${h.year}`
  };
}

export function getGregorianDate(date = new Date()) {
  const weekday = MALAYALAM_WEEKDAYS[date.getDay()];
  const day = date.getDate();
  const month = GREGORIAN_MONTHS_ML[date.getMonth()];
  const year = date.getFullYear();
  return {
    weekday,
    day,
    month,
    year,
    formatted: `${weekday}, ${day} ${month} ${year}`
  };
}
