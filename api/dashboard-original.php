<?php
require_once 'config.php';

checkAuth();

$conn = getConnection();
$period = $_GET['period'] ?? 'today';

function getDateRange($period) {
    $now = new DateTime();
    
    switch ($period) {
        case 'today':
            $start = $now->format('Y-m-d 00:00:00');
            $end = $now->format('Y-m-d 23:59:59');
            break;
        case 'week':
            $now->modify('-7 days');
            $start = $now->format('Y-m-d 00:00:00');
            $end = (new DateTime())->format('Y-m-d 23:59:59');
            break;
        case 'month':
            $start = date('Y-m-01 00:00:00');
            $end = date('Y-m-t 23:59:59');
            break;
        default:
            $start = '1970-01-01 00:00:00';
            $end = date('Y-m-d 23:59:59');
    }
    
    return [$start, $end];
}

list($startDate, $endDate) = getDateRange($period);

try {
    // 1. Get summary statistics
    $summary = [];
    
    // Total revenue
    $stmt = $conn->prepare("\n        SELECT COALESCE(SUM(total), 0) as total_revenue \n        FROM transactions \n        WHERE created_at BETWEEN ? AND ?\n        AND status = 'completed'\n    ");
    $stmt->execute([$startDate, $endDate]);
    $summary['total_revenue'] = $stmt->fetch()['total_revenue'];
    
    // Total transactions
    $stmt = $conn->prepare("\n        SELECT COUNT(*) as total_transactions \n        FROM transactions \n        WHERE created_at BETWEEN ? AND ?\n        AND status = 'completed'\n    ");
    $stmt->execute([$startDate, $endDate]);
    $summary['total_transactions'] = $stmt->fetch()['total_transactions'];
    
    // Total commission
    $stmt = $conn->prepare("\n        SELECT COALESCE(SUM(commission_amount), 0) as total_commission \n        FROM transactions \n        WHERE created_at BETWEEN ? AND ?\n        AND status = 'completed'\n    ");
    $stmt->execute([$startDate, $endDate]);
    $summary['total_commission'] = $stmt->fetch()['total_commission'];
    
    // Total customers
    $stmt = $conn->prepare("\n        SELECT COUNT(*) as total_customers \n        FROM customers \n        WHERE created_at BETWEEN ? AND ?\n    ");
    $stmt->execute([$startDate, $endDate]);
    $summary['total_customers'] = $stmt->fetch()['total_customers'];
    
    // New members
    $stmt = $conn->prepare("\n        SELECT COUNT(*) as new_members \n        FROM customers \n        WHERE created_at BETWEEN ? AND ?\n        AND is_member = 1\n    ");
    $stmt->execute([$startDate, $endDate]);
    $summary['new_members'] = $stmt->fetch()['new_members'];
    
    // Free washes
    $stmt = $conn->prepare("\n        SELECT COUNT(*) as free_washes \n        FROM transactions \n        WHERE created_at BETWEEN ? AND ?\n        AND is_free_wash = 1\n        AND status = 'completed'\n    ");
    $stmt->execute([$startDate, $endDate]);
    $summary['free_washes'] = $stmt->fetch()['free_washes'];
    
    // 2. Get recent transactions
    $stmt = $conn->prepare("\n        SELECT t.*, c.name as customer_name, c.phone as customer_phone\n        FROM transactions t\n        LEFT JOIN customers c ON t.customer_id = c.id\n        WHERE t.status = 'completed'\n        ORDER BY t.created_at DESC\n        LIMIT 10\n    ");
    $stmt->execute();
    $recent_transactions = $stmt->fetchAll();
    
    // 3. Get top customers
    $stmt = $conn->prepare("\n        SELECT \n            c.id,\n            c.name,\n            c.phone,\n            c.license_plate,\n            c.motorcycle_type,\n            c.wash_count,\n            c.total_spent,\n            COUNT(t.id) as transaction_count,\n            MAX(t.created_at) as last_visit\n        FROM customers c\n        LEFT JOIN transactions t ON c.id = t.customer_id AND t.status = 'completed'\n        GROUP BY c.id\n        ORDER BY c.total_spent DESC\n        LIMIT 5\n    ");
    $stmt->execute();
    $top_customers = $stmt->fetchAll();
    
    // 4. Get operator stats
    $stmt = $conn->prepare("\n        SELECT \n            u.id,\n            u.name,\n            u.username,\n            u.phone,\n            u.commission_rate,\n            u.total_commission,\n            u.pending_commission,\n            COUNT(t.id) as total_transactions,\n            COALESCE(SUM(t.total), 0) as total_revenue\n        FROM users u\n        LEFT JOIN transactions t ON u.id = t.operator_id \n            AND t.status = 'completed'\n            AND t.created_at BETWEEN ? AND ?\n        WHERE u.role = 'operator' \n        AND u.status = 'active'\n        GROUP BY u.id\n    ");
    $stmt->execute([$startDate, $endDate]);
    $operator_stats = $stmt->fetchAll();
    
    // 5. Get chart data
    $chart_data = [];
    
    // Revenue by day (last 7 days)
    $stmt = $conn->prepare("\n        SELECT \n            DATE(created_at) as date,\n            SUM(total) as revenue,\n            COUNT(*) as transactions\n        FROM transactions\n        WHERE status = 'completed'\n        AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)\n        GROUP BY DATE(created_at)\n        ORDER BY date\n    ");
    $stmt->execute();
    $chart_data['revenue'] = $stmt->fetchAll();
    
    // Motorcycle type distribution
    $stmt = $conn->prepare("\n        SELECT \n            motorcycle_type,\n            COUNT(*) as count\n        FROM transactions\n        WHERE status = 'completed'\n        AND created_at BETWEEN ? AND ?\n        GROUP BY motorcycle_type\n    ");
    $stmt->execute([$startDate, $endDate]);
    $chart_data['motorcycle_types'] = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'period' => $period,
        'date_range' => [
            'start' => $startDate,
            'end' => $endDate
        ],
        'summary' => $summary,
        'recent_transactions' => $recent_transactions,
        'top_customers' => $top_customers,
        'operator_stats' => $operator_stats,
        'chart_data' => $chart_data
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to fetch dashboard data',
        'message' => $e->getMessage()
    ]);
}
?>
<?php
require_once 'config.php';

