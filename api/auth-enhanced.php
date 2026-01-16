<?php
/**
 * Motor Bersih POS - Authentication API Endpoint (Enhanced with JWT + Bcrypt)
 * Supports: Login, Token Validation, Logout
 */

require_once 'config.php';
require_once 'security.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    handleLogin();
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    handleCheckAuth();
} else {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'error' => 'Method not allowed',
        'code' => 405
    ]);
}

/**
 * Handle login request
 */
function handleLogin() {
    try {
        // Get request data
        $input = json_decode(file_get_contents('php://input'), true);

        // Validate input
        $username = $input['username'] ?? null;
        $password = $input['password'] ?? null;
        $role = $input['role'] ?? null;

        // Validation rules
        $validation = validateInputArray([
            'username' => $username,
            'password' => $password,
            'role' => $role
        ], [
            'username' => ['type' => 'username', 'required' => true],
            'password' => ['required' => true],
            'role' => ['type' => 'string', 'required' => true]
        ]);

        if (!$validation['valid']) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Invalid input',
                'details' => $validation['errors'],
                'code' => 400
            ]);
            exit;
        }

        // Sanitize inputs
        $username = sanitizeString($username);
        $role = sanitizeString($role);

        // Check rate limit
        $clientId = $_SERVER['REMOTE_ADDR'] . ':' . $username;
        if (!checkRateLimit($clientId, 5, 300)) {
            logSecurityEvent('LOGIN_RATE_LIMIT', ['username' => $username, 'ip' => $_SERVER['REMOTE_ADDR']]);
            http_response_code(429);
            echo json_encode([
                'success' => false,
                'error' => 'Too many login attempts. Please try again later.',
                'code' => 429
            ]);
            exit;
        }

        // Get database connection
        $conn = getConnection();

        // Query user by username and role
        $stmt = $conn->prepare(
            "SELECT id, username, password, name, role, active, created_at
             FROM users 
             WHERE username = ? AND role = ? AND active = 1
             LIMIT 1"
        );
        $stmt->execute([$username, $role]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            logSecurityEvent('LOGIN_FAILED', ['username' => $username, 'reason' => 'user_not_found']);
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'error' => 'Username or password incorrect',
                'code' => 401
            ]);
            exit;
        }

        // Verify password
        // Try bcrypt first (Phase 2), fallback to plain text for backwards compatibility
        $passwordValid = false;

        // Check if stored password is bcrypt hash (starts with $2)
        if (strpos($user['password'], '$2') === 0) {
            $passwordValid = verifyPassword($password, $user['password']);
        } else {
            // Fallback to plain text comparison (for existing test users)
            $passwordValid = ($password === $user['password']);
        }

        if (!$passwordValid) {
            logSecurityEvent('LOGIN_FAILED', ['username' => $username, 'reason' => 'invalid_password']);
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'error' => 'Username or password incorrect',
                'code' => 401
            ]);
            exit;
        }

        // Generate JWT Token
        $jwtPayload = [
            'user_id' => (int)$user['id'],
            'username' => $user['username'],
            'name' => $user['name'],
            'role' => $user['role']
        ];

        $token = generateJWT($jwtPayload);

        // Log successful login
        logSecurityEvent('LOGIN_SUCCESS', ['username' => $username, 'user_id' => $user['id']]);

        // Return response
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Login successful',
            'token' => $token,
            'user' => [
                'id' => (int)$user['id'],
                'username' => $user['username'],
                'name' => $user['name'],
                'role' => $user['role']
            ],
            'expires_in' => 86400 // 24 hours in seconds
        ]);

    } catch (PDOException $e) {
        logSecurityEvent('LOGIN_ERROR', ['error' => $e->getMessage()]);
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Database error',
            'code' => 500
        ]);
    } catch (Exception $e) {
        logSecurityEvent('LOGIN_ERROR', ['error' => $e->getMessage()]);
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Server error: ' . $e->getMessage(),
            'code' => 500
        ]);
    }
}

/**
 * Handle token verification
 */
function handleCheckAuth() {
    try {
        // Get authorization header
        $headers = getallheaders();
        $token = null;

        if (isset($headers['Authorization'])) {
            preg_match('/Bearer\s+(.+)/', $headers['Authorization'], $matches);
            $token = $matches[1] ?? null;
        }

        if (!$token) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'error' => 'No token provided',
                'code' => 401
            ]);
            exit;
        }

        // Verify token
        $user = verifyJWT($token);

        if (!$user) {
            logSecurityEvent('AUTH_CHECK_FAILED', ['reason' => 'invalid_token']);
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'error' => 'Invalid or expired token',
                'code' => 401
            ]);
            exit;
        }

        // Optional: Verify user still exists and is active
        $conn = getConnection();
        $stmt = $conn->prepare("SELECT id, username, name, role, active FROM users WHERE id = ? LIMIT 1");
        $stmt->execute([$user['user_id']]);
        $userData = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$userData || !$userData['active']) {
            logSecurityEvent('AUTH_CHECK_FAILED', ['user_id' => $user['user_id'], 'reason' => 'user_inactive']);
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'error' => 'User no longer active',
                'code' => 401
            ]);
            exit;
        }

        // Return verified user data
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Token valid',
            'user' => [
                'id' => (int)$userData['id'],
                'username' => $userData['username'],
                'name' => $userData['name'],
                'role' => $userData['role']
            ],
            'code' => 200
        ]);

    } catch (Exception $e) {
        logSecurityEvent('AUTH_CHECK_ERROR', ['error' => $e->getMessage()]);
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Server error',
            'code' => 500
        ]);
    }
}

?>
