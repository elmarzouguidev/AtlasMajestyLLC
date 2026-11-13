<?php
/**
 * Atlas Majesty LLC — send.php
 * Receives the audit and contact forms, validates them on the server and emails contact@atlasmajesty.com.
 *
 *  - POST only; answers with JSON.
 *  - Honeypot field "company_url" (hidden in the form; bots fill it, people never see it).
 *  - Rate limit per IP (file based, in the system temp folder).
 *  - Sends with PHP mail(); swap send_mail() for SMTP later without touching the rest.
 */

declare(strict_types=1);

const MAIL_TO       = 'contact@atlasmajesty.com';
const MAIL_FROM     = 'contact@atlasmajesty.com';   // must be on your own domain so mail() is not flagged as spoofed
const SITE_NAME     = 'Atlas Majesty LLC website';
const RATE_MAX      = 5;                            // submissions allowed ...
const RATE_WINDOW   = 600;                          // ... per this many seconds, per IP
const MAX_FIELD_LEN = 2000;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function respond(int $status, array $body): void
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/* ---- POST only ---- */
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405, ['ok' => false, 'message' => 'Method not allowed.']);
}

/* ---- Same-origin check (blocks cross-site posts; a missing Origin, as with plain form posts, is allowed) ---- */
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '') {
    $originHost = parse_url($origin, PHP_URL_HOST);
    $thisHost   = preg_replace('/:\d+$/', '', (string)($_SERVER['HTTP_HOST'] ?? ''));
    if (!$originHost || strcasecmp($originHost, (string)$thisHost) !== 0) {
        respond(403, ['ok' => false, 'message' => 'Request not allowed.']);
    }
}

/* ---- Honeypot: pretend success so bots learn nothing ---- */
if (trim((string)($_POST['company_url'] ?? '')) !== '') {
    respond(200, ['ok' => true]);
}

