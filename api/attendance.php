<?php
/**
 * Motor Bersih POS - Attendance API Endpoint
 * Handles operator attendance check-in/check-out
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
$path = $_GET['path'] ?? '';

// Route requests
if ($method === 'GET') {
    handleGetAttendance();
} elseif ($method === 'POST') {
    if (strpos($path, 'checkin') !== false) {
        handleCheckIn();
    } elseif (strpos($path, 'checkout') !== false) {
        handleCheckOut();
    } else {
        handleCreateAttendance();
    }
} elseif ($method === 'PUT') {
    handleUpdateAttendance();
} elseif ($method === 'DELETE') {
    handleDeleteAttendance();
} else {
    http_response_code(405);
    sendError('Method not allowed', 405);
}

/**
 * GET - Retrieve attendance records
 */
function handleGetAttendance() {
    try {
        $conn = getConnection();
        
        // Get query parameters
        $operator_id = $_GET['operator_id'] ?? null;
        $date = $_GET['date'] ?? null;
        $month = $_GET['month'] ?? null;
        $year = $_GET['year'] ?? date('Y');
        $status = $_GET['status'] ?? null;
        
        // Build query
        $query = "
            SELECT 
                a.id,
                a.operator_id,
                a.date,
                a.check_in,
                a.check_out,
                a.status,
                a.notes,
                a.created_at,
                o.name as operator_name
            FROM operator_attendance a
            LEFT JOIN operators o ON a.operator_id = o.id
            WHERE 1=1
        ";
        $params = [];
        
        if ($operator_id) {
            $query .= " AND a.operator_id = ?";
            $params[] = $operator_id;
        }
        
        if ($date) {
            $query .= " AND a.date = ?";
            $params[] = $date;
        }
        
        if ($month && $year) {
            $query .= " AND YEAR(a.date) = ? AND MONTH(a.date) = ?";
            $params[] = $year;
            $params[] = $month;
        } elseif ($year) {
            $query .= " AND YEAR(a.date) = ?";
            $params[] = $year;
        }
        
        if ($status) {
            $query .= " AND a.status = ?";
            $params[] = $status;
        }
        
        $query .= " ORDER BY a.date DESC, a.check_in DESC";
        
        $stmt = $conn->prepare($query);
        $stmt->execute($params);
        $attendance = $stmt->fetchAll();
        
        // Convert numeric strings
        foreach ($attendance as &$record) {
            $record['id'] = (int)$record['id'];
            $record['operator_id'] = (int)$record['operator_id'];
        }
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Attendance records retrieved',
            'data' => $attendance
        ]);
        
    } catch (PDOException $e) {
        logMessage('GET_ATTENDANCE_ERROR', ['error' => $e->getMessage()], 'ERROR');
        http_response_code(500);
        sendError('Error retrieving attendance', 500);
    }
}

/**
 * POST - Check in
 */