$token = getBearerToken();
$payload = verifyToken($token);

if (!$payload) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$conn = getConnection();

switch ($method) {
    case 'GET':
        getDashboardData();
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}

function getDashboardData() {
    global $conn;
    $userId = $_GET['user_id'] ?? null;
    
    // Get period from query string
    $period = $_GET['period'] ?? 'today';
    $dateCondition = getDateCondition($period);
    
    // 1. Get Summary Data
    $summary = [
        'total_revenue' => 0,
        'total_transactions' => 0,
        'total_commission' => 0,
        'total_customers' => 0,
        'new_members' => 0,
        'free_washes' => 0
    ];
    
    // Revenue and transactions
    $stmt = $conn->prepare("
        SELECT 
            COUNT(*) as total_transactions,
            SUM(total) as total_revenue,
            SUM(commission_amount) as total_commission,
            SUM(CASE WHEN is_free_wash = 1 THEN 1 ELSE 0 END) as free_washes
        FROM transactions 
        WHERE status = 'completed' 
        AND created_at {$dateCondition['condition']}
    ");
    $stmt->execute($dateCondition['params']);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($result) {
        $summary['total_revenue'] = (float)$result['total_revenue'];
        $summary['total_transactions'] = (int)$result['total_transactions'];
        $summary['total_commission'] = (float)$result['total_commission'];
        $summary['free_washes'] = (int)$result['free_washes'];
    }
    
    // Customers and members
    $stmt = $conn->prepare("
        SELECT 
            COUNT(*) as total_customers,
            SUM(CASE WHEN is_member = 1 THEN 1 ELSE 0 END) as new_members
        FROM customers 
        WHERE created_at {$dateCondition['condition']}
    ");
    $stmt->execute($dateCondition['params']);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($result) {
        $summary['total_customers'] = (int)$result['total_customers'];
        $summary['new_members'] = (int)$result['new_members'];
    }
    
    // 2. Get Recent Transactions
    $stmt = $conn->prepare("
        SELECT t.*, c.name as customer_name, u.name as operator_name
        FROM transactions t
        LEFT JOIN customers c ON t.customer_id = c.id
        LEFT JOIN users u ON t.operator_id = u.id
        WHERE t.status = 'completed'
        ORDER BY t.created_at DESC
        LIMIT 10
    ");
    $stmt->execute();
    $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // 3. Get Top Customers
    $stmt = $conn->prepare("
        SELECT 
            c.*,
            COUNT(t.id) as transaction_count,
            SUM(t.total) as total_spent,
            MAX(t.created_at) as last_visit
        FROM customers c
        LEFT JOIN transactions t ON c.id = t.customer_id
        WHERE t.status = 'completed'
        GROUP BY c.id
        ORDER BY total_spent DESC
        LIMIT 5
    ");
    $stmt->execute();
    $topCustomers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // 4. Get Operator Stats
    $stmt = $conn->prepare("
        SELECT 
            u.id,
            u.name,
            u.username,
            u.phone,
            u.commission_rate,
            u.total_commission,
            u.pending_commission,
            COUNT(t.id) as total_transactions,
            SUM(t.total) as total_revenue,
            AVG(t.total) as avg_transaction
        FROM users u
        LEFT JOIN transactions t ON u.id = t.operator_id AND t.status = 'completed'
        WHERE u.role = 'operator' AND u.status = 'active'
        GROUP BY u.id
        ORDER BY total_revenue DESC
    ");
    $stmt->execute();
    $operatorStats = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // 5. Get Revenue Chart Data
    $chartData = getChartData($period);
    
    echo json_encode([
        'success' => true,
        'summary' => $summary,
        'recent_transactions' => $transactions,
        'top_customers' => $topCustomers,
        'operator_stats' => $operatorStats,
        'chart_data' => $chartData
    ]);
}

function getDateCondition($period) {
    $now = new DateTime();
    
    switch ($period) {
        case 'today':
            $startDate = $now->format('Y-m-d 00:00:00');
            return [
                'condition' => '>= ?',
                'params' => [$startDate]
            ];
        case 'week':
            $startDate = $now->modify('-7 days')->format('Y-m-d 00:00:00');
            return [
                'condition' => '>= ?',
                'params' => [$startDate]
            ];
        case 'month':
            $startDate = $now->modify('-30 days')->format('Y-m-d 00:00:00');
            return [
                'condition' => '>= ?',
                'params' => [$startDate]
            ];
        default:
            return [
                'condition' => 'IS NOT NULL',
                'params' => []
            ];
    }
}

function getChartData($period) {
    global $conn;
    
    // Revenue by day for the selected period
    $query = "
        SELECT 
            DATE(created_at) as date,
            SUM(total) as revenue,
            COUNT(*) as transactions
        FROM transactions
        WHERE status = 'completed'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 7
    ";
    
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $revenueData = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Motorcycle type distribution
    $stmt = $conn->prepare("
        SELECT 
            motorcycle_type,
            COUNT(*) as count
        FROM transactions
        WHERE status = 'completed'
        GROUP BY motorcycle_type
    ");
    $stmt->execute();
    $motorcycleData = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    return [
        'revenue_data' => $revenueData,
        'motorcycle_data' => $motorcycleData
    ];
}
?>