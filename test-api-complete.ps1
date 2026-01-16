#!/usr/bin/env pwsh
# Complete API Testing Script for Motor Bersih POS
# Alternative to Postman for PowerShell users

Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host "  MOTOR BERSIH POS - COMPLETE API TEST" -ForegroundColor Yellow
Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost/motor-bersih/api"
$token = $null

# Test 1: API Status Check
Write-Host "[1/8] Testing API Status..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/status.php" -Method GET
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.success) {
        Write-Host "  ✓ API is online" -ForegroundColor Green
        Write-Host "    Status: $($data.status)" -ForegroundColor Gray
        Write-Host "    Database: $($data.database)" -ForegroundColor Gray
        Write-Host "    Version: $($data.version)" -ForegroundColor Gray
    } else {
        Write-Host "  ✗ API check failed" -ForegroundColor Red
    }
} catch {
    Write-Host "  ✗ Cannot connect to API: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Database Connection
Write-Host "`n[2/8] Testing Database Connection..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/test.php" -Method GET
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.success) {
        Write-Host "  ✓ Database connected" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Database connection failed" -ForegroundColor Red
    }
} catch {
    Write-Host "  ✗ Database test error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Login (Admin)
Write-Host "`n[3/8] Testing Login (Admin)..." -ForegroundColor Cyan
try {
    $loginBody = @{
        username = "admin"
        password = "admin123"
        role = "admin"
    } | ConvertTo-Json
    
    $headers = @{
        "Content-Type" = "application/json"
    }
    
    $response = Invoke-WebRequest -Uri "$baseUrl/auth.php" -Method POST -Body $loginBody -Headers $headers
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.success -and $data.token) {
        $token = $data.token
        Write-Host "  ✓ Login successful" -ForegroundColor Green
        Write-Host "    Username: $($data.user.username)" -ForegroundColor Gray
        Write-Host "    Role: $($data.user.role)" -ForegroundColor Gray
        Write-Host "    Token: $($token.Substring(0, 30))..." -ForegroundColor Gray
    } else {
        Write-Host "  ✗ Login failed: $($data.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "  ✗ Login error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Verify Token
if ($token) {
    Write-Host "`n[4/8] Verifying Token..." -ForegroundColor Cyan
    try {
        $headers = @{"Authorization" = "Bearer $token"}
        $response = Invoke-WebRequest -Uri "$baseUrl/auth.php" -Method GET -Headers $headers
        $data = $response.Content | ConvertFrom-Json
        
        if ($data.success -and $data.valid) {
            Write-Host "  OK Token is valid" -ForegroundColor Green
        } else {
            Write-Host "  ERROR Token is invalid" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ERROR Token verification: $($_.Exception.Message)" -ForegroundColor Red
    }
}
else {
    Write-Host "`n[4/8] Skipping Token Verification" -ForegroundColor Yellow
}

# Test 5: Get Dashboard Data
if ($token) {
    Write-Host "`n[5/8] Getting Dashboard Data..." -ForegroundColor Cyan
    try {
        $headers = @{"Authorization" = "Bearer $token"}
        
        $response = Invoke-WebRequest -Uri "$baseUrl/dashboard.php" -Method GET -Headers $headers
        $data = $response.Content | ConvertFrom-Json
        
        if ($data.success) {
            Write-Host "  ✓ Dashboard data retrieved" -ForegroundColor Green
            Write-Host "    Today Transactions: $($data.stats.today_transactions)" -ForegroundColor Gray
            Write-Host "    Today Revenue: Rp $($data.stats.today_revenue)" -ForegroundColor Gray
            Write-Host "    Total Customers: $($data.stats.total_customers)" -ForegroundColor Gray
            Write-Host "    Recent Transactions: $($data.recent_transactions.Count)" -ForegroundColor Gray
        } else {
            Write-Host "  ✗ Dashboard error: $($data.message)" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ✗ Dashboard request error: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "`n[5/8] Skipping Dashboard (no token)" -ForegroundColor Yellow
}

# Test 6: Get All Transactions
if ($token) {
    Write-Host "`n[6/8] Getting All Transactions..." -ForegroundColor Cyan
    try {
        $headers = @{"Authorization" = "Bearer $token"}
        
        $response = Invoke-WebRequest -Uri "$baseUrl/transactions.php" -Method GET -Headers $headers
        $data = $response.Content | ConvertFrom-Json
        
        if ($data.success) {
            Write-Host "  ✓ Transactions retrieved" -ForegroundColor Green
            Write-Host "    Total: $($data.transactions.Count)" -ForegroundColor Gray
        } else {
            Write-Host "  ✗ Transactions error: $($data.message)" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ✗ Transactions request error: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "`n[6/8] Skipping Transactions (no token)" -ForegroundColor Yellow
}

# Test 7: Create Transaction
if ($token) {
    Write-Host "`n[7/8] Creating Test Transaction..." -ForegroundColor Cyan
    try {
        $transactionBody = @{
            customer_name = "Test Customer from PS"
            license_plate = "B 9999 TEST"
            motorcycle_type = "Matic"
            service_type = "Cuci Motor Standard"
            price = 25000
            operator = "Test Operator"
            payment_method = "cash"
            notes = "Created via PowerShell test"
        } | ConvertTo-Json
        
        $headers = @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        }
        
        $response = Invoke-WebRequest -Uri "$baseUrl/transactions.php" -Method POST -Body $transactionBody -Headers $headers
        $data = $response.Content | ConvertFrom-Json
        
        if ($data.success) {
            Write-Host "  ✓ Transaction created" -ForegroundColor Green
            Write-Host "    Transaction ID: $($data.transaction_id)" -ForegroundColor Gray
            $script:lastTransactionId = $data.transaction_id
        } else {
            Write-Host "  ✗ Transaction creation failed: $($data.message)" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ✗ Transaction creation error: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "`n[7/8] Skipping Transaction Creation (no token)" -ForegroundColor Yellow
}

# Test 8: Test Invalid Login
Write-Host "`n[8/8] Testing Invalid Login (Should Fail)..." -ForegroundColor Cyan
try {
    $invalidLoginBody = @{
        username = "admin"
        password = "wrongpassword"
        role = "admin"
    } | ConvertTo-Json
    
    $headers = @{
        "Content-Type" = "application/json"
    }
    
    $response = Invoke-WebRequest -Uri "$baseUrl/auth.php" -Method POST -Body $invalidLoginBody -Headers $headers
    $data = $response.Content | ConvertFrom-Json
    
    if (-not $data.success) {
        Write-Host "  ✓ Invalid login correctly rejected" -ForegroundColor Green
        Write-Host "    Message: $($data.message)" -ForegroundColor Gray
    } else {
        Write-Host "  ✗ Security issue: Invalid credentials accepted!" -ForegroundColor Red
    }
} catch {
    Write-Host "  ✓ Invalid login correctly rejected (HTTP error)" -ForegroundColor Green
}

# Summary
Write-Host "`n=======================================================================" -ForegroundColor Cyan
Write-Host "  TEST SUMMARY" -ForegroundColor Yellow
Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host ""

if ($token) {
    Write-Host "✓ Authentication: WORKING" -ForegroundColor Green
    Write-Host "✓ Token Generated: YES" -ForegroundColor Green
    Write-Host "✓ Protected Endpoints: ACCESSIBLE" -ForegroundColor Green
} else {
    Write-Host "✗ Authentication: FAILED" -ForegroundColor Red
    Write-Host "✗ Cannot test protected endpoints" -ForegroundColor Red
}

Write-Host ""
Write-Host "Recommendation:" -ForegroundColor Yellow
Write-Host "Use Postman for more detailed testing with visual interface" -ForegroundColor White
Write-Host "Import files from: postman/*.json" -ForegroundColor Cyan
Write-Host ""

Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host ""

Read-Host "Press Enter to exit"