/* ---- Rate limit per IP ---- */
function client_ip(): string
{
    return (string)($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
}

function rate_limited(string $ip): bool
{
    $file = sys_get_temp_dir() . '/atlas_rl_' . hash('sha256', $ip) . '.json';
    $now  = time();
    $hits = [];
    $fh   = @fopen($file, 'c+');
    if (!$fh) {
        return false; // never block real people because the temp folder is unwritable
    }
    flock($fh, LOCK_EX);
    $raw = stream_get_contents($fh);
    if ($raw !== false && $raw !== '') {
        $decoded = json_decode($raw, true);
        if (is_array($decoded)) {
            $hits = array_values(array_filter($decoded, static fn($t) => is_int($t) && $t > $now - RATE_WINDOW));
        }
    }
    $limited = count($hits) >= RATE_MAX;
    if (!$limited) {
        $hits[] = $now;
    }
    ftruncate($fh, 0);
    rewind($fh);
    fwrite($fh, json_encode($hits));
    flock($fh, LOCK_UN);
    fclose($fh);
    return $limited;
}

if (rate_limited(client_ip())) {
    header('Retry-After: ' . RATE_WINDOW);
    respond(429, ['ok' => false, 'message' => 'Too many requests. Please wait a few minutes and try again, or email ' . MAIL_TO . '.']);
}

/* ---- Field definitions per form (same names and rules as the pages) ---- */
$forms = [
    'audit' => [
        'name'      => ['label' => 'your name',          'required' => true,  'type' => 'text'],
        'business'  => ['label' => 'your business name', 'required' => true,  'type' => 'text'],
        'website'   => ['label' => 'your website URL',   'required' => true,  'type' => 'url'],
        'email'     => ['label' => 'your email address', 'required' => true,  'type' => 'email'],
        'phone'     => ['label' => 'your phone number',  'required' => false, 'type' => 'phone'],
        'challenge' => ['label' => 'your main challenge', 'required' => false, 'type' => 'text'],
        'message'   => ['label' => 'additional details', 'required' => false, 'type' => 'text', 'multiline' => true],
        'notes'     => ['label' => 'additional notes',   'required' => false, 'type' => 'text', 'multiline' => true],
    ],
    'contact' => [
        'name'     => ['label' => 'your name',          'required' => true,  'type' => 'text'],
        'email'    => ['label' => 'your email address', 'required' => true,  'type' => 'email'],
        'business' => ['label' => 'your company',       'required' => false, 'type' => 'text'],
        'website'  => ['label' => 'your website URL',   'required' => false, 'type' => 'url'],
        'subject'  => ['label' => 'a subject',          'required' => false, 'type' => 'text'],
        'message'  => ['label' => 'your message',       'required' => true,  'type' => 'text', 'multiline' => true],
    ],
];

$formKey = (string)($_POST['form'] ?? '');
if (!isset($forms[$formKey])) {
    respond(400, ['ok' => false, 'message' => 'Unknown form.']);
}

/* ---- Validate ---- */
function clean(string $v, bool $multiline): string
{
    $v = str_replace("\0", '', $v);
    $v = $multiline ? str_replace(["\r\n", "\r"], "\n", $v) : preg_replace('/[\r\n\t]+/', ' ', $v);
    return trim(mb_substr((string)$v, 0, MAX_FIELD_LEN));
}

$values = [];
$errors = [];
foreach ($forms[$formKey] as $name => $def) {
    $raw = $_POST[$name] ?? '';
    if (is_array($raw)) {
        $raw = '';
    }
    $value = clean((string)$raw, !empty($def['multiline']));

    if ($value === '') {
        if ($def['required']) {
            $errors[$name] = 'Enter ' . $def['label'] . '.';
        }
        $values[$name] = '';
        continue;
    }

    switch ($def['type']) {
        case 'email':
            if (!filter_var($value, FILTER_VALIDATE_EMAIL) || mb_strlen($value) > 254) {
                $errors[$name] = 'Write an email address with an @, like name@company.com.';
            }
            break;
        case 'url':
            $candidate = preg_match('#^https?://#i', $value) ? $value : 'https://' . $value;
            $host = parse_url($candidate, PHP_URL_HOST);
            if (!filter_var($candidate, FILTER_VALIDATE_URL) || !$host || strpos($host, '.') === false) {
                $errors[$name] = 'Write a web address, like https://yourbusiness.com.';
            } else {
                $value = $candidate;
            }
            break;
        case 'phone':
            if (!preg_match('/^[\d\s\-+().]{7,20}$/', $value)) {
                $errors[$name] = 'Use digits only, for example 505 555 0100.';
            }
            break;
    }
    $values[$name] = $value;
}

if ($errors) {
    respond(422, ['ok' => false, 'errors' => $errors, 'message' => count($errors) === 1 ? 'One field needs attention.' : count($errors) . ' fields need attention.']);
}

/* ---- Compose and send ---- */
function send_mail(string $to, string $subject, string $body, string $replyTo): bool
{
    // Replace this function with SMTP (PHPMailer, etc.) later. Header values are already free of line breaks.
    $headers = [
        'From: ' . SITE_NAME . ' <' . MAIL_FROM . '>',
        'Reply-To: ' . $replyTo,
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'X-Mailer: PHP/' . PHP_VERSION,
    ];
    return @mail($to, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, implode("\r\n", $headers));
}

$subjects = ['audit' => 'New free SEO audit request', 'contact' => 'New contact message'];
$subject  = $subjects[$formKey] . ' — ' . $values['name'];

$lines = [$subjects[$formKey], str_repeat('-', 40)];
foreach ($forms[$formKey] as $name => $def) {
    if ($values[$name] === '') {
        continue;
    }
    $lines[] = ucfirst($name) . ': ' . (!empty($def['multiline']) ? "\n" . $values[$name] : $values[$name]);
}
$lines[] = str_repeat('-', 40);
$lines[] = 'Sent: ' . gmdate('Y-m-d H:i:s') . ' UTC';
$lines[] = 'IP: ' . client_ip();
$lines[] = 'Page: ' . mb_substr((string)($_SERVER['HTTP_REFERER'] ?? ''), 0, 300);

$replyTo = str_replace(["\r", "\n"], '', $values['email']);

if (!send_mail(MAIL_TO, $subject, implode("\n", $lines), $replyTo)) {
    error_log('send.php: mail() failed for form ' . $formKey);
    respond(500, ['ok' => false, 'message' => 'We could not send your request right now. Please try again, or email ' . MAIL_TO . '.']);
}

respond(200, ['ok' => true]);
