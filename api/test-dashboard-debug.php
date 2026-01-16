<?php
// Quick test to see what's wrong

require_once 'config.php';

$conn = getConnection();

// Test each query individually
echo "Testing dashboard queries...\n\n";

// 1. Revenue
echo "1. Testing Revenue Query...\n";
try {
    $revenueStmt = $conn->prepare(
        "SELECT 
            COUNT(*) as transaction_count,
            SUM(amount) as total_revenue,
            AVG(amount) as avg_amount
         FROM transactions 
         WHERE DATE(created_at) BETWEEN ? AND ? AND status = 'completed'"
    );
    $revenueStmt->execute(["2026-01-16", "2026-01-16"]);
    $revenue = $revenueStmt->fetch();
    echo "✓ Revenue query OK\n";
    print_r($revenue);
} catch (Exception $e) {
    echo "✗ Revenue query ERROR: " . $e->getMessage() . "\n";
}

// 2. Commission
echo "\n2. Testing Commission Query...\n";
try {
    $commissionStmt = $conn->prepare(
        "SELECT 
            COUNT(*) as commission_count,
            SUM(commission_amount) as total_commission
         FROM transactions
         WHERE DATE(created_at) BETWEEN ? AND ? AND status = 'completed'"
    );
    $commissionStmt->execute(["2026-01-16", "2026-01-16"]);
    $commission = $commissionStmt->fetch();
    echo "✓ Commission query OK\n";
    print_r($commission);
} catch (Exception $e) {
    echo "✗ Commission query ERROR: " . $e->getMessage() . "\n";
}

// 3. Status
echo "\n3. Testing Status Query...\n";
try {
    $statusStmt = $conn->prepare(
        "SELECT 
            status,
            COUNT(*) as count,
            SUM(amount) as total
         FROM transactions 
         WHERE DATE(created_at) BETWEEN ? AND ?
         GROUP BY status"
    );
    $statusStmt->execute(["2026-01-16", "2026-01-16"]);
    $statusData = $statusStmt->fetchAll();
    echo "✓ Status query OK\n";
    print_r($statusData);
} catch (Exception $e) {
    echo "✗ Status query ERROR: " . $e->getMessage() . "\n";
}

echo "\nDone!";
?>
