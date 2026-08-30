const ALLOWED_HOSTS = new Set([
  "youtube.com","www.youtube.com","m.youtube.com","youtu.be","www.youtu.be","youtube-nocookie.com","www.youtube-nocookie.com",
  "vimeo.com","www.vimeo.com","player.vimeo.com",
  "dailymotion.com","www.dailymotion.com","dai.ly","www.dai.ly",
  "facebook.com","www.facebook.com","fb.watch","www.fb.watch","fb.com","www.fb.com",
  "instagram.com","www.instagram.com",
  "tiktok.com","www.tiktok.com","vm.tiktok.com","m.tiktok.com","vt.tiktok.com",
  "x.com","www.x.com","twitter.com","www.twitter.com"
]);

function isSafeVideoUrl(url) {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (/^(javascript|data|file|vbscript):/i.test(trimmed)) return false;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    return true;
  } catch { return false; }
}

function detectPlatform(url) {
  if (!isSafeVideoUrl(url)) return "unknown";
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    const href = url.toLowerCase();
    if (host.includes("youtu.be") || host.includes("youtube.com") || host.includes("youtube-nocookie.com")) {
      if (href.includes("/shorts/")) return "youtube-shorts";
      return "youtube";
    }
    if (host.includes("vimeo.com")) return "vimeo";
    if (host.includes("dailymotion.com") || host === "dai.ly") return "dailymotion";
    if (host.includes("facebook.com") || host.includes("fb.watch") || host === "fb.com") return "facebook";
    if (host.includes("instagram.com")) return "instagram";
    if (host.includes("tiktok.com")) return "tiktok";
    if (host.includes("x.com") || host.includes("twitter.com")) return "twitter";
    if (href.includes("/embed/") || href.includes("player.")) return "embed";
    return "generic";
  } catch { return "unknown"; }
}

function sanitizeRelatedVideos(videos) {
  if (!Array.isArray(videos)) return [];
  const out = [];
  for (const v of videos) {
    if (!v || typeof v.videoUrl !== "string") continue;
    const url = v.videoUrl.trim();
    if (!isSafeVideoUrl(url)) continue;
    const platform = detectPlatform(url);
    if (platform === "unknown") continue;
    out.push({
      title: String(v.title || "").trim().slice(0, 200),
      videoUrl: url,
      thumbnail: String(v.thumbnail || "").trim().slice(0, 500),
      platform
    });
  }
  return out;
}

module.exports = { isSafeVideoUrl, detectPlatform, sanitizeRelatedVideos, ALLOWED_HOSTS };
