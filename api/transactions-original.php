<?php
require_once 'config.php';

// Optional: check token (for now, allow all requests for demo)
$token = getBearerToken();
// $payload = verifyToken($token);  // Uncomment to enforce token validation

$method = $_SERVER['REQUEST_METHOD'];
$conn = getConnection();

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            getTransaction($_GET['id']);
        } else {
            getTransactions();
        }
        break;
    case 'POST':
        createTransaction();
        break;
    case 'PUT':
        updateTransaction();
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}

function getTransactions() {
    global $conn;
    
    $page = $_GET['page'] ?? 1;
    $limit = $_GET['limit'] ?? 20;
    $offset = ($page - 1) * $limit;
    
    $whereClauses = ['t.status IS NOT NULL'];
    $params = [];
    
    if (isset($_GET['status'])) {
        $whereClauses[] = 't.status = ?';
        $params[] = $_GET['status'];
    }
    
    if (isset($_GET['date_from'])) {
        $whereClauses[] = 'DATE(t.created_at) >= ?';
        $params[] = $_GET['date_from'];
    }
    
    if (isset($_GET['date_to'])) {
        $whereClauses[] = 'DATE(t.created_at) <= ?';
        $params[] = $_GET['date_to'];
    }
    
    $where = implode(' AND ', $whereClauses);
    
    // Get total count
    $stmt = $conn->prepare("SELECT COUNT(*) as total FROM transactions t WHERE $where");
    $stmt->execute($params);
    $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Get transactions
    $stmt = $conn->prepare("
        SELECT 
            t.*,
            c.name as customer_name,
            c.phone as customer_phone,
            u.name as operator_name,
            wt.wash_name
        FROM transactions t
        LEFT JOIN customers c ON t.customer_id = c.id
        LEFT JOIN users u ON t.operator_id = u.id
        LEFT JOIN wash_types wt ON t.wash_type_id = wt.id
        WHERE $where
        ORDER BY t.created_at DESC
        LIMIT ? OFFSET ?
    ");
    
    $params[] = $limit;
    $params[] = $offset;
    $stmt->execute($params);
    $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $transactions,
        'total' => $total,
        'page' => $page,
        'limit' => $limit,
        'total_pages' => ceil($total / $limit)
    ]);
}

