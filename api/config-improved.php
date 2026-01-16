<?php
/**
 * Motor Bersih POS - Improved Configuration
 * Date: January 16, 2026
 * Features: Environment variables, better error handling, enhanced security
 */

// Load environment variables
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
            list($name, $value) = explode('=', $line, 2);
            $name = trim($name);
            $value = trim($value);
            putenv("$name=$value");
            $_ENV[$name] = $value;
        }
    }
}

// ============================================================
// DATABASE CONFIGURATION
// ============================================================
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASSWORD') ?: '');
define('DB_NAME', getenv('DB_NAME') ?: 'motowash_db');
define('DB_CHARSET', getenv('DB_CHARSET') ?: 'utf8mb4');

// ============================================================
// APPLICATION CONFIGURATION
// ============================================================
define('APP_NAME', getenv('APP_NAME') ?: 'Motor Bersih POS');
define('APP_VERSION', getenv('APP_VERSION') ?: '2.0');
define('APP_ENV', getenv('APP_ENV') ?: 'development');
define('APP_TIMEZONE', getenv('APP_TIMEZONE') ?: 'Asia/Jakarta');

// ============================================================
// SECURITY CONFIGURATION
// ============================================================
define('JWT_SECRET', getenv('JWT_SECRET') ?: 'change-me-in-production');
define('ALLOWED_ORIGINS', getenv('ALLOWED_ORIGINS') ?: '*');
define('API_RATE_LIMIT', getenv('API_RATE_LIMIT') ?: 100);
define('LOGIN_RATE_LIMIT', getenv('LOGIN_RATE_LIMIT') ?: 5);

// ============================================================
// ERROR HANDLING AND TIMEZONE
// ============================================================
if (APP_ENV === 'development') {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(E_ALL & ~E_WARNING & ~E_NOTICE);
    ini_set('display_errors', 0);
}

date_default_timezone_set(APP_TIMEZONE);

// ============================================================
// CORS AND SECURITY HEADERS
// ============================================================
header('Content-Type: application/json; charset=UTF-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

// CORS Configuration
$allowedOrigins = explode(',', ALLOWED_ORIGINS);
$requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (ALLOWED_ORIGINS === '*' || in_array($requestOrigin, $allowedOrigins)) {
    header('Access-Control-Allow-Origin: ' . ($requestOrigin ?: '*'));
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH');
    header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With, X-API-Key');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 3600');
}

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ============================================================
// DATABASE CONNECTION FUNCTION
// ============================================================
function getConnection() {
    try {
        $dsn = sprintf(
            "mysql:host=%s;port=%s;dbname=%s;charset=%s",
            DB_HOST,
            DB_PORT,
            DB_NAME,
            DB_CHARSET
        );

        $conn = new PDO(
            $dsn,
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::ATTR_PERSISTENT => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
            ]
        );

        return $conn;
    } catch (PDOException $e) {
        http_response_code(503);
        echo json_encode([
            'success' => false,
            'error' => 'Database connection failed',
            'message' => APP_ENV === 'development' ? $e->getMessage() : 'Unable to connect to database'
        ]);
        logMessage('DATABASE_ERROR', [
            'error' => $e->getMessage(),
            'host' => DB_HOST,
            'database' => DB_NAME
        ]);
        exit();
    }
}

// ============================================================
// AUTHENTICATION FUNCTIONS
// ============================================================

/**
 * Check if request has valid authorization
 * @return array|false User data if valid, false otherwise
 */
function checkAuth() {
    $token = getBearerToken();
    if (!$token) {
        return false;
    }
    
    $decoded = verifyToken($token);
    return $decoded ?: false;
}

/**
 * Get Bearer token from Authorization header
 * @return string|null Token string or null
 */
function getBearerToken() {
    $headers = getallheaders();
    
    if (isset($headers['Authorization'])) {
        $parts = explode(' ', $headers['Authorization']);
        if (count($parts) === 2 && $parts[0] === 'Bearer') {
            return $parts[1];
        }
    }
    
    return null;
}

/**
 * Verify JWT token
 * @param string $token Token to verify
 * @return array|false Decoded token data or false
 */
function verifyToken($token) {
    if (!$token || !is_string($token)) {
        return false;
    }
    
    try {
        // For now, using base64 (demo). In production, use proper JWT library
        $decoded = json_decode(base64_decode($token), true);
        
        if (!is_array($decoded)) {
            return false;
        }
        
        // Check expiry
        if (isset($decoded['exp']) && $decoded['exp'] < time()) {
            logMessage('TOKEN_EXPIRED', ['exp' => $decoded['exp']]);
            return false;
        }
        
        return $decoded;
    } catch (Exception $e) {
        logMessage('TOKEN_VERIFY_ERROR', ['error' => $e->getMessage()]);
        return false;
    }
}

/**
 * Check if user has required role
 * @param array $user User data from token
 * @param array $requiredRoles Array of required roles
 * @return bool True if user has one of the required roles
 */
