<?php
/**
 * Motor Bersih POS - Transactions API Endpoint
 * Handles Create, Read, Update, Delete for transactions
 * Date: January 16, 2026
 */

require_once 'config.php';

// Check authentication
$user = checkAuth();
if (!$user) {
    http_response_code(401);
    sendError('Unauthorized - Please login first', 401);
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetTransactions();
        break;
    case 'POST':
        handleCreateTransaction();
        break;
    case 'PUT':
        handleUpdateTransaction();
        break;
    case 'DELETE':
        handleDeleteTransaction();
        break;
    default:
        http_response_code(405);
        sendError('Method not allowed', 405);
}

/**
 * GET - Retrieve transactions
 */
function handleGetTransactions() {
    try {
        $conn = getConnection();
        
        // Get query parameters
        $id = $_GET['id'] ?? null;
        $status = $_GET['status'] ?? null;
        $operator_id = $_GET['operator_id'] ?? null;
        $customer_id = $_GET['customer_id'] ?? null;
        $start_date = $_GET['start_date'] ?? null;
        $end_date = $_GET['end_date'] ?? null;
        $payment_method = $_GET['payment_method'] ?? null;
        $motorcycle_type = $_GET['motorcycle_type'] ?? null;
        $page = (int)($_GET['page'] ?? 1);
        $limit = (int)($_GET['limit'] ?? 100);
        $offset = ($page - 1) * $limit;
        
        // Build query with JOINs to get customer and operator info
        $query = "
            SELECT 
                t.*,
                c.license_plate,
                c.name as customer_name,
                c.phone as customer_phone,
                c.motorcycle_type,
                c.motorcycle_brand,
                c.is_member,
                o.name as operator_name
            FROM transactions t
            LEFT JOIN customers c ON t.customer_id = c.id
            LEFT JOIN operators o ON t.operator_id = o.id
            WHERE 1=1
        ";
        $params = [];
        
        if ($id) {
            $query .= " AND t.id = ?";
            $params[] = $id;
        }
        
        if ($status) {
            $query .= " AND t.status = ?";
            $params[] = $status;
        }
        
        if ($operator_id) {
            $query .= " AND t.operator_id = ?";
            $params[] = $operator_id;
        }
        
        if ($customer_id) {
            $query .= " AND t.customer_id = ?";
            $params[] = $customer_id;
        }
        
        if ($payment_method) {
            $query .= " AND t.payment_method = ?";
            $params[] = $payment_method;
        }
        
        if ($motorcycle_type) {
            $query .= " AND c.motorcycle_type = ?";
            $params[] = $motorcycle_type;
        }
        
        if ($start_date && $end_date) {
            $query .= " AND DATE(t.created_at) BETWEEN ? AND ?";
            $params[] = $start_date;
            $params[] = $end_date;
        } elseif ($start_date) {
            $query .= " AND DATE(t.created_at) >= ?";
            $params[] = $start_date;
        } elseif ($end_date) {
            $query .= " AND DATE(t.created_at) <= ?";
            $params[] = $end_date;
        }
        
        // Get total count
        $countQuery = "SELECT COUNT(*) as count FROM (" . $query . ") as subquery";
        $countStmt = $conn->prepare($countQuery);
        $countStmt->execute($params);
        $total = $countStmt->fetch()['count'];
        
        // Add ordering and pagination
        $query .= " ORDER BY t.created_at DESC LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $conn->prepare($query);
        $stmt->execute($params);
        $transactions = $stmt->fetchAll();
        
        // Convert numeric values and add is_loyalty_free flag
        foreach ($transactions as &$txn) {
            $txn['id'] = (int)$txn['id'];
            $txn['customer_id'] = (int)$txn['customer_id'];
            $txn['operator_id'] = (int)$txn['operator_id'];
            $txn['amount'] = (float)$txn['amount'];
            $txn['commission_amount'] = (float)$txn['commission_amount'];
            $txn['is_member'] = (bool)($txn['is_member'] ?? false);
            
            // Check if it's a free wash (amount = 0 and member)
            $txn['is_loyalty_free'] = $txn['is_member'] && $txn['amount'] == 0;
        }
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Transactions retrieved',
            'data' => $transactions,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => (int)$total,
                'pages' => ceil($total / $limit)
            ]
        ]);
        
    } catch (PDOException $e) {
        logMessage('GET_TRANSACTIONS_ERROR', ['error' => $e->getMessage()], 'ERROR');
        http_response_code(500);
        sendError('Error retrieving transactions', 500);
    }
}

