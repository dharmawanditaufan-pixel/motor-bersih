<?php
/**
 * Motor Bersih POS - Production Configuration
 * For Railway MySQL deployment
 * Date: January 17, 2026
 */

// Production Database Configuration (Railway)
// These values should be set as environment variables in Railway
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_NAME', getenv('DB_NAME') ?: 'motowash_db');
define('DB_PORT', getenv('DB_PORT') ?: '3306');

// Security configuration
define('LOGIN_RATE_LIMIT', 5);
define('RATE_LIMIT_WINDOW', 60);

// Production mode - disable error display
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../logs/php_errors.log');

// Timezone
date_default_timezone_set('Asia/Jakarta');

// CORS headers - Allow Vercel frontend
$allowedOrigins = [
    'https://motor-bersih-pos.vercel.app',
    'http://localhost:3000',
    'http://localhost'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header('Access-Control-Allow-Origin: *'); // Fallback for development
}

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database connection function
function getConnection() {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $conn = new PDO(
            $dsn,
            DB_USER,
            DB_PASS,
            array(
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
            )
        );
        return $conn;
    } catch(PDOException $e) {
        // Log error without exposing details in production
        error_log('Database connection failed: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Database connection failed',
            'message' => 'Unable to connect to database. Please contact administrator.'
        ]);
        exit();
    }
}

/**
 * Get request data from POST body
 */
function getRequestData() {
    $input = file_get_contents('php://input');
    
    if (empty($input)) {
        return [];
    }
    
    $data = json_decode($input, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log('JSON decode error: ' . json_last_error_msg());
        return [];
    }
    
    return $data ?: [];
}

/**
 * Validate required fields
 */
function validateRequired($data, $required) {
    foreach ($required as $field) {
        if (!isset($data[$field]) || (is_string($data[$field]) && empty(trim($data[$field])))) {
            return "Field '$field' is required";
        }
    }
    return true;
}

/**
 * Sanitize input data
 */
function sanitizeInput($input) {
    if (is_array($input)) {
        return array_map('sanitizeInput', $input);
    }
    return htmlspecialchars(strip_tags(trim($input)), ENT_QUOTES, 'UTF-8');
}

/**
 * Send error response
 */
function sendError($message, $code = 400) {
    http_response_code($code);
    echo json_encode([
        'success' => false,
        'error' => $message,
        'code' => $code
    ]);
    exit();
}

/**
 * Check authentication token
 */
function checkAuth() {
    // Start session if not started
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    // Check for Authorization header
    $headers = getallheaders();
    $token = null;
    
    if (isset($headers['Authorization'])) {
        $authHeader = $headers['Authorization'];
        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            $token = $matches[1];
        }
    }
    
    // Validate token (simple session-based for demo)
    if (!$token && empty($_SESSION['user_id'])) {
        return false;
    }
    
    // Return user from session
    if (!empty($_SESSION['user_id'])) {
        return [
            'id' => $_SESSION['user_id'],
            'username' => $_SESSION['username'] ?? '',
            'role' => $_SESSION['role'] ?? 'operator',
            'name' => $_SESSION['name'] ?? ''
        ];
    }
    
    return false;
}

/**
 * Log message to file
 */
function logMessage($action, $data = [], $level = 'INFO') {
    $logDir = __DIR__ . '/../logs';
    if (!is_dir($logDir)) {
        @mkdir($logDir, 0755, true);
    }
    
    $logFile = $logDir . '/app.log';
    $timestamp = date('Y-m-d H:i:s');
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $user = $_SESSION['username'] ?? 'anonymous';
    
    $message = sprintf(
        "[%s] %s - %s - User: %s - IP: %s - Data: %s\n",
        $timestamp,
        $level,
        $action,
        $user,
        $ip,
        json_encode($data)
    );
    
    @file_put_contents($logFile, $message, FILE_APPEND);
}

/**
 * Rate limiting check
 */
function checkRateLimit($key, $limit, $window) {
    if (!isset($_SESSION['rate_limit'])) {
        $_SESSION['rate_limit'] = [];
    }
    
    $now = time();
    $windowStart = $now - $window;
    
    // Clean old entries
    if (isset($_SESSION['rate_limit'][$key])) {
        $_SESSION['rate_limit'][$key] = array_filter(
            $_SESSION['rate_limit'][$key],
            function($timestamp) use ($windowStart) {
                return $timestamp > $windowStart;
            }
        );
    } else {
        $_SESSION['rate_limit'][$key] = [];
    }
    
    // Check limit
    if (count($_SESSION['rate_limit'][$key]) >= $limit) {
        return false;
    }
    
    // Add current attempt
    $_SESSION['rate_limit'][$key][] = $now;
    
    return true;
}

/**
 * Get client IP address
 */
function getClientIP() {
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ip = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0];
    } elseif (!empty($_SERVER['HTTP_X_REAL_IP'])) {
        $ip = $_SERVER['HTTP_X_REAL_IP'];
    } else {
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    }
    return trim($ip);
}
