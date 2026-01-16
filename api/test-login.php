<?php
// Test login directly with database

require_once 'config.php';

$passwords = [
    'admin' => 'admin123',
    'operator1' => 'op123',
    'operator2' => 'op456'
];

echo "=== Testing Login with Database ===\n\n";

try {
    $conn = getConnection();
    
    foreach ($passwords as $username => $password) {
        echo "Testing: $username / $password\n";
        
        $stmt = $conn->prepare("SELECT id, username, password, role FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch();
        
        if ($user) {
            echo "  User found: {$user['username']} ({$user['role']})\n";
            echo "  Hash in DB: " . substr($user['password'], 0, 30) . "...\n";
            
            $match = password_verify($password, $user['password']);
            echo "  Password match: " . ($match ? "✓ YES" : "✗ NO") . "\n";
            
            if (!$match) {
                // Try plaintext
                $plainMatch = ($user['password'] === $password);
                echo "  Plaintext match: " . ($plainMatch ? "✓ YES" : "✗ NO") . "\n";
            }
        } else {
            echo "  User NOT FOUND\n";
        }
        
        echo "---\n\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>