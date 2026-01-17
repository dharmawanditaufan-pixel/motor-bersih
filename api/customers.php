<?php
/**
 * Motor Bersih POS - Customers API Endpoint
 * Handles CRUD operations for customers/members
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
        handleGetCustomers();
        break;
    case 'POST':
        handleCreateCustomer();
        break;
    case 'PUT':
        handleUpdateCustomer();
        break;
    case 'DELETE':
        handleDeleteCustomer();
        break;
    default:
        http_response_code(405);
        sendError('Method not allowed', 405);
}

/**
 * GET - Retrieve customers
 */
function handleGetCustomers() {
    try {
        $conn = getConnection();
        
        // Get query parameters
        $id = $_GET['id'] ?? null;
        $license_plate = $_GET['license_plate'] ?? null;
        $is_member = $_GET['is_member'] ?? null;
        $search = $_GET['search'] ?? null;
        $page = (int)($_GET['page'] ?? 1);
        $limit = (int)($_GET['limit'] ?? 50);
        $offset = ($page - 1) * $limit;
        
        // Build query
        $query = "SELECT * FROM customers WHERE 1=1";
        $params = [];
        
        if ($id) {
            $query .= " AND id = ?";
            $params[] = $id;
        }
        
        if ($license_plate) {
            $query .= " AND REPLACE(UPPER(license_plate), ' ', '') = REPLACE(UPPER(?), ' ', '')";
            $params[] = $license_plate;
        }
        
        if ($is_member !== null) {
            $query .= " AND is_member = ?";
            $params[] = $is_member === 'true' || $is_member === '1' ? 1 : 0;
        }
        
        if ($search) {
            $query .= " AND (name LIKE ? OR license_plate LIKE ? OR phone LIKE ?)";
            $searchTerm = "%{$search}%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        // Get total count
        $countQuery = str_replace('SELECT *', 'SELECT COUNT(*) as count', $query);
        $countStmt = $conn->prepare($countQuery);
        $countStmt->execute($params);
        $total = $countStmt->fetch()['count'];
        
        // Add ordering and pagination
        $query .= " ORDER BY created_at DESC LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $conn->prepare($query);
        $stmt->execute($params);
        $customers = $stmt->fetchAll();
        
        // If single customer requested, return just the data
        if ($id && count($customers) === 1) {
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Customer retrieved',
                'data' => $customers[0]
            ]);
        } else {
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Customers retrieved',
                'data' => $customers,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => (int)$total,
                    'pages' => ceil($total / $limit)
                ]
            ]);
        }
        
    } catch (PDOException $e) {
        logMessage('GET_CUSTOMERS_ERROR', ['error' => $e->getMessage()], 'ERROR');
        http_response_code(500);
        sendError('Error retrieving customers', 500);
    }
}

/**
 * POST - Create new customer
 */
function handleCreateCustomer() {
    $data = getRequestData();
    
    // Validate required fields
    $validation = validateRequired($data, ['license_plate', 'name']);
    if ($validation !== true) {
        sendError($validation, 400);
    }
    
    try {
        $conn = getConnection();
        
        // Check if license plate already exists
        $checkStmt = $conn->prepare("SELECT id FROM customers WHERE REPLACE(UPPER(license_plate), ' ', '') = REPLACE(UPPER(?), ' ', '')");
        $checkStmt->execute([$data['license_plate']]);
        if ($checkStmt->fetch()) {
            sendError('License plate already registered', 409);
        }
        
        // Validate motorcycle type
        $validTypes = ['motor_kecil', 'motor_sedang', 'motor_besar'];
        $motorcycleType = $data['motorcycle_type'] ?? 'motor_kecil';
        if (!in_array($motorcycleType, $validTypes)) {
            sendError('Invalid motorcycle type. Must be: motor_kecil, motor_sedang, or motor_besar', 400);
        }
        
        // Prepare insert
        $insertStmt = $conn->prepare(
            "INSERT INTO customers 
            (license_plate, name, phone, whatsapp_number, email, motorcycle_type, motorcycle_brand, 
             photo_url, is_member, loyalty_count, total_washes, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())"
        );
        
        $insertStmt->execute([
            strtoupper(trim($data['license_plate'])),
            $data['name'],
            $data['phone'] ?? null,
            $data['whatsapp_number'] ?? $data['phone'] ?? null,
            $data['email'] ?? null,
            $motorcycleType,
            $data['motorcycle_brand'] ?? null,
            $data['photo_url'] ?? null,
            isset($data['is_member']) ? ($data['is_member'] ? 1 : 0) : 1,
            $data['loyalty_count'] ?? 0,
            $data['total_washes'] ?? 0
        ]);
        
        $customerId = $conn->lastInsertId();
        
        logMessage('CUSTOMER_CREATED', [
            'id' => $customerId,
            'license_plate' => $data['license_plate'],
            'name' => $data['name'],
            'user' => $_SESSION['username'] ?? 'unknown'
        ], 'INFO');
        
        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Customer created successfully',
            'data' => [
                'id' => (int)$customerId,
                'license_plate' => strtoupper(trim($data['license_plate'])),
                'name' => $data['name'],
                'motorcycle_type' => $motorcycleType,
                'loyalty_count' => $data['loyalty_count'] ?? 0
            ]
        ]);
        
    } catch (PDOException $e) {
        logMessage('CREATE_CUSTOMER_ERROR', ['error' => $e->getMessage()], 'ERROR');
        http_response_code(500);
        sendError('Error creating customer', 500);
    }
}

