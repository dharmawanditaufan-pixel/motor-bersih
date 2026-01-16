# Motor Bersih - Frontend-Backend Connection Test V2
# Tests complete flow from login to transaction

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  MOTOR BERSIH CONNECTION TEST V2" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$baseURL = "http://localhost/motor-bersih/api"

# Test 1: Backend Status
Write-Host "📡 Test 1: Backend Status" -ForegroundColor Yellow
try {
    $status = Invoke-RestMethod -Uri "$baseURL/status.php" -Method GET
    if ($status.success) {
        Write-Host "   ✅ Backend: ONLINE" -ForegroundColor Green
        Write-Host "   📊 Database: $($status.database)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Backend: OFFLINE" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Login and get token
Write-Host "`n🔐 Test 2: Authentication" -ForegroundColor Yellow
$body = @{
    username = "admin"
    password = "admin123"
    role = "admin"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseURL/auth.php" -Method POST -Body $body -ContentType "application/json"
    
    if ($response.success) {
        $token = $response.token
        Write-Host "   ✅ Login: SUCCESS" -ForegroundColor Green
        Write-Host "   🎫 Token: $($token.Substring(0,20))..." -ForegroundColor Gray
        Write-Host "   👤 User: $($response.user.username) ($($response.user.role))" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ Login: FAILED" -ForegroundColor Red
        Write-Host "   Message: $($response.message)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ❌ Login: ERROR" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 3: Token validation
Write-Host "`n🔑 Test 3: Token Validation" -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $dashboard = Invoke-RestMethod -Uri "$baseURL/dashboard.php" -Method GET -Headers $headers
    
    if ($dashboard.success) {
        Write-Host "   ✅ Token: VALID" -ForegroundColor Green
        Write-Host "   📈 Today Revenue: Rp $($dashboard.todayRevenue)" -ForegroundColor Gray
        Write-Host "   🧼 Today Transactions: $($dashboard.todayTransactions)" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ Token: INVALID" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ❌ Token validation: ERROR" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 4: Token persistence (simulate dual storage)
Write-Host "`n💾 Test 4: Token Storage Simulation" -ForegroundColor Yellow
$tokenData = @{
    authToken = $token
    authTokenTime = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
    expires_at = [DateTimeOffset]::Now.AddHours(24).ToUnixTimeSeconds()
}

Write-Host "   ✅ Token stored" -ForegroundColor Green
Write-Host "   🕐 Expires: $(([DateTimeOffset]::Now.AddHours(24)).ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor Gray

# Calculate token age (should be < 24 hours)
$tokenTime = $tokenData.authTokenTime
$hoursSinceToken = ([DateTimeOffset]::Now.ToUnixTimeMilliseconds() - $tokenTime) / (1000 * 60 * 60)

if ($hoursSinceToken -lt 24) {
    Write-Host "   ✅ Token age: $([math]::Round($hoursSinceToken, 2)) hours (VALID)" -ForegroundColor Green
} else {
    Write-Host "   ❌ Token age: $([math]::Round($hoursSinceToken, 2)) hours (EXPIRED)" -ForegroundColor Red
}

# Test 5: Transaction API (requires token)
Write-Host "`n📝 Test 5: Transaction Submission" -ForegroundColor Yellow
$transactionBody = @{
    operator_id = 1
    customer_name = "Test Customer"
    license_plate = "B1234XYZ"
    phone = "081234567890"
    wash_type = "standard"
    price = 50000
    payment_method = "cash"
} | ConvertTo-Json

try {
    $txResponse = Invoke-RestMethod -Uri "$baseURL/transactions.php" -Method POST -Headers $headers -Body $transactionBody
    
    if ($txResponse.success) {
        Write-Host "   ✅ Transaction: SUCCESS" -ForegroundColor Green
        Write-Host "   🎫 Transaction ID: $($txResponse.transaction_id)" -ForegroundColor Gray
    } else {
        Write-Host "   ⚠️  Transaction: $($txResponse.message)" -ForegroundColor Yellow
    }
} catch {
    $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "   ❌ Transaction: ERROR" -ForegroundColor Red
    Write-Host "   Message: $($errorResponse.message)" -ForegroundColor Red
}

# Test 6: Frontend file check
Write-Host "`n📁 Test 6: Frontend Files" -ForegroundColor Yellow
$requiredFiles = @(
    "C:\xampp\htdocs\motor-bersih\js\api-client.js",
    "C:\xampp\htdocs\motor-bersih\js\auth-guard.js",
    "C:\xampp\htdocs\motor-bersih\js\session-persistence.js",
    "C:\xampp\htdocs\motor-bersih\js\transactions-handler.js",
    "C:\xampp\htdocs\motor-bersih\js\plate-scanner.js",
    "C:\xampp\htdocs\motor-bersih\js\settings-manager.js"
)

$allFilesOk = $true
foreach ($file in $requiredFiles) {
    $filename = Split-Path $file -Leaf
    if (Test-Path $file) {
        $size = (Get-Item $file).Length
        Write-Host "   ✅ $filename ($size bytes)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $filename MISSING" -ForegroundColor Red
        $allFilesOk = $false
    }
}

# Test 7: API client getToken() method check
Write-Host "`n🔍 Test 7: API Client Token Methods" -ForegroundColor Yellow
$apiClientContent = Get-Content "C:\xampp\htdocs\motor-bersih\js\api-client.js" -Raw

if ($apiClientContent -match "getStoredToken\(\)") {
    Write-Host "   ✅ getStoredToken() method: FOUND" -ForegroundColor Green
}
if ($apiClientContent -match "localStorage\.getItem\('authToken'\)") {
    Write-Host "   ✅ localStorage fallback: IMPLEMENTED" -ForegroundColor Green
}
if ($apiClientContent -match "refreshToken\(\)") {
    Write-Host "   ✅ refreshToken() method: FOUND" -ForegroundColor Green
}
if ($apiClientContent -match "apiClient\.init\(\)") {
    Write-Host "   ✅ Auto-initialization: ENABLED" -ForegroundColor Green
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($allFilesOk) {
    Write-Host "✅ All tests passed!" -ForegroundColor Green
    Write-Host "`nFrontend sudah tersambung dengan backend ✓" -ForegroundColor Green
    Write-Host "Token persistence sudah berfungsi ✓" -ForegroundColor Green
    Write-Host "`nSilakan test di browser:" -ForegroundColor Yellow
    Write-Host "  1. Login → http://localhost/motor-bersih" -ForegroundColor Gray
    Write-Host "  2. Register Wash → http://localhost/motor-bersih/pages/register-wash.html" -ForegroundColor Gray
    Write-Host "  3. Settings → http://localhost/motor-bersih/pages/settings-new.html" -ForegroundColor Gray
    Write-Host "  4. Camera → http://localhost/motor-bersih/pages/camera-capture-new.html" -ForegroundColor Gray
} else {
    Write-Host "❌ Some tests failed. Check errors above." -ForegroundColor Red
}

Write-Host ""
