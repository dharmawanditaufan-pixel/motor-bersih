# Test Transaction Submission Fix
Write-Host "`n=== Testing Transaction Submission Fix ===`n" -ForegroundColor Cyan

# Step 1: Login
Write-Host "1. Logging in..." -ForegroundColor Yellow
$loginBody = @{
    username = "admin"
    password = "admin123"
    role = "admin"
} | ConvertTo-Json

$loginHeaders = @{"Content-Type" = "application/json"}

try {
    $loginResponse = Invoke-WebRequest -Uri "http://localhost/motor-bersih/api/auth.php" -Method POST -Body $loginBody -Headers $loginHeaders -ErrorAction Stop
    $loginData = $loginResponse.Content | ConvertFrom-Json
    
    if ($loginData.success -and $loginData.token) {
        Write-Host "   OK Login successful" -ForegroundColor Green
        $token = $loginData.token
    } else {
        Write-Host "   X Login failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   X Login error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Test Transaction
Write-Host "`n2. Testing transaction..." -ForegroundColor Yellow
$transactionBody = @{
    customer_id = 1
    operator_id = 1
    wash_type = "standard"
    amount = 50000
    payment_method = "cash"
    notes = "Test from PowerShell"
} | ConvertTo-Json

$transactionHeaders = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
}

try {
    $transactionResponse = Invoke-WebRequest -Uri "http://localhost/motor-bersih/api/transactions.php" -Method POST -Body $transactionBody -Headers $transactionHeaders -ErrorAction Stop
    $transactionData = $transactionResponse.Content | ConvertFrom-Json
    
    if ($transactionData.success) {
        Write-Host "   OK Transaction submitted!" -ForegroundColor Green
        Write-Host "   Transaction ID: $($transactionData.transaction.id)" -ForegroundColor Gray
    } else {
        Write-Host "   X Transaction failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   X Transaction error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response.StatusCode.value__ -eq 401) {
        Write-Host "   Status: 401 Unauthorized" -ForegroundColor Red
    }
    exit 1
}

Write-Host "`n=== Tests Passed ===`n" -ForegroundColor Green