/**
 * POST - Create new transaction
 */
function handleCreateTransaction() {
    $data = getRequestData();
    
    // Frontend sends: transaction_id, customer_id, license_plate, customer_name, motorcycle_type, 
    //                 price, original_price, is_loyalty_free, operator_id, payment_method, notes
    
    // Validate required fields (flexible to support guest transactions)
    $requiredFields = ['operator_id', 'motorcycle_type', 'price', 'payment_method'];
    $validation = validateRequired($data, $requiredFields);
    if ($validation !== true) {
        sendError($validation, 400);
    }
    
    try {
        $conn = getConnection();
        
        // Handle customer (create if guest or use existing member)
        $customerId = null;
        if (!empty($data['customer_id'])) {
            // Validate existing customer
            $customerStmt = $conn->prepare("SELECT id FROM customers WHERE id = ?");
            $customerStmt->execute([$data['customer_id']]);
            if ($customerStmt->fetch()) {
                $customerId = $data['customer_id'];
            }
        }
        
        // If no customer_id or not found, create guest customer
        if (!$customerId && !empty($data['license_plate']) && !empty($data['customer_name'])) {
            // Check if plate already exists
            $plateCheck = $conn->prepare(
                "SELECT id FROM customers WHERE REPLACE(UPPER(license_plate), ' ', '') = REPLACE(UPPER(?), ' ', '')"
            );
            $plateCheck->execute([$data['license_plate']]);
            $existingCustomer = $plateCheck->fetch();
            
            if ($existingCustomer) {
                $customerId = $existingCustomer['id'];
            } else {
                // Create new guest customer
                $insertCustomer = $conn->prepare(
                    "INSERT INTO customers 
                    (license_plate, name, phone, motorcycle_type, is_member, created_at)
                    VALUES (?, ?, ?, ?, false, NOW())"
                );
                $insertCustomer->execute([
                    strtoupper(trim($data['license_plate'])),
                    $data['customer_name'],
                    $data['customer_phone'] ?? null,
                    $data['motorcycle_type']
                ]);
                $customerId = $conn->lastInsertId();
            }
        }
        
        if (!$customerId) {
            sendError('Customer information required', 400);
        }
        
        // Validate operator exists
        $operatorStmt = $conn->prepare("SELECT id, commission_rate FROM operators WHERE id = ?");
        $operatorStmt->execute([$data['operator_id']]);
        $operator = $operatorStmt->fetch();
        if (!$operator) {
            sendError('Operator not found', 404);
        }
        
        // Use frontend transaction_id or generate new one
        $transactionCode = $data['transaction_id'] ?? ('TRX' . date('YmdHis') . '-' . mt_rand(100, 999));
        
        // Calculate commission (30% even for free washes as per requirement)
        $price = (float)$data['price'];
        $originalPrice = (float)($data['original_price'] ?? $price);
        $isLoyaltyFree = isset($data['is_loyalty_free']) && $data['is_loyalty_free'] === true;
        $commissionRate = (float)$operator['commission_rate'];
        
        // Commission based on original price for free washes
        $commissionBasePrice = $isLoyaltyFree ? $originalPrice : $price;
        $commissionAmount = ($commissionBasePrice * $commissionRate) / 100;
        
        // Prepare insert statement with all fields from frontend
        $insertStmt = $conn->prepare(
            "INSERT INTO transactions 
            (transaction_code, customer_id, operator_id, wash_type, amount, commission_amount, 
             payment_method, status, notes, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())"
        );
        
        $insertStmt->execute([
            $transactionCode,
            $customerId,
            $data['operator_id'],
            'standard', // Default wash type
            $price, // Final price (0 if free)
            $commissionAmount,
            $data['payment_method'],
            'completed',
            $data['notes'] ?? ''
        ]);
        
        $transactionId = $conn->lastInsertId();
        
        // Record commission
        $commissionStmt = $conn->prepare(
            "INSERT INTO commissions (operator_id, transaction_id, amount, status, created_at)
             VALUES (?, ?, ?, 'pending', NOW())"
        );
        $commissionStmt->execute([
            $data['operator_id'],
            $transactionId,
            $commissionAmount
        ]);
        
        // Update customer stats
        $updateStmt = $conn->prepare(
            "UPDATE customers SET total_washes = total_washes + 1, last_wash_date = NOW() 
             WHERE id = ?"
        );
        $updateStmt->execute([$customerId]);
        
        // Update operator stats
        $updateOpStmt = $conn->prepare(
            "UPDATE operators SET total_washes = total_washes + 1, total_commission = total_commission + ? 
             WHERE id = ?"
        );
        $updateOpStmt->execute([$commissionAmount, $data['operator_id']]);
        
        logMessage('TRANSACTION_CREATED', [
            'code' => $transactionCode,
            'customer_id' => $customerId,
            'price' => $price,
            'is_free' => $isLoyaltyFree,
            'commission' => $commissionAmount,
            'user' => $_SESSION['username'] ?? 'unknown'
        ], 'INFO');
        
        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Transaction created successfully',
            'data' => [
                'id' => (int)$transactionId,
                'transaction_code' => $transactionCode,
                'customer_id' => (int)$customerId,
                'operator_id' => (int)$data['operator_id'],
                'price' => $price,
                'original_price' => $originalPrice,
                'commission_amount' => $commissionAmount,
                'is_loyalty_free' => $isLoyaltyFree,
                'status' => 'completed'
            ]
        ]);
        
    } catch (PDOException $e) {
        logMessage('CREATE_TRANSACTION_ERROR', ['error' => $e->getMessage()], 'ERROR');
        http_response_code(500);
        sendError('Error creating transaction', 500);
    }
}

