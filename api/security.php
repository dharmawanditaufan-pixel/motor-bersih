<?php
/**
 * Enhanced Security Module for Motor Bersih
 * - JWT Token generation and validation
 * - CSRF Protection with tokens
 * - Input validation and sanitization
 * - Rate limiting
 * - Password hashing with bcrypt (Phase 2)
 */

// Session start and configuration
session_start();

// Define constants
define('SESSION_TIMEOUT', 3600); // 1 hour
define('CSRF_TOKEN_NAME', 'csrf_token');
define('CSRF_TOKEN_LIFETIME', 3600); // 1 hour
define('RATE_LIMIT_ATTEMPTS', 5);
define('RATE_LIMIT_WINDOW', 300); // 5 minutes
define('JWT_SECRET', 'motor-bersih-secret-key-2026'); // Should be in .env
define('JWT_EXPIRY', 86400); // 24 hours

/**
 * Generate JWT Token for authenticated users
 */
function generateJWT($payload) {
    // Header
    $header = [
        'alg' => 'HS256',
        'typ' => 'JWT'
    ];

    // Add expiry and issued at
    $payload['iat'] = time();
    $payload['exp'] = time() + JWT_EXPIRY;

    // Encode header and payload
    $headerEncoded = rtrim(strtr(base64_encode(json_encode($header)), '+/', '-_'), '=');
    $payloadEncoded = rtrim(strtr(base64_encode(json_encode($payload)), '+/', '-_'), '=');

    // Create signature
    $signature = hash_hmac('sha256', "$headerEncoded.$payloadEncoded", JWT_SECRET, true);
    $signatureEncoded = rtrim(strtr(base64_encode($signature), '+/', '-_'), '=');

    // Combine parts
    return "$headerEncoded.$payloadEncoded.$signatureEncoded";
}

/**
 * Verify and decode JWT Token
 */
function verifyJWT($token) {
    try {
        $parts = explode('.', $token);
        
        if (count($parts) !== 3) {
            return false;
        }

        list($header, $payload, $signature) = $parts;

        // Verify signature
        $data = "$header.$payload";
        $expectedSignature = rtrim(strtr(base64_encode(
            hash_hmac('sha256', $data, JWT_SECRET, true)
        ), '+/', '-_'), '=');

        if ($signature !== $expectedSignature) {
            return false;
        }

        // Decode payload
        $payloadDecoded = json_decode(
            base64_decode(strtr($payload, '-_', '+/') . str_repeat('=', 4 - (strlen($payload) % 4))),
            true
        );

        // Check expiry
        if (isset($payloadDecoded['exp']) && $payloadDecoded['exp'] < time()) {
            return false;
        }

        return $payloadDecoded;
    } catch (Exception $e) {
        return false;
    }
}

/**
 * Generate CSRF Token for forms
 */
function generateCSRFToken() {
    if (empty($_SESSION[CSRF_TOKEN_NAME])) {
        $_SESSION[CSRF_TOKEN_NAME] = bin2hex(random_bytes(32));
        $_SESSION[CSRF_TOKEN_NAME . '_time'] = time();
    }

    return $_SESSION[CSRF_TOKEN_NAME];
}

/**
 * Verify CSRF Token
 */
function verifyCSRFToken($token) {
    if (empty($_SESSION[CSRF_TOKEN_NAME])) {
        return false;
    }

    // Check token matches
    if ($token !== $_SESSION[CSRF_TOKEN_NAME]) {
        return false;
    }

    // Check token lifetime
    $tokenTime = $_SESSION[CSRF_TOKEN_NAME . '_time'] ?? 0;
    if (time() - $tokenTime > CSRF_TOKEN_LIFETIME) {
        return false;
    }

    return true;
}

/**
 * Sanitize and validate input
 */
function validateInput($input, $type = 'string', $required = true) {
    // Check required
    if ($required && empty($input)) {
        return false;
    }

    if (empty($input)) {
        return true;
    }

    // Type-specific validation
    switch ($type) {
        case 'email':
            return filter_var($input, FILTER_VALIDATE_EMAIL);
        
        case 'integer':
            return filter_var($input, FILTER_VALIDATE_INT) !== false;
        
        case 'phone':
            return preg_match('/^(\+62|0)[0-9]{9,12}$/', str_replace(['-', ' '], '', $input));
        
        case 'license_plate':
            // Indonesian plate: B 1234 ABC or B1234ABC
            return preg_match('/^[A-Z]{1,2}\\s?\\d{1,4}\\s?[A-Z]{1,3}$/', strtoupper($input));
        
        case 'username':
            return preg_match('/^[a-zA-Z0-9_]{3,20}$/', $input);
        
        case 'password':
            // Min 6 chars, at least 1 letter and 1 number
            return strlen($input) >= 6 && preg_match('/[0-9]/', $input) && preg_match('/[a-zA-Z]/', $input);
        
        case 'url':
            return filter_var($input, FILTER_VALIDATE_URL);
        
        case 'string':
        default:
            return strlen($input) > 0;
    }
}

/**
 * Sanitize string input (prevent XSS)
 */
function sanitizeString($input) {
    return trim(htmlspecialchars($input, ENT_QUOTES, 'UTF-8'));
}

/**
 * Hash password using bcrypt (PHP 5.5+)
 */
