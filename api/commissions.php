<?php
/**
 * Motor Bersih POS - Commissions API Endpoint
 * Handles commission payments and tracking
 * Date: January 17, 2026
 */

require_once 'config.php';

// Check authentication
$user = checkAuth();
if (!$user) {
    http_response_code(401);
    sendError('Unauthorized - Please login first', 401);
}

$method = $_SERVER['REQUEST_METHOD'];

// Get the request URI path to determine endpoint
$requestUri = $_SERVER['REQUEST_URI'];
$isPay = strpos($requestUri, '/pay') !== false;

// Route requests
if ($method === 'GET') {
    handleGetCommissions();
} elseif ($method === 'POST' && $isPay) {
    handlePayCommission();
} elseif ($method === 'POST') {
    handleCreateCommission();
} elseif ($method === 'PUT') {
    handleUpdateCommission();
} elseif ($method === 'DELETE') {
    handleDeleteCommission();
} else {
    http_response_code(405);
    sendError('Method not allowed', 405);
}

/**
 * GET - Retrieve commissions
 */
function handleGetCommissions() {
    try {
        $conn = getConnection();
        
        // Get query parameters
        $operator_id = $_GET['operator_id'] ?? null;
        $status = $_GET['status'] ?? null;
        $start_date = $_GET['start_date'] ?? null;
        $end_date = $_GET['end_date'] ?? null;
        
        // Build query
        $query = "
            SELECT 
                c.id,
                c.operator_id,
                c.transaction_id,
                c.amount,
                c.status,
                c.paid_at,
                c.paid_by,
                c.notes,
                c.created_at,
                o.name as operator_name,
                t.created_at as transaction_date,
                t.amount as transaction_amount
            FROM commissions c
            LEFT JOIN operators o ON c.operator_id = o.id
            LEFT JOIN transactions t ON c.transaction_id = t.id
            WHERE 1=1
        ";
        $params = [];
        
        if ($operator_id) {
            $query .= " AND c.operator_id = ?";
            $params[] = $operator_id;
        }
        
        if ($status) {
            $query .= " AND c.status = ?";
            $params[] = $status;
        }
        
        if ($start_date && $end_date) {
            $query .= " AND DATE(c.created_at) BETWEEN ? AND ?";
            $params[] = $start_date;
            $params[] = $end_date;
        }
        
        $query .= " ORDER BY c.created_at DESC";
        
        $stmt = $conn->prepare($query);
        $stmt->execute($params);
        $commissions = $stmt->fetchAll();
        
        // Convert numeric strings
        foreach ($commissions as &$commission) {
            $commission['id'] = (int)$commission['id'];
            $commission['operator_id'] = (int)$commission['operator_id'];
            $commission['transaction_id'] = (int)($commission['transaction_id'] ?? 0);
            $commission['amount'] = (float)$commission['amount'];
            $commission['transaction_amount'] = (float)($commission['transaction_amount'] ?? 0);
        }
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Commissions retrieved',
            'data' => $commissions
        ]);
        
    } catch (PDOException $e) {
        logMessage('GET_COMMISSIONS_ERROR', ['error' => $e->getMessage()], 'ERROR');
        http_response_code(500);
        sendError('Error retrieving commissions', 500);
    }
}

/**
 * POST /pay - Pay commission to operator
 * Marks pending commissions as paid and updates operator's total
 */
function handlePayCommission() {
    $data = getRequestData();
    
    // Validate required fields
    if (empty($data['operator_id'])) {
        sendError('Operator ID is required', 400);
    }
    
    // Only admin can pay commissions
    $user = checkAuth();
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        sendError('Only admin can pay commissions', 403);
    }
    
    try {
        $conn = getConnection();
        $conn->beginTransaction();
        
        // Get pending commissions for this operator
        $stmt = $conn->prepare(
            "SELECT id, amount FROM commissions 
             WHERE operator_id = ? AND status = 'pending'"
        );
        $stmt->execute([$data['operator_id']]);
        $pendingCommissions = $stmt->fetchAll();
        
        if (empty($pendingCommissions)) {
            $conn->rollBack();
            sendError('No pending commissions for this operator', 404);
        }
        
        // Calculate total amount
        $totalAmount = array_sum(array_column($pendingCommissions, 'amount'));
        $commissionIds = array_column($pendingCommissions, 'id');
        
        // Update commissions to paid status
        $placeholders = str_repeat('?,', count($commissionIds) - 1) . '?';
        $updateParams = array_merge(
            [$user['id'], $data['notes'] ?? 'Commission payment'],
            $commissionIds
        );
        
        $updateStmt = $conn->prepare(
            "UPDATE commissions 
             SET status = 'paid', 
                 paid_at = NOW(), 
                 paid_by = ?,
                 notes = ?
             WHERE id IN ($placeholders)"
        );
        $updateStmt->execute($updateParams);
        
        // Update operator's total_commission (accumulated)
        $operatorStmt = $conn->prepare(
            "UPDATE operators 
             SET total_commission = total_commission + ?,
                 updated_at = NOW()
             WHERE id = ?"
        );
        $operatorStmt->execute([$totalAmount, $data['operator_id']]);
        
        $conn->commit();
        
        logMessage('COMMISSION_PAID', [
            'operator_id' => $data['operator_id'],
            'amount' => $totalAmount,
            'count' => count($commissionIds),
            'paid_by' => $user['username']
        ], 'INFO');
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Commissions paid successfully',
            'data' => [
                'operator_id' => (int)$data['operator_id'],
                'total_amount' => (float)$totalAmount,
                'commissions_paid' => count($commissionIds),
                'paid_at' => date('Y-m-d H:i:s')
            ]
        ]);
        
    } catch (PDOException $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }
        logMessage('PAY_COMMISSION_ERROR', ['error' => $e->getMessage()], 'ERROR');
        http_response_code(500);
        sendError('Error paying commission', 500);
    }
}