/**
 * PUT - Update transaction
 */
function handleUpdateTransaction() {
    $data = getRequestData();
    
    if (empty($data['id'])) {
        sendError('Transaction ID is required', 400);
    }
    
    try {
        $conn = getConnection();
        
        // Check if transaction exists
        $checkStmt = $conn->prepare("SELECT id FROM transactions WHERE id = ?");
        $checkStmt->execute([$data['id']]);
        if (!$checkStmt->fetch()) {
            sendError('Transaction not found', 404);
        }
        
        // Update allowed fields
        $updateFields = [];
        $updateParams = [];
        
        if (isset($data['status'])) {
            $updateFields[] = 'status = ?';
            $updateParams[] = $data['status'];
        }
        
        if (isset($data['notes'])) {
            $updateFields[] = 'notes = ?';
            $updateParams[] = $data['notes'];
        }
        
        if (isset($data['payment_method'])) {
            $updateFields[] = 'payment_method = ?';
            $updateParams[] = $data['payment_method'];
        }
        
        if (empty($updateFields)) {
            sendError('No fields to update', 400);
        }
        
        $updateFields[] = 'updated_at = NOW()';
        $updateParams[] = $data['id'];
        
        $updateStmt = $conn->prepare(
            "UPDATE transactions SET " . implode(', ', $updateFields) . " WHERE id = ?"
        );
        $updateStmt->execute($updateParams);
        
        logMessage('TRANSACTION_UPDATED', [
            'transaction_id' => $data['id'],
            'changes' => $data
        ], 'INFO');
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Transaction updated successfully',
            'data' => [
                'id' => (int)$data['id']
            ]
        ]);
        
    } catch (PDOException $e) {
        logMessage('UPDATE_TRANSACTION_ERROR', ['error' => $e->getMessage()], 'ERROR');
        http_response_code(500);
        sendError('Error updating transaction', 500);
    }
}

/**
 * DELETE - Soft delete transaction (mark as cancelled)
 */
function handleDeleteTransaction() {
    $data = getRequestData();
    
    if (empty($data['id'])) {
        sendError('Transaction ID is required', 400);
    }
    
    try {
        $conn = getConnection();
        
        // Soft delete - mark as cancelled instead of hard delete
        $deleteStmt = $conn->prepare(
            "UPDATE transactions SET status = 'cancelled', updated_at = NOW() WHERE id = ?"
        );
        $deleteStmt->execute([$data['id']]);
        
        if ($deleteStmt->rowCount() === 0) {
            sendError('Transaction not found', 404);
        }
        
        logMessage('TRANSACTION_CANCELLED', [
            'transaction_id' => $data['id'],
            'reason' => $data['reason'] ?? 'User cancelled'
        ], 'INFO');
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Transaction cancelled successfully',
            'data' => [
                'id' => (int)$data['id'],
                'status' => 'cancelled'
            ]
        ]);
        
    } catch (PDOException $e) {
        logMessage('DELETE_TRANSACTION_ERROR', ['error' => $e->getMessage()], 'ERROR');
        http_response_code(500);
        sendError('Error cancelling transaction', 500);
    }
}

?>
