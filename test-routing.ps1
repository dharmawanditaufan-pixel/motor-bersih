#!/usr/bin/env pwsh
# Test routing for Motor Bersih POS

Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host "  MOTOR BERSIH POS - ROUTING TEST" -ForegroundColor Yellow
Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost/motor-bersih"

Write-Host "Testing Hash Routing URLs..." -ForegroundColor Cyan
Write-Host ""

$routes = @{
    "Dashboard" = "dashboard.html#dashboard"
    "Transaksi Baru" = "dashboard.html#new-transaction"
    "Scan Plat Nomor" = "dashboard.html#camera-capture"
    "Riwayat Transaksi" = "dashboard.html#transactions"
    "Data Pelanggan" = "dashboard.html#customers"
    "Operator & Komisi" = "dashboard.html#operators"
    "Laporan" = "dashboard.html#reports"
    "Pengaturan" = "dashboard.html#settings"
}

Write-Host "Choose test mode:" -ForegroundColor Yellow
Write-Host "1. Open all URLs (one by one with delay)"
Write-Host "2. Test URL accessibility (check HTTP status)"
Write-Host "3. Open specific route"
Write-Host ""
$choice = Read-Host "Enter choice (1-3)"

switch ($choice) {
    "1" {
        Write-Host "`nOpening all routes..." -ForegroundColor Green
        foreach ($route in $routes.GetEnumerator()) {
            $url = "$baseUrl/$($route.Value)"
            Write-Host "  Opening: $($route.Key)" -ForegroundColor Cyan
            Write-Host "  URL: $url" -ForegroundColor Gray
            Start-Process $url
            Start-Sleep -Seconds 3
        }
        Write-Host "`nAll routes opened!" -ForegroundColor Green
    }
    "2" {
        Write-Host "`nTesting URL accessibility..." -ForegroundColor Green
        Write-Host ""
        
        foreach ($route in $routes.GetEnumerator()) {
            $url = "$baseUrl/$($route.Value)"
            Write-Host "Testing: $($route.Key)" -ForegroundColor Cyan
            
            try {
                # Note: Hash fragments are not sent to server, so we test without hash
                $testUrl = $url -replace '#.*$', ''
                $response = Invoke-WebRequest -Uri $testUrl -Method Head -TimeoutSec 5
                
                if ($response.StatusCode -eq 200) {
                    Write-Host "  Status: " -NoNewline -ForegroundColor Gray
                    Write-Host "OK (HTTP 200)" -ForegroundColor Green
                } else {
                    Write-Host "  Status: HTTP $($response.StatusCode)" -ForegroundColor Yellow
                }
            } catch {
                Write-Host "  Status: " -NoNewline -ForegroundColor Gray
                Write-Host "FAILED - $($_.Exception.Message)" -ForegroundColor Red
            }
            Write-Host ""
        }
    }
    "3" {
        Write-Host "`nAvailable routes:" -ForegroundColor Yellow
        $index = 1
        foreach ($route in $routes.GetEnumerator()) {
            Write-Host "$index. $($route.Key)" -ForegroundColor Cyan
            $index++
        }
        Write-Host ""
        
        $routeChoice = Read-Host "Enter route number"
        $routeIndex = [int]$routeChoice - 1
        
        if ($routeIndex -ge 0 -and $routeIndex -lt $routes.Count) {
            $selectedRoute = $routes.GetEnumerator() | Select-Object -Index $routeIndex
            $url = "$baseUrl/$($selectedRoute.Value)"
            
            Write-Host "`nOpening: $($selectedRoute.Key)" -ForegroundColor Green
            Write-Host "URL: $url" -ForegroundColor Gray
            Start-Process $url
        } else {
            Write-Host "Invalid route number!" -ForegroundColor Red
        }
    }
    default {
        Write-Host "Invalid choice!" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host "  Direct Page URLs (Alternative Access Method)" -ForegroundColor Yellow
Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host ""

$directPages = @{
    "Dashboard" = "pages/dashboard.html"
    "Transaksi Baru" = "pages/register-wash.html"
    "Scan Plat Nomor" = "pages/camera-capture.html"
    "Riwayat Transaksi" = "pages/transactions.html"
    "Data Pelanggan" = "pages/customers.html"
    "Operator & Komisi" = "pages/operators.html"
    "Laporan" = "pages/reports.html"
    "Pengaturan" = "pages/settings.html"
}

Write-Host "Would you like to test direct page access? (Y/N)" -ForegroundColor Yellow
$testDirect = Read-Host

if ($testDirect -eq 'Y' -or $testDirect -eq 'y') {
    Write-Host "`nTesting direct page access..." -ForegroundColor Green
    Write-Host ""
    
    foreach ($page in $directPages.GetEnumerator()) {
        $url = "$baseUrl/$($page.Value)"
        Write-Host "Testing: $($page.Key)" -ForegroundColor Cyan
        
        try {
            $response = Invoke-WebRequest -Uri $url -Method Head -TimeoutSec 5
            
            if ($response.StatusCode -eq 200) {
                Write-Host "  Status: " -NoNewline -ForegroundColor Gray
                Write-Host "OK (HTTP 200)" -ForegroundColor Green
                Write-Host "  URL: $url" -ForegroundColor Gray
            }
        } catch {
            Write-Host "  Status: " -NoNewline -ForegroundColor Gray
            Write-Host "FAILED" -ForegroundColor Red
        }
        Write-Host ""
    }
}

Write-Host ""
Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host "  Test Complete!" -ForegroundColor Green
Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Documentation: ROUTING_GUIDE.md" -ForegroundColor Gray
Write-Host ""

Read-Host "Press Enter to exit"
