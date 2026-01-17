<?php
/**
 * Motor Bersih POS - Operators API Endpoint
 * Handles CRUD operations for operators
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

switch ($method) {
    case 'GET':
        handleGetOperators();
        break;
    case 'POST':
        handleCreateOperator();
        break;
    case 'PUT':
        handleUpdateOperator();
        break;
    case 'DELETE':
        handleDeleteOperator();
        break;
    default:
        http_response_code(405);
        sendError('Method not allowed', 405);
}

/**
 * GET - Retrieve operators
 */
function handleGetOperators() {
    try {
        $conn = getConnection();
        
        // Get query parameters
        $id = $_GET['id'] ?? null;
        $status = $_GET['status'] ?? null;
        $include_stats = $_GET['include_stats'] ?? 'false';
        
        // Build query
        if ($include_stats === 'true') {
            $query = "
                SELECT 
                    o.id,
                    o.user_id,
                    o.name,
                    o.phone,
                    o.commission_rate,
                    o.status,
                    o.bank_name,
                    o.bank_account,
                    o.total_commission,
                    o.total_washes,
                    o.created_at,
                    u.username,
                    u.email,
                    (SELECT COUNT(*) FROM transactions t WHERE t.operator_id = o.id AND t.status = 'completed') as completed_transactions,
                    (SELECT SUM(t.amount) FROM transactions t WHERE t.operator_id = o.id AND t.status = 'completed') as total_revenue,
                    (SELECT COUNT(*) FROM operator_attendance WHERE operator_id = o.id AND status = 'present') as days_present,
                    (SELECT SUM(c.amount) FROM commissions c WHERE c.operator_id = o.id AND c.status = 'pending') as pending_commission
                FROM operators o
                LEFT JOIN users u ON o.user_id = u.id
                WHERE 1=1
            ";
        } else {
            $query = "
                SELECT 
                    o.id,
                    o.user_id,
                    o.name,
                    o.phone,
                    o.commission_rate,
                    o.status,
                    o.bank_name,
                    o.bank_account,
                    o.total_commission,
                    o.total_washes,
                    o.created_at,
                    u.username
                FROM operators o
                LEFT JOIN users u ON o.user_id = u.id
                WHERE 1=1
            ";
        }
        
        $params = [];
        
        if ($id) {
            $query .= " AND o.id = ?";
            $params[] = $id;
        }
        
        if ($status) {
            $query .= " AND o.status = ?";
            $params[] = $status;
        }
        
        $query .= " ORDER BY o.name ASC";
        
        $stmt = $conn->prepare($query);
        $stmt->execute($params);
        $operators = $stmt->fetchAll();
        
        // Convert numeric strings to proper types
        foreach ($operators as &$operator) {
            $operator['id'] = (int)$operator['id'];
            $operator['commission_rate'] = (float)$operator['commission_rate'];
            $operator['total_commission'] = (float)($operator['total_commission'] ?? 0);
            $operator['total_washes'] = (int)($operator['total_washes'] ?? 0);
            
            if ($include_stats === 'true') {
                $operator['completed_transactions'] = (int)($operator['completed_transactions'] ?? 0);
                $operator['total_revenue'] = (float)($operator['total_revenue'] ?? 0);
                $operator['days_present'] = (int)($operator['days_present'] ?? 0);
                $operator['pending_commission'] = (float)($operator['pending_commission'] ?? 0);
            }
        }
        
        // If single operator requested, return just the data
        if ($id && count($operators) === 1) {
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Operator retrieved',
                'data' => $operators[0]
            ]);
        } else {
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Operators retrieved',
                'data' => $operators
            ]);
        }
        
    } catch (PDOException $e) {
        logMessage('GET_OPERATORS_ERROR', ['error' => $e->getMessage()], 'ERROR');
        http_response_code(500);
        sendError('Error retrieving operators', 500);
    }
}

/**
 * POST - Create new operator (requires admin)
 */
function handleCreateOperator() {
    // Only admin can create operators
    $user = checkAuth();
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        sendError('Only admin can create operators', 403);
    }
    
    $data = getRequestData();
    
    // Validate required fields
    $validation = validateRequired($data, ['user_id', 'name']);
    if ($validation !== true) {
        sendError($validation, 400);
    }
    
    try {
        $conn = getConnection();
        
        // Check if user exists and is operator role
        $userStmt = $conn->prepare("SELECT id, role FROM users WHERE id = ?");
        $userStmt->execute([$data['user_id']]);
        $userCheck = $userStmt->fetch();
        
        if (!$userCheck) {
            sendError('User not found', 404);
        }
        
        if ($userCheck['role'] !== 'operator') {
            sendError('User must have operator role', 400);
        }
        
        // Check if operator already exists for this user
        $opStmt = $conn->prepare("SELECT id FROM operators WHERE user_id = ?");
        $opStmt->execute([$data['user_id']]);
        if ($opStmt->fetch()) {
            sendError('Operator already exists for this user', 409);
        }
        
        // Create operator
        $insertStmt = $conn->prepare(
            "INSERT INTO operators 
            (user_id, name, phone, commission_rate, status, bank_name, bank_account, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())"
        );
        
        $insertStmt->execute([
            $data['user_id'],
            $data['name'],
            $data['phone'] ?? null,
            $data['commission_rate'] ?? 30.00,
            $data['status'] ?? 'active',
            $data['bank_name'] ?? null,
            $data['bank_account'] ?? null
        ]);
        
        $operatorId = $conn->lastInsertId();
        
        logMessage('OPERATOR_CREATED', [
            'id' => $operatorId,
            'user_id' => $data['user_id'],
            'name' => $data['name'],
            'admin' => $_SESSION['username'] ?? 'unknown'
        ], 'INFO');
        
        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Operator created successfully',
            'data' => [
                'id' => (int)$operatorId,
                'user_id' => (int)$data['user_id'],
                'name' => $data['name'],
                'commission_rate' => (float)($data['commission_rate'] ?? 30.00)
            ]
        ]);
        
    } catch (PDOException $e) {
        logMessage('CREATE_OPERATOR_ERROR', ['error' => $e->getMessage()], 'ERROR');
        http_response_code(500);
        sendError('Error creating operator', 500);
    }
}

