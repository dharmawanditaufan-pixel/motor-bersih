<?php
// Database configuration for Motor Bersih POS
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');           // Kosong untuk XAMPP default
define('DB_NAME', 'motowash_db'); // Database name di phpMyAdmin

// Security configuration
define('LOGIN_RATE_LIMIT', 5); // Maximum login attempts
define('RATE_LIMIT_WINDOW', 60); // Time window in seconds

// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Timezone
date_default_timezone_set('Asia/Jakarta');

// CORS headers
header('Access-Control-Allow-Origin: *');
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
        $conn = new PDO(
            "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
            DB_USER,
            DB_PASS,
            array(
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            )
        );
        return $conn;
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Database connection failed',
            'message' => $e->getMessage(),
            'config' => [
                'host' => DB_HOST,
                'database' => DB_NAME,
                'user' => DB_USER
            ]
        ]);
        exit();
    }
}

/**
 * Get request data from POST body
 * @return array Request data
 */
function getRequestData() {
    $input = file_get_contents('php://input');
    
    if (empty($input)) {
        return [];
    }
    
    $data = json_decode($input, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        return [];
    }
    
    return $data ?: [];
}

/**
 * Validate required fields in data
 * @param array $data Data to validate
 * @param array $required Required field names
 * @return bool|string True if valid, error message if invalid
 */
function validateRequired($data, $required) {
    foreach ($required as $field) {
        if (!isset($data[$field]) || empty(trim($data[$field]))) {
            return "Field '$field' is required";
        }
    }
    return true;
}

/**
 * Sanitize input data
 * @param mixed $data Data to sanitize
 * @return mixed Sanitized data
 */
function sanitizeInput($data) {
    if (is_array($data)) {
        return array_map('sanitizeInput', $data);
    }
    
    if (is_string($data)) {
        return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
    }
    
    return $data;
}

/**
 * Check rate limit for an action
 * @param string $key Unique key for the action
 * @param int $limit Maximum attempts
 * @param int $window Time window in seconds
 * @return bool True if within limit
 */
function checkRateLimit($key, $limit, $window) {
    // Simple file-based rate limiting
    $file = sys_get_temp_dir() . '/motowash_ratelimit_' . md5($key);
    
    if (!file_exists($file)) {
        file_put_contents($file, json_encode(['count' => 1, 'time' => time()]));
        return true;
    }
    
    $data = json_decode(file_get_contents($file), true);
    
    if (time() - $data['time'] > $window) {
        file_put_contents($file, json_encode(['count' => 1, 'time' => time()]));
        return true;
    }
    
    if ($data['count'] >= $limit) {
        return false;
    }
    
    $data['count']++;
    file_put_contents($file, json_encode($data));
    return true;
}

/**
 * Get client IP address
 * @return string IP address
 */
function getClientIP() {
    $ipaddress = '';
    if (isset($_SERVER['HTTP_CLIENT_IP']))
        $ipaddress = $_SERVER['HTTP_CLIENT_IP'];
    else if(isset($_SERVER['HTTP_X_FORWARDED_FOR']))
        $ipaddress = $_SERVER['HTTP_X_FORWARDED_FOR'];
    else if(isset($_SERVER['HTTP_X_FORWARDED']))
        $ipaddress = $_SERVER['HTTP_X_FORWARDED'];
    else if(isset($_SERVER['HTTP_FORWARDED_FOR']))
        $ipaddress = $_SERVER['HTTP_FORWARDED_FOR'];
    else if(isset($_SERVER['HTTP_FORWARDED']))
        $ipaddress = $_SERVER['HTTP_FORWARDED'];
    else if(isset($_SERVER['REMOTE_ADDR']))
        $ipaddress = $_SERVER['REMOTE_ADDR'];
    else
        $ipaddress = 'UNKNOWN';
    return $ipaddress;
}

/**
 * Log message to file
 * @param string $type Log type
 * @param mixed $data Data to log
 * @param string $level Log level
 */
function logMessage($type, $data = [], $level = 'INFO') {
    $logDir = __DIR__ . '/../logs';
    if (!file_exists($logDir)) {
        @mkdir($logDir, 0777, true);
    }
    
    $logFile = $logDir . '/app_' . date('Y-m-d') . '.log';
    $timestamp = date('Y-m-d H:i:s');
    $dataStr = is_array($data) ? json_encode($data) : $data;
    
    $message = "[{$timestamp}] [{$level}] {$type}: {$dataStr}" . PHP_EOL;
    @file_put_contents($logFile, $message, FILE_APPEND);
}

/**
 * Generate JWT-like token (simple base64 encoded JSON for demo)
 * @param array $user User data
 * @param int $expiresIn Token expiration in seconds (default 24 hours)
 * @return string Token
 */
function generateToken($user, $expiresIn = 86400) {
    $payload = [
        'user_id' => $user['id'],
        'username' => $user['username'],
        'name' => $user['name'],
        'role' => $user['role'],
        'issued_at' => time(),
        'expires_at' => time() + $expiresIn
    ];
    
    // For demo: simple base64 encode (in production, use proper JWT library)
    return base64_encode(json_encode($payload));
}

// Simple authentication check
function checkAuth() {
    $headers = getallheaders();
    
    // Get the authorization header
    $token = null;
    if (isset($headers['Authorization'])) {
        $token = str_replace('Bearer ', '', $headers['Authorization']);
    }
    
    if (!$token) {
        return false;
    }
    
    // Verify the token
    $user = verifyToken($token);
    return $user;
}

// Send error response
function sendError($message, $statusCode = 400) {
    http_response_code($statusCode);
    echo json_encode([
        'success' => false,
        'error' => $message,
        'code' => $statusCode
    ]);
    exit;
}

// Get Bearer token from Authorization header
function getBearerToken() {
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
        $token = str_replace('Bearer ', '', $headers['Authorization']);
        return $token;
    }
    return null;
}

// Verify token (simple demo version)
function verifyToken($token) {
    if (!$token) {
        return false;
    }
    
    try {
        $decoded = json_decode(base64_decode($token), true);
        
        // Check expiry - support both 'exp' and 'expires_at' keys
        if (isset($decoded['exp']) && $decoded['exp'] < time()) {
            return false;
        }
        
        if (isset($decoded['expires_at']) && $decoded['expires_at'] < time()) {
            return false;
        }
        
        return $decoded;
    } catch (Exception $e) {
        return false;
    }
}
?>