#!/usr/bin/env pwsh
# Simple API Test for Motor Bersih POS

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " MOTOR BERSIH API TEST" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost/motor-bersih/api"

# Test 1: API Status
Write-Host "[1/5] API Status..." -ForegroundColor Cyan
try {
    $r = Invoke-WebRequest -Uri "$baseUrl/status.php"
    $d = $r.Content | ConvertFrom-Json
    Write-Host "  OK Status: $($d.status), DB: $($d.database)" -ForegroundColor Green
}
catch {
    Write-Host "  ERROR: $_" -ForegroundColor Red
}

# Test 2: Login
Write-Host "`n[2/5] Login Test..." -ForegroundColor Cyan
try {
    $body = @{username="admin"; password="admin123"; role="admin"} | ConvertTo-Json
    $r = Invoke-WebRequest -Uri "$baseUrl/auth.php" -Method POST -Body $body -ContentType "application/json"
    $d = $r.Content | ConvertFrom-Json
    $token = $d.token
    Write-Host "  OK Logged in as: $($d.user.username)" -ForegroundColor Green
    Write-Host "  Token: $($token.Substring(0,20))..." -ForegroundColor Gray
}
catch {
    Write-Host "  ERROR: $_" -ForegroundColor Red
    $token = $null
}

# Test 3: Dashboard
if ($token) {
    Write-Host "`n[3/5] Dashboard..." -ForegroundColor Cyan
    try {
        $h = @{Authorization="Bearer $token"}
        $r = Invoke-WebRequest -Uri "$baseUrl/dashboard.php" -Headers $h
        $d = $r.Content | ConvertFrom-Json
        Write-Host "  OK Today: $($d.stats.today_transactions) transactions" -ForegroundColor Green
    }
    catch {
        Write-Host "  ERROR: $_" -ForegroundColor Red
    }
}

# Test 4: Transactions
if ($token) {
    Write-Host "`n[4/5] Transactions..." -ForegroundColor Cyan
    try {
        $h = @{Authorization="Bearer $token"}
        $r = Invoke-WebRequest -Uri "$baseUrl/transactions.php" -Headers $h
        $d = $r.Content | ConvertFrom-Json
        Write-Host "  OK Total: $($d.transactions.Count) transactions" -ForegroundColor Green
    }
    catch {
        Write-Host "  ERROR: $_" -ForegroundColor Red
    }
}

# Test 5: Invalid Login
Write-Host "`n[5/5] Invalid Login (Should Fail)..." -ForegroundColor Cyan
try {
    $body = @{username="admin"; password="wrong"; role="admin"} | ConvertTo-Json
    $r = Invoke-WebRequest -Uri "$baseUrl/auth.php" -Method POST -Body $body -ContentType "application/json"
    Write-Host "  WARNING Security issue!" -ForegroundColor Yellow
}
catch {
    Write-Host "  OK Rejected correctly" -ForegroundColor Green
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " TEST COMPLETE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "For detailed testing, use Postman:" -ForegroundColor White
Write-Host "Import: postman\Motor-Bersih-API.postman_collection.json" -ForegroundColor Cyan
Write-Host ""

Read-Host "Press Enter"
