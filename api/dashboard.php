<?php
/**
 * Motor Bersih POS - Dashboard API Endpoint
 * Returns statistics for dashboard display
 * Date: January 16, 2026
 */

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    sendError('Only GET method is allowed', 405);
}

// Check authentication
$user = checkAuth();
if (!$user) {
    http_response_code(401);
    sendError('Unauthorized - Please login first', 401);
}

// Only admin and operators can view dashboard
if (!in_array($user['role'], ['admin', 'operator'])) {
    http_response_code(403);
    sendError('You do not have permission to view dashboard', 403);
}

try {
    $conn = getConnection();
    
    // Get date range (default: today)
    $startDate = $_GET['start_date'] ?? date('Y-m-d');
    $endDate = $_GET['end_date'] ?? date('Y-m-d');
    
    // Initialize response
    $response = [
        'success' => true,
        'message' => 'Dashboard data retrieved',
        'date_range' => [
            'start' => $startDate,
            'end' => $endDate
        ],
        'data' => []
    ];
    
    // 1. Get Today's Revenue
    $revenueStmt = $conn->prepare(
        "SELECT 
            COUNT(*) as transaction_count,
            SUM(amount) as total_revenue,
            AVG(amount) as avg_amount
         FROM transactions 
         WHERE DATE(created_at) BETWEEN ? AND ? AND status = 'completed'"
    );
    $revenueStmt->execute([$startDate, $endDate]);
    $revenue = $revenueStmt->fetch();
    
    $response['data']['revenue'] = [
        'total' => (float)($revenue['total_revenue'] ?? 0),
        'count' => (int)($revenue['transaction_count'] ?? 0),
        'average' => (float)($revenue['avg_amount'] ?? 0),
        'currency' => 'IDR'
    ];
    
    // 2. Get Commission Summary
    $commissionStmt = $conn->prepare(
        "SELECT 
            COUNT(*) as commission_count,
            SUM(commission_amount) as total_commission
         FROM transactions
         WHERE DATE(created_at) BETWEEN ? AND ? AND status = 'completed'"
    );
    $commissionStmt->execute([$startDate, $endDate]);
    $commission = $commissionStmt->fetch();
    
    $response['data']['commission'] = [
        'total' => (float)($commission['total_commission'] ?? 0),
        'paid' => (float)($commission['total_commission'] ?? 0),
        'pending' => 0,
        'count' => (int)($commission['commission_count'] ?? 0)
    ];
    
    // 3. Get Transaction Statistics by Status
    $statusStmt = $conn->prepare(
        "SELECT 
            status,
            COUNT(*) as count,
            SUM(amount) as total
         FROM transactions 
         WHERE DATE(created_at) BETWEEN ? AND ?
         GROUP BY status"
    );
    $statusStmt->execute([$startDate, $endDate]);
    $statusData = $statusStmt->fetchAll();
    
    $status_summary = [];
    foreach ($statusData as $row) {
        $status_summary[$row['status']] = [
            'count' => (int)$row['count'],
            'total' => (float)$row['total']
        ];
    }
    $response['data']['status_summary'] = $status_summary;
    
    // 4. Get Payment Method Breakdown
    $paymentStmt = $conn->prepare(
        "SELECT 
            payment_method,
            COUNT(*) as count,
            SUM(amount) as total
         FROM transactions 
         WHERE DATE(created_at) BETWEEN ? AND ? AND status = 'completed'
         GROUP BY payment_method"
    );
    $paymentStmt->execute([$startDate, $endDate]);
    $paymentData = $paymentStmt->fetchAll();
    
    $payment_summary = [];
    foreach ($paymentData as $row) {
        $payment_summary[$row['payment_method']] = [
            'count' => (int)$row['count'],
            'total' => (float)$row['total']
        ];
    }
    $response['data']['payment_methods'] = $payment_summary;
    
    // 5. Get Motorcycle Type Breakdown
    $motorcycleStmt = $conn->prepare(
        "SELECT 
            c.motorcycle_type,
            COUNT(t.id) as wash_count,
            SUM(t.amount) as revenue
         FROM transactions t
         JOIN customers c ON t.customer_id = c.id
         WHERE DATE(t.created_at) BETWEEN ? AND ? AND t.status = 'completed'
         GROUP BY c.motorcycle_type"
    );
    $motorcycleStmt->execute([$startDate, $endDate]);
    $motorcycleData = $motorcycleStmt->fetchAll();
    
    $motorcycle_summary = [];
    foreach ($motorcycleData as $row) {
        $motorcycle_summary[$row['motorcycle_type']] = [
            'count' => (int)$row['wash_count'],
            'revenue' => (float)$row['revenue']
        ];
    }
    $response['data']['motorcycle_types'] = $motorcycle_summary;
    
    // 6. Get Top Performing Operators
    $operatorStmt = $conn->prepare(
        "SELECT 
            o.id,
            o.name,
            COUNT(t.id) as transaction_count,
            SUM(t.commission_amount) as total_commission,
            SUM(t.amount) as total_revenue
         FROM transactions t
         JOIN operators o ON t.operator_id = o.id
         WHERE DATE(t.created_at) BETWEEN ? AND ? AND t.status = 'completed'
         GROUP BY o.id, o.name
         ORDER BY total_commission DESC
         LIMIT 5"
    );
    $operatorStmt->execute([$startDate, $endDate]);
    $operators = $operatorStmt->fetchAll();
    
    $response['data']['top_operators'] = [];
    foreach ($operators as $op) {
        $response['data']['top_operators'][] = [
            'id' => (int)$op['id'],
            'name' => $op['name'],
            'transactions' => (int)$op['transaction_count'],
            'commission' => (float)$op['total_commission'],
            'revenue' => (float)$op['total_revenue']
        ];
    }
    
    // 7. Get Member Statistics
    $memberStmt = $conn->prepare(
        "SELECT 
            COUNT(*) as total_members,
            SUM(CASE WHEN is_member = true THEN 1 ELSE 0 END) as active_members,
            SUM(member_points) as total_points
         FROM customers"
    );
    $memberStmt->execute([]);
    $members = $memberStmt->fetch();
    
    $response['data']['members'] = [
        'total' => (int)($members['total_members'] ?? 0),
        'active' => (int)($members['active_members'] ?? 0),
        'points' => (int)($members['total_points'] ?? 0)
    ];
    
    // 8. Get Recent Transactions
    $recentStmt = $conn->prepare(
        "SELECT 
            t.id,
            t.transaction_code,
            c.name as customer_name,
            c.license_plate,
            o.name as operator_name,
            t.wash_type,
            t.amount,
            t.status,
            t.created_at
         FROM transactions t
         JOIN customers c ON t.customer_id = c.id
         JOIN operators o ON t.operator_id = o.id
         WHERE DATE(t.created_at) BETWEEN ? AND ?
         ORDER BY t.created_at DESC
         LIMIT 10"
    );
    $recentStmt->execute([$startDate, $endDate]);
    $recentTransactions = $recentStmt->fetchAll();
    
    $response['data']['recent_transactions'] = [];
    foreach ($recentTransactions as $trans) {
        $response['data']['recent_transactions'][] = [
            'id' => (int)$trans['id'],
            'code' => $trans['transaction_code'],
            'customer' => $trans['customer_name'],
            'plate' => $trans['license_plate'],
            'operator' => $trans['operator_name'],
            'type' => $trans['wash_type'],
            'amount' => (float)$trans['amount'],
            'status' => $trans['status'],
            'time' => $trans['created_at']
        ];
    }
    
    http_response_code(200);
    echo json_encode($response);
    
} catch (PDOException $e) {
    logMessage('DASHBOARD_ERROR', ['error' => $e->getMessage()], 'ERROR');
    http_response_code(500);
    sendError('Error retrieving dashboard data', 500);
}

?>