function getTransaction($id) {
    global $conn;
    
    $stmt = $conn->prepare("
        SELECT 
            t.*,
            c.name as customer_name,
            c.phone as customer_phone,
            c.license_plate as customer_plate,
            c.motorcycle_type as customer_motorcycle,
            u.name as operator_name,
            wt.wash_name,
            wt.price as wash_price
        FROM transactions t
        LEFT JOIN customers c ON t.customer_id = c.id
        LEFT JOIN users u ON t.operator_id = u.id
        LEFT JOIN wash_types wt ON t.wash_type_id = wt.id
        WHERE t.id = ?
    ");
    
    $stmt->execute([$id]);
    $transaction = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$transaction) {
        http_response_code(404);
        echo json_encode(['error' => 'Transaction not found']);
        return;
    }
    
    // Get transaction services
    $stmt = $conn->prepare("
        SELECT * FROM transaction_services 
        WHERE transaction_id = ?
        ORDER BY service_type
    ");
    $stmt->execute([$id]);
    $services = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $transaction['services'] = $services;
    
    echo json_encode([
        'success' => true,
        'data' => $transaction
    ]);
}

function createTransaction() {
    global $conn, $payload;
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Start transaction
    $conn->beginTransaction();
    
    try {
        // Check if customer exists or create new
        $customerId = null;
        if (isset($data['customer']['license_plate'])) {
            $stmt = $conn->prepare("SELECT id FROM customers WHERE license_plate = ?");
            $stmt->execute([$data['customer']['license_plate']]);
            $existing = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($existing) {
                $customerId = $existing['id'];
                // Update customer wash count
                $stmt = $conn->prepare("
                    UPDATE customers 
                    SET wash_count = wash_count + 1,
                        last_wash_date = NOW(),
                        total_spent = total_spent + ?
                    WHERE id = ?
                ");
                $stmt->execute([$data['total'], $customerId]);
            } else {
                // Create new customer
                $stmt = $conn->prepare("
                    INSERT INTO customers (name, phone, license_plate, motorcycle_type, is_member, wash_count, total_spent, last_wash_date)
                    VALUES (?, ?, ?, ?, ?, 1, ?, NOW())
                ");
                $stmt->execute([
                    $data['customer']['name'] ?? '',
                    $data['customer']['phone'] ?? '',
                    $data['customer']['license_plate'],
                    $data['motorcycle_type'],
                    $data['customer']['is_member'] ?? false,
                    $data['total']
                ]);
                $customerId = $conn->lastInsertId();
            }
        }
        
        // Generate transaction ID
        $transactionId = 'TRX' . date('YmdHis') . rand(100, 999);
        
        // Calculate commission
        $commissionRate = $data['operator']['commission_rate'] ?? 30;
        $commissionAmount = $data['total'] * ($commissionRate / 100);
        
        // Insert transaction
        $stmt = $conn->prepare("
            INSERT INTO transactions (
                id, customer_id, license_plate, motorcycle_type, 
                wash_type_id, wash_price, total_additional_services,
                subtotal, discount, total, operator_id, commission_rate,
                commission_amount, is_free_wash, payment_method, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed')
        ");
        
        $stmt->execute([
            $transactionId,
            $customerId,
            $data['license_plate'],
            $data['motorcycle_type'],
            $data['wash_type_id'] ?? null,
            $data['wash_price'] ?? 0,
            $data['additional_services_total'] ?? 0,
            $data['subtotal'] ?? $data['total'],
            $data['discount'] ?? 0,
            $data['total'],
            $data['operator_id'],
            $commissionRate,
            $commissionAmount,
            $data['is_free_wash'] ?? false,
            $data['payment_method'] ?? 'cash'
        ]);
        
        // Insert transaction services
        if (isset($data['services']) && is_array($data['services'])) {
            foreach ($data['services'] as $service) {
                $stmt = $conn->prepare("
                    INSERT INTO transaction_services (transaction_id, service_type, service_id, service_name, price)
                    VALUES (?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $transactionId,
                    $service['type'],
                    $service['id'] ?? null,
                    $service['name'],
                    $service['price']
                ]);
            }
        }
        
        // Update operator commission
        $stmt = $conn->prepare("
            UPDATE users 
            SET total_commission = total_commission + ?,
                pending_commission = pending_commission + ?,
                updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$commissionAmount, $commissionAmount, $data['operator_id']]);
        
        // Insert commission record
        $stmt = $conn->prepare("
            INSERT INTO commissions (operator_id, transaction_id, amount, status)
            VALUES (?, ?, ?, 'pending')
        ");
        $stmt->execute([$data['operator_id'], $transactionId, $commissionAmount]);
        
        // Check for free wash eligibility
        if ($customerId && !($data['is_free_wash'] ?? false)) {
            $stmt = $conn->prepare("SELECT wash_count FROM customers WHERE id = ?");
            $stmt->execute([$customerId]);
            $customer = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($customer && ($customer['wash_count'] + 1) % 5 == 0) {
                $stmt = $conn->prepare("UPDATE customers SET free_wash_available = 1 WHERE id = ?");
                $stmt->execute([$customerId]);
            }
        }
        
        $conn->commit();
        
        echo json_encode([
            'success' => true,
            'transaction_id' => $transactionId,
            'message' => 'Transaction created successfully'
        ]);
        
    } catch (Exception $e) {
        $conn->rollBack();
        http_response_code(500);
        echo json_encode(['error' => 'Transaction failed: ' . $e->getMessage()]);
    }
}

function updateTransaction() {
    global $conn;
    
    $id = $_GET['id'] ?? null;
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Transaction ID is required']);
        return;
    }
    
    $allowedFields = ['status', 'payment_method', 'notes'];
    $updates = [];
    $params = [];
    
    foreach ($allowedFields as $field) {
        if (isset($data[$field])) {
            $updates[] = "$field = ?";
            $params[] = $data[$field];
        }
    }
    
    if (empty($updates)) {
        http_response_code(400);
        echo json_encode(['error' => 'No valid fields to update']);
        return;
    }
    
    $params[] = $id;
    
    $sql = "UPDATE transactions SET " . implode(', ', $updates) . " WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    
    echo json_encode([
        'success' => true,
        'message' => 'Transaction updated successfully'
    ]);
}
?>