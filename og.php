<?php
$SITE_URL = getenv('SITE_URL') ?: 'https://demo.malayalamitharam.in';
$SITE_URL = rtrim($SITE_URL, '/');
$SITE_NAME = getenv('SITE_NAME') ?: 'Malayalamitram';
$DEFAULT_IMAGE = $SITE_URL . '/images/malayalamithram-logo.png';
$API_BASE = getenv('BACKEND_API_URL') ?: getenv('API_URL') ?: 'https://api.malayalamitharam.in/api';
$API_BASE = rtrim($API_BASE, '/');

$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$path = parse_url($requestUri, PHP_URL_PATH);
$slug = '';
if (preg_match('#^/(post|news)/([^/]+)/?#', $path, $m)) {
    $slug = urldecode($m[2]);
}
$slug = trim($slug);
if ($slug === '') {
    http_response_code(404);
    readfile(__DIR__ . '/index.html');
    exit;
}

function esc($s) {
    return htmlspecialchars($s ?? '', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
function absImage($img, $siteUrl, $defaultImage) {
    $img = trim($img ?? '');
    if ($img === '' || stripos($img, 'data:') === 0) return $defaultImage;
    if (preg_match('#^https?://#i', $img)) return $img;
    if (strpos($img, '//') === 0) return 'https:' . $img;
    if ($img[0] !== '/') $img = '/' . $img;
    return $siteUrl . $img;
}
function fetchJson($url) {
    $data = null;
    if (ini_get('allow_url_fopen')) {
        $ctx = stream_context_create([
            'http' => ['timeout' => 4, 'ignore_errors' => true, 'header' => "User-Agent: Malayalamitram-OG/1.0\r\nAccept: application/json\r\n"],
            'ssl' => ['verify_peer' => false, 'verify_peer_name' => false]
        ]);
        $data = @file_get_contents($url, false, $ctx);
    }
    if (($data === false || $data === '' || $data === null) && function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT => 4,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_USERAGENT => 'Malayalamitram-OG/1.0',
            CURLOPT_HTTPHEADER => ['Accept: application/json']
        ]);
        $data = curl_exec($ch);
        curl_close($ch);
    }
    if ($data === false || $data === '' || $data === null) return null;
    $json = json_decode($data, true);
    if (json_last_error() !== JSON_ERROR_NONE) return null;
    return $json;
}
function findArticle($apiBase, $slug) {
    $enc = rawurlencode($slug);
    $candidates = [
        $apiBase . '/news/slug/' . $enc,
        $apiBase . '/news/' . $enc,
        $apiBase . '/news/eng-slug/' . $enc,
        $apiBase . '/news/title-slug/' . $enc,
    ];
    foreach ($candidates as $url) {
        $res = fetchJson($url);
        if (!$res) continue;
        $doc = $res['article'] ?? $res['news'] ?? $res['data'] ?? $res;
        if (is_array($doc) && isset($doc['title'])) return $doc;
        if (is_array($doc) && isset($doc[0]['title'])) return $doc[0];
    }
    return null;
}

$article = findArticle($API_BASE, $slug);

if (!$article || empty($article['title'])) {
    $index = __DIR__ . '/index.html';
    if (file_exists($index)) {
        http_response_code(200);
        readfile($index);
    } else {
        http_response_code(404);
        echo 'Not found';
    }
    exit;
}

$title = trim(strip_tags($article['title'] ?? ''));
$excerpt = trim(strip_tags($article['excerpt'] ?? $article['content'] ?? $article['title'] ?? ''));
$excerpt = preg_replace('/\s+/', ' ', $excerpt);
if (mb_strlen($excerpt) > 155) $excerpt = mb_substr($excerpt, 0, 154) . '…';
if ($excerpt === '') $excerpt = $title;
$image = absImage($article['image'] ?? '', $SITE_URL, $DEFAULT_IMAGE);
$url = $SITE_URL . '/post/' . rawurlencode($slug);
$published = $article['createdAt'] ?? $article['date'] ?? '';
$iso = '';
if ($published) {
    $ts = strtotime($published);
    if ($ts) $iso = gmdate('c', $ts);
}

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: public, max-age=600, s-maxage=600');
?>
<!doctype html>
<html lang="ml">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link rel="icon" type="image/png" href="/images/favicon.png" />
<title><?= esc($title . ' | ' . $SITE_NAME) ?></title>
<meta name="description" content="<?= esc($excerpt) ?>" />
<link rel="canonical" href="<?= esc($url) ?>" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="<?= esc($SITE_NAME) ?>" />
<meta property="og:title" content="<?= esc($title) ?>" />
<meta property="og:description" content="<?= esc($excerpt) ?>" />
<meta property="og:url" content="<?= esc($url) ?>" />
<meta property="og:image" content="<?= esc($image) ?>" />
<meta property="og:image:secure_url" content="<?= esc($image) ?>" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="<?= esc($title) ?>" />
<?php if ($iso): ?><meta property="article:published_time" content="<?= esc($iso) ?>" /><?php endif; ?>
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="<?= esc($title) ?>" />
<meta name="twitter:description" content="<?= esc($excerpt) ?>" />
<meta name="twitter:image" content="<?= esc($image) ?>" />
<meta name="twitter:image:alt" content="<?= esc($title) ?>" />
<meta name="twitter:url" content="<?= esc($url) ?>" />
<script type="application/ld+json"><?= json_encode([
    '@context' => 'https://schema.org',
    '@type' => 'NewsArticle',
    'headline' => $title,
    'description' => $excerpt,
    'image' => [$image],
    'datePublished' => $iso ?: null,
    'dateModified' => $iso ?: null,
    'url' => $url,
    'mainEntityOfPage' => ['@type' => 'WebPage', '@id' => $url],
    'publisher' => ['@type' => 'Organization', 'name' => $SITE_NAME, 'logo' => ['@type' => 'ImageObject', 'url' => $DEFAULT_IMAGE]]
], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) ?></script>
<style>body{font-family:system-ui,sans-serif;padding:2rem;max-width:720px;margin:auto}</style>
</head>
<body>
<p><a href="<?= esc($url) ?>">Continue reading &rarr;</a></p>
<h1><?= esc($title) ?></h1>
<?php if ($image !== $DEFAULT_IMAGE): ?><img src="<?= esc($image) ?>" alt="<?= esc($title) ?>" style="max-width:100%;height:auto" /><?php endif; ?>
<p><?= esc($excerpt) ?></p>
<p><a href="<?= esc($url) ?>"><?= esc($url) ?></a></p>
<script>if(!/facebookexternalhit|WhatsApp|TwitterBot|TelegramBot|LinkedInBot|Slackbot|Discordbot|vkShare|Google-InspectionTool/i.test(navigator.userAgent)){window.location.replace("<?= esc($url) ?>");}</script>
</body>
</html>
