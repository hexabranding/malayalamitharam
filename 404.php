<?php
header('Content-Type: text/html; charset=utf-8');
http_response_code(200);
readfile(__DIR__ . '/index.html');
exit;
