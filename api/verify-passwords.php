<?php
// Script to verify if demo passwords match database hashes

$passwords = [
    'admin' => 'admin123',
    'operator1' => 'op123',
    'operator2' => 'op456'
];

$hashes = [
    'admin' => '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/TVG2',
    'operator1' => '$2y$10$V9T4iyVsEp8JJ3H2QKVXUOdWqNRHvXXvZwWN3nZQvGvGYRq6vMkPq',
    'operator2' => '$2y$10$m7rIKP.T/3vG0kS4V6vhZeqMN8rC3dK0zV1dL5tQ9uW8xN4pY2kLq'
];

echo "=== Password Verification ===\n\n";

foreach ($passwords as $username => $password) {
    $hash = $hashes[$username];
    $result = password_verify($password, $hash);
    
    echo "User: $username\n";
    echo "Password: $password\n";
    echo "Hash: $hash\n";
    echo "Match: " . ($result ? "✓ YES" : "✗ NO") . "\n";
    echo "---\n\n";
}

// If passwords don't match, generate new hashes
echo "\n=== New Password Hashes (if needed) ===\n\n";
foreach ($passwords as $username => $password) {
    $newHash = password_hash($password, PASSWORD_DEFAULT);
    echo "$username: $newHash\n";
}
?>