function hashPassword($password) {
    return password_hash($password, PASSWORD_BCRYPT, [
        'cost' => 12
    ]);
}

/**
 * Verify password against bcrypt hash
 */
function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}

/**
 * Rate limiting checker
 */
function checkRateLimit($identifier, $maxAttempts = RATE_LIMIT_ATTEMPTS, $window = RATE_LIMIT_WINDOW) {
    $cacheKey = 'rate_limit_' . md5($identifier);
    
    // Initialize in session if not exists
    if (!isset($_SESSION[$cacheKey])) {
        $_SESSION[$cacheKey] = [
            'attempts' => 0,
            'first_attempt' => time()
        ];
    }

    $data = $_SESSION[$cacheKey];
    $timeElapsed = time() - $data['first_attempt'];

    // Reset if window has passed
    if ($timeElapsed > $window) {
        $_SESSION[$cacheKey] = [
            'attempts' => 0,
            'first_attempt' => time()
        ];
        return true;
    }

    // Check if exceeded limit
    if ($data['attempts'] >= $maxAttempts) {
        return false;
    }

    // Increment attempts
    $_SESSION[$cacheKey]['attempts']++;
    return true;
}

/**
 * Generate security headers
 */
function setSecurityHeaders() {
    // Prevent XSS attacks
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('X-XSS-Protection: 1; mode=block');
    
    // Content Security Policy
    header("Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com; img-src 'self' data: https:; font-src 'self' https://cdnjs.cloudflare.com; connect-src 'self' https:;");
    
    // Strict Transport Security (HTTPS only)
    header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
    
    // Referrer Policy
    header('Referrer-Policy: strict-origin-when-cross-origin');
}

/**
 * Log security event
 */
function logSecurityEvent($eventType, $details = []) {
    $logFile = __DIR__ . '/../logs/security.log';
    $logDir = dirname($logFile);

    if (!is_dir($logDir)) {
        mkdir($logDir, 0777, true);
    }

    $logEntry = [
        'timestamp' => date('Y-m-d H:i:s'),
        'event_type' => $eventType,
        'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
        'details' => $details
    ];

    $logLine = json_encode($logEntry) . PHP_EOL;
    file_put_contents($logFile, $logLine, FILE_APPEND);
}

/**
 * Check session timeout
 */
function checkSessionTimeout() {
    if (!isset($_SESSION['last_activity'])) {
        $_SESSION['last_activity'] = time();
        return true;
    }

    if (time() - $_SESSION['last_activity'] > SESSION_TIMEOUT) {
        session_destroy();
        logSecurityEvent('SESSION_TIMEOUT');
        return false;
    }

    $_SESSION['last_activity'] = time();
    return true;
}

/**
 * Validate API request (check token + CSRF + rate limit)
 */
function validateAPIRequest() {
    // Get Bearer token
    $headers = getallheaders();
    $token = null;

    if (isset($headers['Authorization'])) {
        $matches = [];
        if (preg_match('/Bearer\s+(.+)/', $headers['Authorization'], $matches)) {
            $token = $matches[1];
        }
    }

    if (!$token) {
        return [
            'valid' => false,
            'error' => 'Missing authorization token',
            'code' => 401
        ];
    }

    // Verify token
    $user = verifyJWT($token);
    if (!$user) {
        logSecurityEvent('INVALID_TOKEN', ['token' => substr($token, 0, 10) . '...']);
        return [
            'valid' => false,
            'error' => 'Invalid or expired token',
            'code' => 401
        ];
    }

    // Check rate limit
    $clientId = $_SERVER['REMOTE_ADDR'] . ':' . ($_GET['user_id'] ?? 'anonymous');
    if (!checkRateLimit($clientId)) {
        logSecurityEvent('RATE_LIMIT_EXCEEDED', ['client' => $clientId]);
        return [
            'valid' => false,
            'error' => 'Too many requests. Please try again later.',
            'code' => 429
        ];
    }

    return [
        'valid' => true,
        'user' => $user,
        'code' => 200
    ];
}

/**
 * Generate secure random token
 */
function generateSecureToken($length = 32) {
    return bin2hex(random_bytes($length / 2));
}

/**
 * Validate input array
 */
function validateInputArray($data, $rules) {
    $errors = [];

    foreach ($rules as $field => $rule) {
        $value = $data[$field] ?? null;
        $ruleArray = is_array($rule) ? $rule : ['type' => $rule];

        // Check required
        if (isset($ruleArray['required']) && $ruleArray['required'] && empty($value)) {
            $errors[$field] = ucfirst($field) . ' is required';
            continue;
        }

        // Validate type
        if (!empty($value) && isset($ruleArray['type'])) {
            if (!validateInput($value, $ruleArray['type'], false)) {
                $errors[$field] = 'Invalid ' . $field;
            }
        }

        // Custom validation
        if (!empty($value) && isset($ruleArray['custom']) && is_callable($ruleArray['custom'])) {
            if (!$ruleArray['custom']($value)) {
                $errors[$field] = $ruleArray['message'] ?? 'Validation failed for ' . $field;
            }
        }
    }

    return [
        'valid' => count($errors) === 0,
        'errors' => $errors
    ];
}

// Set security headers on every response
setSecurityHeaders();

?>
