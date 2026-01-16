<?php
/**
 * Motor Bersih POS - Improved Authentication
 * Integrates with database users table
 * Date: January 16, 2026
 */

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST':
        handleLogin();
        break;
    case 'GET':
        handleCheckAuth();
        break;
    default:
        http_response_code(405);
        sendError('Method not allowed', 405);
}

/**
 * Handle login request - Check against database users
 */
function handleLogin() {
    $data = getRequestData();
    
    // Validate required fields
    $validation = validateRequired($data, ['username', 'password']);
    if ($validation !== true) {
        sendError($validation, 400);
    }
    
    $username = sanitizeInput($data['username']);
    $password = sanitizeInput($data['password']);
    $role = sanitizeInput($data['role'] ?? '');
    
    // Validate role if provided
    if (!empty($role) && !in_array($role, ['admin', 'operator'])) {
        http_response_code(400);
        sendError('Invalid role specified', 400);
    }
    
    // Check rate limiting for login attempts
    if (!checkRateLimit('login_' . getClientIP(), LOGIN_RATE_LIMIT, 60)) {
        http_response_code(429);
        sendError('Too many login attempts. Please try again later.', 429);
    }
    
    try {
        $conn = getConnection();
        
        // Query user from database - check with or without role
        if (!empty($role)) {
            $stmt = $conn->prepare(
                "SELECT id, username, password, name, role, email, active 
                 FROM users 
                 WHERE username = ? AND role = ? AND active = true"
            );
            $stmt->execute([$username, $role]);
        } else {
            $stmt = $conn->prepare(
                "SELECT id, username, password, name, role, email, active 
                 FROM users 
                 WHERE username = ? AND active = true"
            );
            $stmt->execute([$username]);
        }
        
        $user = $stmt->fetch();
        
        if (!$user) {
            logMessage('LOGIN_FAILED', [
                'username' => $username,
                'role' => $role,
                'reason' => 'User not found or inactive',
                'ip' => getClientIP()
            ], 'WARNING');
            
            http_response_code(401);
            sendError('Username, password, atau role tidak valid', 401);
        }
        
        // Check if role matches (if role was specified)
        if (!empty($role) && $user['role'] !== $role) {
            logMessage('LOGIN_FAILED', [
                'username' => $username,
                'role' => $role,
                'user_role' => $user['role'],
                'reason' => 'Role mismatch',
                'ip' => getClientIP()
            ], 'WARNING');
            
            http_response_code(401);
            sendError('Role tidak sesuai dengan user', 401);
        }
        
        // Verify password - Check bcrypt first, then fallback to plaintext for demo
        $passwordValid = false;
        
        // If password starts with $2y$ it's bcrypt
        if (strpos($user['password'], '$2y$') === 0 || strpos($user['password'], '$2a$') === 0 || strpos($user['password'], '$2b$') === 0) {
            $passwordValid = password_verify($password, $user['password']);
        } else {
            // Plaintext comparison for demo accounts
            $passwordValid = ($user['password'] === $password);
        }
        
        if (!$passwordValid) {
            logMessage('LOGIN_FAILED', [
                'username' => $username,
                'reason' => 'Invalid password',
                'ip' => getClientIP()
            ], 'WARNING');
            
            http_response_code(401);
            sendError('Password tidak valid', 401);
        }
        
        // Generate token with user data
        $tokenData = [
            'id' => $user['id'],
            'username' => $user['username'],
            'name' => $user['name'],
            'role' => $user['role'],
            'email' => $user['email']
        ];
        
        $token = generateToken($tokenData);
        
        // Update last login time
        $updateStmt = $conn->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
        $updateStmt->execute([$user['id']]);
        
        logMessage('LOGIN_SUCCESS', [
            'username' => $username,
            'role' => $role,
            'ip' => getClientIP()
        ], 'INFO');
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Login successful',
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'name' => $user['name'],
                'role' => $user['role'],
                'email' => $user['email']
            ]
        ]);
        exit();
        
    } catch (PDOException $e) {
        logMessage('LOGIN_ERROR', [
            'error' => $e->getMessage(),
            'username' => $username ?? 'unknown'
        ], 'ERROR');
        
        http_response_code(500);
        sendError('Database error during authentication', 500);
    }
}

/**
 * Handle auth check request - Verify token validity
 */
function handleCheckAuth() {
    $token = getBearerToken();
    
    if (!$token) {
        http_response_code(401);
        sendError('No token provided', 401);
    }
    
    $user = verifyToken($token);
    
    if (!$user) {
        http_response_code(401);
        sendError('Invalid or expired token', 401);
    }
    
    try {
        $conn = getConnection();
        
        // Verify user still exists and is active
        $stmt = $conn->prepare(
            "SELECT id, username, name, role, email, active 
             FROM users 
             WHERE id = ? AND active = true"
        );
        
        $stmt->execute([$user['id']]);
        $dbUser = $stmt->fetch();
        
        if (!$dbUser) {
            http_response_code(401);
            sendError('User not found or inactive', 401);
        }
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Token is valid',
            'user' => [
                'id' => $dbUser['id'],
                'username' => $dbUser['username'],
                'name' => $dbUser['name'],
                'role' => $dbUser['role'],
                'email' => $dbUser['email']
            ],
            'token_expires_at' => $user['expires_at'] ?? null
        ]);
        
    } catch (PDOException $e) {
        logMessage('AUTH_CHECK_ERROR', ['error' => $e->getMessage()], 'ERROR');
        http_response_code(500);
        sendError('Error verifying authentication', 500);
    }
}

?>
