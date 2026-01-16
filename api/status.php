<?php
require_once 'config.php';

try {
    $conn = getConnection();
    
    // Test query
    $stmt = $conn->query("SELECT 1 as test");
    $result = $stmt->fetch();
    
    // Get database info
    $stmt = $conn->query("SELECT DATABASE() as db_name, VERSION() as db_version");
    $dbInfo = $stmt->fetch();
    
    // Count tables
    $stmt = $conn->query("SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = '" . DB_NAME . "'");
    $tableCount = $stmt->fetch();
    
    echo json_encode([
        'success' => true,
        'message' => 'API and Database are working!',
        'database' => [
            'name' => $dbInfo['db_name'],
            'version' => $dbInfo['db_version'],
            'table_count' => $tableCount['table_count']
        ],
        'api' => [
            'version' => '1.0',
            'timestamp' => date('Y-m-d H:i:s')
        ]
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'config' => [
            'host' => DB_HOST,
            'database' => DB_NAME,
            'user' => DB_USER
        ]
    ]);
}
?>
