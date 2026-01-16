#!/usr/bin/env pwsh
# Fix Motor Bersih POS - Resolve 404 JavaScript Errors

Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host "  MOTOR BERSIH POS - FIX 404 ERRORS" -ForegroundColor Yellow
Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host ""

$projectPath = "D:\PROJECT\motor-bersih"
$htdocsPath = "C:\xampp\htdocs\motor-bersih"

Write-Host "[1/5] Checking XAMPP Status..." -ForegroundColor Cyan
$apacheRunning = Get-Process -Name "httpd" -ErrorAction SilentlyContinue
if ($apacheRunning) {
    Write-Host "  OK Apache is running" -ForegroundColor Green
} else {
    Write-Host "  ERROR Apache is NOT running!" -ForegroundColor Red
    Write-Host "  Please start XAMPP first!" -ForegroundColor Yellow
}

Write-Host "`n[2/5] Checking Files..." -ForegroundColor Cyan
$requiredFiles = @("index.html", "js\api-client.js", "js\utils.js", "js\dashboard.js", "js\auth.js")
foreach ($file in $requiredFiles) {
    if (Test-Path (Join-Path $projectPath $file)) {
        Write-Host "  OK $file" -ForegroundColor Green
    } else {
        Write-Host "  ERROR Missing: $file" -ForegroundColor Red
    }
}

Write-Host "`n[3/5] Checking htdocs Location..." -ForegroundColor Cyan
if (Test-Path $htdocsPath) {
    Write-Host "  OK Project exists in htdocs" -ForegroundColor Green
} else {
    Write-Host "  WARNING Project not in htdocs" -ForegroundColor Yellow
    Write-Host "  Copying files now..." -ForegroundColor Cyan
    
    try {
        Copy-Item "$projectPath\*" -Destination $htdocsPath -Recurse -Force
        Write-Host "  OK Files copied successfully" -ForegroundColor Green
    } catch {
        Write-Host "  ERROR Failed to copy: $_" -ForegroundColor Red
    }
}

Write-Host "`n[4/5] Testing API..." -ForegroundColor Cyan
try {
    $apiResponse = Invoke-WebRequest -Uri "http://localhost/motor-bersih/api/status.php" -TimeoutSec 5
    if ($apiResponse.StatusCode -eq 200) {
        Write-Host "  OK API is accessible (HTTP $($apiResponse.StatusCode))" -ForegroundColor Green
    }
} catch {
    Write-Host "  WARNING API test failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`n[5/5] Testing JavaScript Files..." -ForegroundColor Cyan
$jsFiles = @("js/api-client.js", "js/utils.js", "js/dashboard.js", "js/auth.js")
foreach ($file in $jsFiles) {
    try {
        $url = "http://localhost/motor-bersih/$file"
        $jsTest = Invoke-WebRequest -Uri $url -Method Head -TimeoutSec 5
        if ($jsTest.StatusCode -eq 200) {
            Write-Host "  OK $file (HTTP 200)" -ForegroundColor Green
        }
    } catch {
        Write-Host "  ERROR $file not accessible" -ForegroundColor Red
    }
}

Write-Host "`n=======================================================================" -ForegroundColor Cyan
Write-Host "  OPENING APPLICATION..." -ForegroundColor Yellow
Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "URL: http://localhost/motor-bersih/" -ForegroundColor Cyan
Write-Host ""

Start-Process "http://localhost/motor-bersih/"

Write-Host "If you still see 404 errors, make sure to:" -ForegroundColor White
Write-Host "1. Access via http://localhost/motor-bersih/ (NOT file:///)" -ForegroundColor White
Write-Host "2. Clear browser cache (Ctrl+Shift+Delete)" -ForegroundColor White
Write-Host "3. Restart Apache from XAMPP Control Panel" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to exit"