/**
 * PUT - Update customer
 */
function handleUpdateCustomer() {
    $data = getRequestData();
    
    if (empty($data['id'])) {
        sendError('Customer ID is required', 400);
    }
    
    try {
        $conn = getConnection();
        
        // Check if customer exists
        $checkStmt = $conn->prepare("SELECT id FROM customers WHERE id = ?");
        $checkStmt->execute([$data['id']]);
        if (!$checkStmt->fetch()) {
            sendError('Customer not found', 404);
        }
        
        // Build dynamic update query
        $updateFields = [];
        $params = [];
        
        $allowedFields = ['name', 'phone', 'whatsapp_number', 'email', 'motorcycle_type', 
                         'motorcycle_brand', 'photo_url', 'is_member', 'loyalty_count', 
                         'total_washes', 'last_wash_date'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updateFields[] = "$field = ?";
                
                // Handle boolean fields
                if ($field === 'is_member') {
                    $params[] = $data[$field] ? 1 : 0;
                } else {
                    $params[] = $data[$field];
                }
            }
        }
        
        if (empty($updateFields)) {
            sendError('No fields to update', 400);
        }
        
        // Add updated_at
        $updateFields[] = "updated_at = NOW()";
        
        $params[] = $data['id'];
        
        $updateStmt = $conn->prepare(
            "UPDATE customers SET " . implode(', ', $updateFields) . " WHERE id = ?"
        );
        $updateStmt->execute($params);
        
        logMessage('CUSTOMER_UPDATED', [
            'id' => $data['id'],
            'fields' => array_keys($data),
            'user' => $_SESSION['username'] ?? 'unknown'
        ], 'INFO');
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Customer updated successfully',
            'data' => [
                'id' => (int)$data['id'],
                'updated_fields' => count($updateFields) - 1
            ]
        ]);
        
    } catch (PDOException $e) {
        logMessage('UPDATE_CUSTOMER_ERROR', ['error' => $e->getMessage()], 'ERROR');
        http_response_code(500);
        sendError('Error updating customer', 500);
    }
}

/**
 * DELETE - Delete customer
 */
function handleDeleteCustomer() {
    $id = $_GET['id'] ?? null;
    
    if (!$id) {
        sendError('Customer ID is required', 400);
    }
    
    try {
        $conn = getConnection();
        
        // Check if customer has transactions
        $txnStmt = $conn->prepare("SELECT COUNT(*) as count FROM transactions WHERE customer_id = ?");
        $txnStmt->execute([$id]);
        $txnCount = $txnStmt->fetch()['count'];
        
        if ($txnCount > 0) {
            sendError('Cannot delete customer with existing transactions', 409);
        }
        
        // Delete customer
        $deleteStmt = $conn->prepare("DELETE FROM customers WHERE id = ?");
        $deleteStmt->execute([$id]);
        
        if ($deleteStmt->rowCount() === 0) {
            sendError('Customer not found', 404);
        }
        
        logMessage('CUSTOMER_DELETED', [
            'id' => $id,
            'user' => $_SESSION['username'] ?? 'unknown'
        ], 'INFO');
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Customer deleted successfully'
        ]);
        
    } catch (PDOException $e) {
        logMessage('DELETE_CUSTOMER_ERROR', ['error' => $e->getMessage()], 'ERROR');
        http_response_code(500);
        sendError('Error deleting customer', 500);
    }
}