function handleCheckIn() {
    $data = getRequestData();
    
    // Validate required fields
    if (empty($data['operator_id'])) {
        sendError('Operator ID is required', 400);
    }
    
    try {
        $conn = getConnection();
        $today = date('Y-m-d');
        
        // Check if already checked in today
        $checkStmt = $conn->prepare(
            "SELECT id, check_in, check_out FROM operator_attendance 
             WHERE operator_id = ? AND date = ?"
        );
        $checkStmt->execute([$data['operator_id'], $today]);
        $existing = $checkStmt->fetch();
        
        if ($existing) {
            if ($existing['check_in']) {
                sendError('Already checked in today', 409);
            }
        }
        
        $checkInTime = date('H:i:s');
        $startHour = 8; // Standard start time
        $status = 'present';
        
        // Determine if late (after 8:15 AM)
        $checkInHour = (int)date('H');
        $checkInMinute = (int)date('i');
        if ($checkInHour > $startHour || ($checkInHour === $startHour && $checkInMinute > 15)) {
            $status = 'late';
        }
        
        if ($existing) {
            // Update existing record
            $updateStmt = $conn->prepare(
                "UPDATE operator_attendance 
                 SET check_in = ?, status = ?, notes = ?, updated_at = NOW() 
                 WHERE id = ?"
            );
            $updateStmt->execute([
                $checkInTime,
                $status,
                $data['notes'] ?? null,
                $existing['id']
            ]);
            $attendanceId = $existing['id'];
        } else {
            // Create new record
            $insertStmt = $conn->prepare(
                "INSERT INTO operator_attendance 
                (operator_id, date, check_in, status, notes, created_at)
                VALUES (?, ?, ?, ?, ?, NOW())"
            );
            $insertStmt->execute([
                $data['operator_id'],
                $today,
                $checkInTime,
                $status,
                $data['notes'] ?? null
            ]);
            $attendanceId = $conn->lastInsertId();
        }
        
        logMessage('ATTENDANCE_CHECKIN', [
            'id' => $attendanceId,
            'operator_id' => $data['operator_id'],
            'time' => $checkInTime,
            'status' => $status
        ], 'INFO');
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Check-in successful',
            'data' => [
                'id' => (int)$attendanceId,
                'operator_id' => (int)$data['operator_id'],
                'date' => $today,
                'check_in' => $checkInTime,
                'status' => $status
            ]
        ]);
        
    } catch (PDOException $e) {
        logMessage('CHECKIN_ERROR', ['error' => $e->getMessage()], 'ERROR');
        http_response_code(500);
        sendError('Error processing check-in', 500);
    }
}

/**
 * POST - Check out
 */
function handleCheckOut() {
    $data = getRequestData();
    
    // Validate required fields
    if (empty($data['operator_id'])) {
        sendError('Operator ID is required', 400);
    }
    
    try {
        $conn = getConnection();
        $today = date('Y-m-d');
        
        // Find today's attendance record
        $checkStmt = $conn->prepare(
            "SELECT id, check_in, check_out FROM operator_attendance 
             WHERE operator_id = ? AND date = ?"
        );
        $checkStmt->execute([$data['operator_id'], $today]);
        $attendance = $checkStmt->fetch();
        
        if (!$attendance) {
            sendError('No check-in record found for today', 404);
        }
        
        if (!$attendance['check_in']) {
            sendError('Must check in first', 400);
        }
        
        if ($attendance['check_out']) {
            sendError('Already checked out today', 409);
        }
        
        $checkOutTime = date('H:i:s');
        
        // Update record with check-out time
        $updateStmt = $conn->prepare(
            "UPDATE operator_attendance 
             SET check_out = ?, updated_at = NOW() 
             WHERE id = ?"
        );
        $updateStmt->execute([
            $checkOutTime,
            $attendance['id']
        ]);
        
        logMessage('ATTENDANCE_CHECKOUT', [
            'id' => $attendance['id'],
            'operator_id' => $data['operator_id'],
            'time' => $checkOutTime
        ], 'INFO');
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Check-out successful',
            'data' => [
                'id' => (int)$attendance['id'],
                'operator_id' => (int)$data['operator_id'],
                'date' => $today,
                'check_in' => $attendance['check_in'],
                'check_out' => $checkOutTime
            ]
        ]);
        
    } catch (PDOException $e) {
        logMessage('CHECKOUT_ERROR', ['error' => $e->getMessage()], 'ERROR');
        http_response_code(500);
        sendError('Error processing check-out', 500);
    }
}

/**
 * POST - Create attendance record manually (admin only)
 */