/**
 * POST - Create commission manually (admin only)
 */
function handleCreateCommission() {
    $data = getRequestData();
    
    // Validate required fields
    $validation = validateRequired($data, ['operator_id', 'amount']);
    if ($validation !== true) {
        sendError($validation, 400);
    }
    
    // Only admin can create manual commissions
    $user = checkAuth();
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        sendError('Only admin can create manual commissions', 403);
    }
    
    try {
        $conn = getConnection();
        
        $insertStmt = $conn->prepare(
            "INSERT INTO commissions (operator_id, transaction_id, amount, status, notes) 
             VALUES (?, ?, ?, ?, ?)"
        );
        
        $insertStmt->execute([
            $data['operator_id'],
            $data['transaction_id'] ?? null,
            $data['amount'],
            $data['status'] ?? 'pending',
            $data['notes'] ?? 'Manual commission entry'
        ]);
        
        $commissionId = $conn->lastInsertId();
        
        logMessage('COMMISSION_CREATED', [
            'id' => $commissionId,
            'operator_id' => $data['operator_id'],
            'amount' => $data['amount']
        ], 'INFO');
        
        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Commission created successfully',
            'data' => [
                'id' => (int)$commissionId,
                'operator_id' => (int)$data['operator_id'],
                'amount' => (float)$data['amount']
            ]
        ]);
        
    } catch (PDOException $e) {
        logMessage('CREATE_COMMISSION_ERROR', ['error' => $e->getMessage()], 'ERROR');
        http_response_code(500);
        sendError('Error creating commission', 500);
    }
}

/**
 * PUT - Update commission (admin only)
 */
function handleUpdateCommission() {
    $data = getRequestData();
    
    if (empty($data['id'])) {
        sendError('Commission ID is required', 400);
    }
    
    // Only admin can update commissions
    $user = checkAuth();
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        sendError('Only admin can update commissions', 403);
    }
    
    try {
        $conn = getConnection();
        
        // Build dynamic update query
        $updateFields = [];
        $params = [];
        
        $allowedFields = ['amount', 'status', 'notes'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updateFields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        if (empty($updateFields)) {
            sendError('No fields to update', 400);
        }
        
        $params[] = $data['id'];
        
        $updateStmt = $conn->prepare(
            "UPDATE commissions SET " . implode(', ', $updateFields) . " WHERE id = ?"
        );
        $updateStmt->execute($params);
        
        if ($updateStmt->rowCount() === 0) {
            sendError('Commission not found', 404);
        }
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Commission updated successfully'
        ]);
        
    } catch (PDOException $e) {
        logMessage('UPDATE_COMMISSION_ERROR', ['error' => $e->getMessage()], 'ERROR');
        http_response_code(500);
        sendError('Error updating commission', 500);
    }
}

/**
 * DELETE - Delete commission (admin only)
 */
function handleDeleteCommission() {
    // Only admin can delete commissions
    $user = checkAuth();
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        sendError('Only admin can delete commissions', 403);
    }
    
    $id = $_GET['id'] ?? null;
    
    if (!$id) {
        sendError('Commission ID is required', 400);
    }
    
    try {
        $conn = getConnection();
        
        $deleteStmt = $conn->prepare("DELETE FROM commissions WHERE id = ?");
        $deleteStmt->execute([$id]);
        
        if ($deleteStmt->rowCount() === 0) {
            sendError('Commission not found', 404);
        }
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Commission deleted successfully'
        ]);
        
    } catch (PDOException $e) {
        logMessage('DELETE_COMMISSION_ERROR', ['error' => $e->getMessage()], 'ERROR');
        http_response_code(500);
        sendError('Error deleting commission', 500);
    }
}
