<?php
require_once 'config.php';

try {
    $conn = getConnection();
    echo json_encode([
        'success' => true,
        'message' => 'Database connection successful',
        'database' => DB_NAME
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>