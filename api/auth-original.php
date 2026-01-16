<?php
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
        echo json_encode(['error' => 'Method not allowed']);
}

function handleLogin() {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        $data = $_POST; // Fallback for form data
    }
    
    if (!isset($data['username']) || !isset($data['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Username and password are required']);
        return;
    }
    
    $conn = getConnection();
    
    try {
        // For demo, we'll check against hardcoded credentials
        // In production, query from database
        
        $demoUsers = [
            'admin' => [
                'password' => 'admin123',
                'name' => 'Administrator',
                'role' => 'admin',
                'id' => 1
            ],
            'operator1' => [
                'password' => 'op123',
                'name' => 'Budi Santoso',
                'role' => 'operator',
                'id' => 2
            ]
        ];
        
        $username = $data['username'];
        $password = $data['password'];
        $role = $data['role'] ?? 'operator';
        
        if (isset($demoUsers[$username]) && 
            $demoUsers[$username]['password'] === $password &&
            $demoUsers[$username]['role'] === $role) {
            
            // In production, generate JWT token
            $token = base64_encode(json_encode([
                'user_id' => $demoUsers[$username]['id'],
                'username' => $username,
                'role' => $role,
                'exp' => time() + (24 * 60 * 60) // 24 hours
            ]));
            
            echo json_encode([
                'success' => true,
                'token' => $token,
                'user' => [
                    'id' => $demoUsers[$username]['id'],
                    'username' => $username,
                    'name' => $demoUsers[$username]['name'],
                    'role' => $role
                ]
            ]);
            return;
            
        } else {
            // For demo, just return error if demo user not found
            http_response_code(401);
            echo json_encode(['error' => 'Invalid username, password, or role']);
            return;
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Login failed: ' . $e->getMessage()]);
    }
}

function handleCheckAuth() {
    $headers = getallheaders();
    $token = isset($headers['Authorization']) ? 
        str_replace('Bearer ', '', $headers['Authorization']) : null;
    
    if (!$token) {
        http_response_code(401);
        echo json_encode(['error' => 'No token provided']);
        return;
    }
    
    try {
        $payload = json_decode(base64_decode($token), true);
        
        if (!$payload || !isset($payload['exp']) || $payload['exp'] < time()) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid or expired token']);
            return;
        }
        
        echo json_encode([
            'success' => true,
            'user' => [
                'id' => $payload['user_id'],
                'username' => $payload['username'],
                'role' => $payload['role']
            ]
        ]);
        
    } catch (Exception $e) {
        http_response_code(401);
        echo json_encode(['error' => 'Token validation failed']);
    }
}
?>
