<?php
declare(strict_types=1);

// Apache/Hostinger bridge for /post/:slug. It keeps serving the existing React
// application while putting per-article Open Graph tags in the initial HTML.
const SITE_URL = 'https://demo.malayalamitharam.in';
const API_URL = 'https://api.malayalamitharam.in/api/news/';
const UPLOADS_URL = 'https://api.malayalamitharam.in';
const SITE_NAME = 'Malayalamitram';
const DEFAULT_SOCIAL_IMAGE = SITE_URL . '/images/malayala-mitra-banner.jpeg';

function escape_html(string $value): string {
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function clean_text($value): string {
    $text = html_entity_decode(strip_tags((string) $value), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    return trim((string) preg_replace('/\s+/u', ' ', $text));
}

function preview_description(array $article): string {
    $body = is_array($article['body'] ?? null) ? implode(' ', $article['body']) : '';
    $text = clean_text($article['excerpt'] ?? $article['content'] ?? $body ?? $article['title'] ?? '');
    if (function_exists('mb_strimwidth')) {
        return mb_strimwidth($text, 0, 155, '…', 'UTF-8');
    }
    // Do not byte-truncate Malayalam when mbstring is unavailable.
    return $text;
}

function absolute_image(string $image): string {
    $image = trim($image);
    if ($image === '') return DEFAULT_SOCIAL_IMAGE;
    if (str_starts_with($image, '//')) return 'https:' . $image;
    if (preg_match('#^https?://#i', $image)) return preg_replace('#^http:#i', 'https:', $image);
    if (str_starts_with($image, '/uploads/') || str_starts_with($image, 'uploads/')) {
        return UPLOADS_URL . '/' . ltrim($image, '/');
    }
    return SITE_URL . '/' . ltrim($image, '/');
}

function fetch_article(string $slug): ?array {
    $url = API_URL . rawurlencode($slug);
    $body = false;
    if (function_exists('curl_init')) {
        $curl = curl_init($url);
        curl_setopt_array($curl, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_HTTPHEADER => ['Accept: application/json'],
        ]);
        $body = curl_exec($curl);
        $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
        curl_close($curl);
        if ($status !== 200) return null;
    } else {
        $body = @file_get_contents($url);
    }
    if (!is_string($body) || $body === '') return null;
    $article = json_decode($body, true);
    return is_array($article) && !empty($article['title']) ? $article : null;
}

function without_social_meta(string $html): string {
    $html = preg_replace('/<meta[^>]+(?:property="(?:og|article):[^"]+"|name="twitter:[^"]+")[^>]*>\s*/i', '', $html);
    $html = preg_replace('/<link[^>]+rel="canonical"[^>]*>\s*/i', '', $html);
    return preg_replace('/<meta[^>]+name="description"[^>]*>\s*/i', '', $html);
}

$index = @file_get_contents(__DIR__ . '/index.html');
if (!is_string($index)) {
    http_response_code(500);
    exit('Application HTML is unavailable.');
}

$slug = rawurldecode((string) ($_GET['slug'] ?? ''));
$article = $slug !== '' ? fetch_article($slug) : null;
if ($article === null) {
    http_response_code(404);
    header('Content-Type: text/html; charset=UTF-8');
    echo without_social_meta($index);
    exit;
}

$title = trim((string) $article['title']);
$description = preview_description($article);
$image = absolute_image((string) ($article['image'] ?? $article['thumbnail'] ?? ''));
$url = SITE_URL . '/post/' . rawurlencode($slug);
$published = !empty($article['createdAt']) ? '<meta property="article:published_time" content="' . escape_html((string) $article['createdAt']) . '" />' : '';

$tags = '\n    <link rel="canonical" href="' . escape_html($url) . '" />'
    . '\n    <meta name="description" content="' . escape_html($description) . '" />'
    . '\n    <meta property="og:type" content="article" />'
    . '\n    <meta property="og:title" content="' . escape_html($title) . '" />'
    . '\n    <meta property="og:description" content="' . escape_html($description) . '" />'
    . '\n    <meta property="og:image" content="' . escape_html($image) . '" />'
    . '\n    <meta property="og:image:secure_url" content="' . escape_html($image) . '" />'
    . '\n    <meta property="og:url" content="' . escape_html($url) . '" />'
    . '\n    <meta property="og:site_name" content="' . SITE_NAME . '" />'
    . $published
    . '\n    <meta name="twitter:card" content="summary_large_image" />'
    . '\n    <meta name="twitter:title" content="' . escape_html($title) . '" />'
    . '\n    <meta name="twitter:description" content="' . escape_html($description) . '" />'
    . '\n    <meta name="twitter:image" content="' . escape_html($image) . '" />';

header('Content-Type: text/html; charset=UTF-8');
echo str_replace('</head>', $tags . "\n  </head>", without_social_meta($index));