function hasRole($user, $requiredRoles) {
    if (!is_array($user) || !isset($user['role'])) {
        return false;
    }
    
    return in_array($user['role'], $requiredRoles);
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Send JSON response
 * @param bool $success Success status
 * @param mixed $data Response data
 * @param string $message Message
 * @param int $httpCode HTTP status code
 */
function sendResponse($success, $data = null, $message = '', $httpCode = 200) {
    http_response_code($httpCode);
    
    $response = [
        'success' => $success,
        'timestamp' => date('Y-m-d H:i:s'),
        'timezone' => APP_TIMEZONE
    ];
    
    if ($message) {
        $response['message'] = $message;
    }
    
    if ($data !== null) {
        $response['data'] = $data;
    }
    
    echo json_encode($response);
    exit();
}

/**
 * Send error response
 * @param string $error Error message
 * @param int $httpCode HTTP status code
 * @param mixed $details Additional error details
 */
function sendError($error, $httpCode = 400, $details = null) {
    http_response_code($httpCode);
    
    $response = [
        'success' => false,
        'error' => $error,
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    if ($details && APP_ENV === 'development') {
        $response['details'] = $details;
    }
    
    echo json_encode($response);
    exit();
}

/**
 * Validate required fields in data
 * @param array $data Data to validate
 * @param array $requiredFields Required field names
 * @return bool|string True if valid, error message otherwise
 */
function validateRequired($data, $requiredFields) {
    foreach ($requiredFields as $field) {
        if (!isset($data[$field]) || ($data[$field] === '' && $data[$field] !== 0)) {
            return "Field '$field' is required";
        }
    }
    return true;
}

/**
 * Get request data (JSON or form)
 * @return array Request data
 */
function getRequestData() {
    if ($_SERVER['CONTENT_TYPE'] === 'application/json') {
        $input = file_get_contents('php://input');
        return json_decode($input, true) ?? [];
    }
    
    return $_REQUEST ?? [];
}

/**
 * Log message to file
 * @param string $message Log message
 * @param mixed $data Additional data
 * @param string $level Log level (DEBUG, INFO, WARNING, ERROR)
 */
function logMessage($message, $data = null, $level = 'INFO') {
    $logDir = __DIR__ . '/../logs';
    
    if (!is_dir($logDir)) {
        mkdir($logDir, 0777, true);
    }
    
    $logFile = $logDir . '/' . date('Y-m-d') . '.log';
    
    $logEntry = sprintf(
        "[%s] [%s] %s",
        date('Y-m-d H:i:s'),
        $level,
        $message
    );
    
    if ($data) {
        $logEntry .= ' | Data: ' . json_encode($data);
    }
    
    $logEntry .= PHP_EOL;
    
    file_put_contents($logFile, $logEntry, FILE_APPEND);
    
    // Also log to API errors file for all errors
    if ($level === 'ERROR') {
        $errorFile = $logDir . '/errors.log';
        file_put_contents($errorFile, $logEntry, FILE_APPEND);
    }
}

/**
 * Hash password using bcrypt
 * @param string $password Plain text password
 * @return string Hashed password
 */
function hashPassword($password) {
    return password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
}

/**
 * Verify password against hash
 * @param string $password Plain text password
 * @param string $hash Password hash
 * @return bool True if password matches
 */
function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}

/**
 * Sanitize input string
 * @param string $input Input string
 * @return string Sanitized string
 */
function sanitizeInput($input) {
    return trim(htmlspecialchars($input, ENT_QUOTES, 'UTF-8'));
}

/**
 * Generate random token
 * @param int $length Token length
 * @return string Random token
 */
function generateToken($length = 32) {
    return bin2hex(random_bytes($length / 2));
}

/**
 * Check rate limiting
 * @param string $identifier Unique identifier (IP, user, etc.)
 * @param int $limit Requests limit
 * @param int $window Time window in seconds
 * @return bool True if within limit
 */
function checkRateLimit($identifier, $limit = API_RATE_LIMIT, $window = 60) {
    $cacheFile = __DIR__ . '/../cache/' . md5($identifier) . '.cache';
    $cacheDir = dirname($cacheFile);
    
    if (!is_dir($cacheDir)) {
        mkdir($cacheDir, 0777, true);
    }
    
    $now = time();
    $requests = [];
    
    if (file_exists($cacheFile)) {
        $data = json_decode(file_get_contents($cacheFile), true);
        $requests = array_filter($data['requests'] ?? [], function($time) use ($now, $window) {
            return $time > ($now - $window);
        });
    }
    
    if (count($requests) >= $limit) {
        return false;
    }
    
    $requests[] = $now;
    file_put_contents($cacheFile, json_encode(['requests' => $requests]));
    
    return true;
}

/**
 * Get client IP address
 * @return string Client IP
 */
function getClientIP() {
    if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
        $ip = $_SERVER['HTTP_CLIENT_IP'];
    } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ip = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0];
    } else {
        $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    }
    
    return filter_var($ip, FILTER_VALIDATE_IP) ? $ip : '';
}

// ============================================================
// INITIALIZATION
// ============================================================

// Log startup
logMessage('API_REQUEST', [
    'method' => $_SERVER['REQUEST_METHOD'],
    'path' => $_SERVER['REQUEST_URI'],
    'ip' => getClientIP(),
    'env' => APP_ENV
], 'DEBUG');

// Add PHP headers for better compatibility
header('Pragma: public');
header('Cache-Control: public, must-revalidate, max-age=0');

?>
