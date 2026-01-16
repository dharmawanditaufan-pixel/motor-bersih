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
        $page = (int)($_GET['page'] ?? 1);
        $limit = (int)($_GET['limit'] ?? 20);
        $offset = ($page - 1) * $limit;
        
        // Build query
        $query = "SELECT * FROM transactions WHERE 1=1";
        $params = [];
        
        if ($id) {
            $query .= " AND id = ?";
            $params[] = $id;
        }
        
        if ($status) {
            $query .= " AND status = ?";
            $params[] = $status;
        }
        
        if ($operator_id) {
            $query .= " AND operator_id = ?";
            $params[] = $operator_id;
        }
        
        if ($customer_id) {
            $query .= " AND customer_id = ?";
            $params[] = $customer_id;
        }
        
        if ($start_date && $end_date) {
            $query .= " AND DATE(created_at) BETWEEN ? AND ?";
            $params[] = $start_date;
            $params[] = $end_date;
        }
        
        // Get total count
        $countStmt = $conn->prepare(str_replace('SELECT *', 'SELECT COUNT(*) as count', explode('LIMIT', $query)[0]));
        $countStmt->execute($params);
        $total = $countStmt->fetch()['count'];
        
        // Add ordering and pagination
        $query .= " ORDER BY created_at DESC LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $conn->prepare($query);
        $stmt->execute($params);
        $transactions = $stmt->fetchAll();
        
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
    
    // Validate required fields
    $validation = validateRequired($data, ['customer_id', 'operator_id', 'wash_type', 'amount', 'payment_method']);
    if ($validation !== true) {
        sendError($validation, 400);
    }
    
    try {
        $conn = getConnection();
        
        // Validate customer exists
        $customerStmt = $conn->prepare("SELECT id FROM customers WHERE id = ?");
        $customerStmt->execute([$data['customer_id']]);
        if (!$customerStmt->fetch()) {
            sendError('Customer not found', 404);
        }
        
        // Validate operator exists
        $operatorStmt = $conn->prepare("SELECT id, commission_rate FROM operators WHERE id = ?");
        $operatorStmt->execute([$data['operator_id']]);
        $operator = $operatorStmt->fetch();
        if (!$operator) {
            sendError('Operator not found', 404);
        }
        
        // Generate unique transaction code
        $transactionCode = 'TRX' . date('YmdHis') . '-' . mt_rand(100, 999);
        
        // Calculate commission
        $amount = (float)$data['amount'];
        $commissionRate = (float)$operator['commission_rate'];
        $commissionAmount = ($amount * $commissionRate) / 100;
        
        // Prepare insert statement
        $insertStmt = $conn->prepare(
            "INSERT INTO transactions 
            (transaction_code, customer_id, operator_id, wash_type, amount, commission_amount, payment_method, status, notes, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())"
        );
        
        $insertStmt->execute([
            $transactionCode,
            $data['customer_id'],
            $data['operator_id'],
            $data['wash_type'] ?? 'standard',
            $amount,
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
        
        // Update customer wash count
        $updateStmt = $conn->prepare(
            "UPDATE customers SET total_washes = total_washes + 1, last_wash_date = NOW() 
             WHERE id = ?"
        );
        $updateStmt->execute([$data['customer_id']]);
        
        // Update operator wash count and commission
        $updateOpStmt = $conn->prepare(
            "UPDATE operators SET total_washes = total_washes + 1, total_commission = total_commission + ? 
             WHERE id = ?"
        );
        $updateOpStmt->execute([$commissionAmount, $data['operator_id']]);
        
        logMessage('TRANSACTION_CREATED', [
            'code' => $transactionCode,
            'customer_id' => $data['customer_id'],
            'amount' => $amount,
            'user' => $_SESSION['username'] ?? 'unknown'
        ], 'INFO');
        
        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Transaction created successfully',
            'data' => [
                'id' => (int)$transactionId,
                'transaction_code' => $transactionCode,
                'customer_id' => (int)$data['customer_id'],
                'operator_id' => (int)$data['operator_id'],
                'amount' => $amount,
                'commission_amount' => $commissionAmount,
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
