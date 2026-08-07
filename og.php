<?php
$slug = $_GET['slug'] ?? '';
if (!$slug) { header('Location: /'); exit; }

$ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
$isBot = preg_match('/bot|crawler|spider|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegram|slackbot|discordbot|googlebot|bingbot|pinterest/i', $ua);

$apiBase = 'https://api.malayalamitharam.in/api';
$siteName = 'Malayala Mitra';
$siteUrl = 'https://demo.malayalamitharam.in';
$defaultImage = $siteUrl . '/images/og-image.jpg';

$article = null;
$json = @file_get_contents($apiBase . '/news/' . rawurlencode($slug));
if ($json) { $article = json_decode($json, true); }

if (!$article || empty($article['published'])) {
  if (!$isBot) { header('Location: /post/' . $slug); exit; }
  header('HTTP/1.0 404 Not Found');
  echo 'Not Found';
  exit;
}

$ogTitle = ($article['title'] ?? $siteName) . ' | ' . $siteName;
$ogDesc = $article['excerpt'] ?? $article['title'] ?? 'Malayala Mitra - Malayalam News Portal';
$img = $article['image'] ?? '';
if ($img && strpos($img, 'http') === false) {
  $img = $apiBase . '/uploads/' . basename($img);
}
$ogImage = $img ?: $defaultImage;
$ogUrl = $siteUrl . '/post/' . $slug;

$html = file_get_contents(__DIR__ . '/index.html');
if (!$html) { header('Location: /post/' . $slug); exit; }

$html = preg_replace('/<meta property="og:title" content="[^"]*"/', '<meta property="og:title" content="' . htmlspecialchars($ogTitle) . '"', $html);
$html = preg_replace('/<meta property="og:description" content="[^"]*"/', '<meta property="og:description" content="' . htmlspecialchars($ogDesc) . '"', $html);
$html = preg_replace('/<meta property="og:image" content="[^"]*"/', '<meta property="og:image" content="' . htmlspecialchars($ogImage) . '"', $html);
$html = preg_replace('/<meta property="og:url" content="[^"]*"/', '<meta property="og:url" content="' . htmlspecialchars($ogUrl) . '"', $html);
$html = preg_replace('/<meta name="twitter:card" content="[^"]*"/', '<meta name="twitter:card" content="summary_large_image"', $html);
$html = preg_replace('/<meta name="twitter:title" content="[^"]*"/', '<meta name="twitter:title" content="' . htmlspecialchars($ogTitle) . '"', $html);
$html = preg_replace('/<meta name="twitter:description" content="[^"]*"/', '<meta name="twitter:description" content="' . htmlspecialchars($ogDesc) . '"', $html);
$html = preg_replace('/<meta name="twitter:image" content="[^"]*"/', '<meta name="twitter:image" content="' . htmlspecialchars($ogImage) . '"', $html);
$html = preg_replace('/<title>[^<]*<\/title>/', '<title>' . htmlspecialchars($ogTitle) . '</title>', $html);

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: public, max-age=300');
echo $html;