function handleCreateAttendance() {
    // Only admin can manually create attendance
    $user = checkAuth();
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        sendError('Only admin can manually create attendance records', 403);
    }
    
    $data = getRequestData();
    
    // Validate required fields
    $validation = validateRequired($data, ['operator_id', 'date', 'status']);
    if ($validation !== true) {
        sendError($validation, 400);
    }
    
    try {
        $conn = getConnection();
        
        // Check if record already exists
        $checkStmt = $conn->prepare(
            "SELECT id FROM operator_attendance WHERE operator_id = ? AND date = ?"
        );
        $checkStmt->execute([$data['operator_id'], $data['date']]);
        if ($checkStmt->fetch()) {
            sendError('Attendance record already exists for this date', 409);
        }
        
        // Create record
        $insertStmt = $conn->prepare(
            "INSERT INTO operator_attendance 
            (operator_id, date, check_in, check_out, status, notes, created_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())"
        );
        
        $insertStmt->execute([
            $data['operator_id'],
            $data['date'],
            $data['check_in'] ?? null,
            $data['check_out'] ?? null,
            $data['status'],
            $data['notes'] ?? null
        ]);
        
        $attendanceId = $conn->lastInsertId();
        
        logMessage('ATTENDANCE_CREATED', [
            'id' => $attendanceId,
            'operator_id' => $data['operator_id'],
            'date' => $data['date'],
            'admin' => $_SESSION['username'] ?? 'unknown'
        ], 'INFO');
        
        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Attendance record created',
            'data' => [
                'id' => (int)$attendanceId,
                'operator_id' => (int)$data['operator_id'],
                'date' => $data['date'],
                'status' => $data['status']
            ]
        ]);
        
    } catch (PDOException $e) {
        logMessage('CREATE_ATTENDANCE_ERROR', ['error' => $e->getMessage()], 'ERROR');
        http_response_code(500);
        sendError('Error creating attendance record', 500);
    }
}

/**
 * PUT - Update attendance record (admin only)
 */
function handleUpdateAttendance() {
    // Only admin can update attendance
    $user = checkAuth();
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        sendError('Only admin can update attendance records', 403);
    }
    
    $data = getRequestData();
    
    if (empty($data['id'])) {
        sendError('Attendance ID is required', 400);
    }
    
    try {
        $conn = getConnection();
        
        // Build dynamic update
        $updateFields = [];
        $params = [];
        
        $allowedFields = ['check_in', 'check_out', 'status', 'notes'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updateFields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        if (empty($updateFields)) {
            sendError('No fields to update', 400);
        }
        
        $updateFields[] = "updated_at = NOW()";
        $params[] = $data['id'];
        
        $updateStmt = $conn->prepare(
            "UPDATE operator_attendance SET " . implode(', ', $updateFields) . " WHERE id = ?"
        );
        $updateStmt->execute($params);
        
        if ($updateStmt->rowCount() === 0) {
            sendError('Attendance record not found', 404);
        }
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Attendance updated successfully'
        ]);
        
    } catch (PDOException $e) {
        logMessage('UPDATE_ATTENDANCE_ERROR', ['error' => $e->getMessage()], 'ERROR');
        http_response_code(500);
        sendError('Error updating attendance', 500);
    }
}

/**
 * DELETE - Delete attendance record (admin only)
 */
function handleDeleteAttendance() {
    // Only admin can delete attendance
    $user = checkAuth();
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        sendError('Only admin can delete attendance records', 403);
    }
    
    $id = $_GET['id'] ?? null;
    
    if (!$id) {
        sendError('Attendance ID is required', 400);
    }
    
    try {
        $conn = getConnection();
        
        $deleteStmt = $conn->prepare("DELETE FROM operator_attendance WHERE id = ?");
        $deleteStmt->execute([$id]);
        
        if ($deleteStmt->rowCount() === 0) {
            sendError('Attendance record not found', 404);
        }
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Attendance record deleted'
        ]);
        
    } catch (PDOException $e) {
        logMessage('DELETE_ATTENDANCE_ERROR', ['error' => $e->getMessage()], 'ERROR');
        http_response_code(500);
        sendError('Error deleting attendance', 500);
    }
}