/**
 * PUT - Update operator
 */
function handleUpdateOperator() {
    $data = getRequestData();
    
    if (empty($data['id'])) {
        sendError('Operator ID is required', 400);
    }
    
    // Only admin can update commission rate and status
    $user = checkAuth();
    $isAdmin = $user['role'] === 'admin';
    
    try {
        $conn = getConnection();
        
        // Check if operator exists
        $checkStmt = $conn->prepare("SELECT id, user_id FROM operators WHERE id = ?");
        $checkStmt->execute([$data['id']]);
        $operator = $checkStmt->fetch();
        
        if (!$operator) {
            sendError('Operator not found', 404);
        }
        
        // Operators can only update their own data (except commission_rate and status)
        if (!$isAdmin && $operator['user_id'] != $user['id']) {
            sendError('You can only update your own data', 403);
        }
        
        // Build dynamic update query
        $updateFields = [];
        $params = [];
        
        $allowedFields = ['name', 'phone', 'bank_name', 'bank_account'];
        
        // Admin can also update these fields
        if ($isAdmin) {
            $allowedFields[] = 'commission_rate';
            $allowedFields[] = 'status';
            $allowedFields[] = 'total_commission';
            $allowedFields[] = 'total_washes';
        }
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updateFields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        if (empty($updateFields)) {
            sendError('No fields to update', 400);
        }
        
        // Add updated_at
        $updateFields[] = "updated_at = NOW()";
        
        $params[] = $data['id'];
        
        $updateStmt = $conn->prepare(
            "UPDATE operators SET " . implode(', ', $updateFields) . " WHERE id = ?"
        );
        $updateStmt->execute($params);
        
        logMessage('OPERATOR_UPDATED', [
            'id' => $data['id'],
            'fields' => array_keys($data),
            'user' => $_SESSION['username'] ?? 'unknown'
        ], 'INFO');
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Operator updated successfully',
            'data' => [
                'id' => (int)$data['id'],
                'updated_fields' => count($updateFields) - 1
            ]
        ]);
        
    } catch (PDOException $e) {
        logMessage('UPDATE_OPERATOR_ERROR', ['error' => $e->getMessage()], 'ERROR');
        http_response_code(500);
        sendError('Error updating operator', 500);
    }
}

/**
 * DELETE - Delete operator (admin only)
 */
function handleDeleteOperator() {
    // Only admin can delete operators
    $user = checkAuth();
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        sendError('Only admin can delete operators', 403);
    }
    
    $id = $_GET['id'] ?? null;
    
    if (!$id) {
        sendError('Operator ID is required', 400);
    }
    
    try {
        $conn = getConnection();
        
        // Check if operator has transactions
        $txnStmt = $conn->prepare("SELECT COUNT(*) as count FROM transactions WHERE operator_id = ?");
        $txnStmt->execute([$id]);
        $txnCount = $txnStmt->fetch()['count'];
        
        if ($txnCount > 0) {
            // Instead of deleting, set status to inactive
            $updateStmt = $conn->prepare("UPDATE operators SET status = 'inactive', updated_at = NOW() WHERE id = ?");
            $updateStmt->execute([$id]);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Operator deactivated (has existing transactions)'
            ]);
        } else {
            // Delete operator (and associated user will cascade)
            $deleteStmt = $conn->prepare("DELETE FROM operators WHERE id = ?");
            $deleteStmt->execute([$id]);
            
            if ($deleteStmt->rowCount() === 0) {
                sendError('Operator not found', 404);
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Operator deleted successfully'
            ]);
        }
        
        logMessage('OPERATOR_DELETED', [
            'id' => $id,
            'admin' => $_SESSION['username'] ?? 'unknown'
        ], 'INFO');
        
    } catch (PDOException $e) {
        logMessage('DELETE_OPERATOR_ERROR', ['error' => $e->getMessage()], 'ERROR');
        http_response_code(500);
        sendError('Error deleting operator', 500);
    }
}
