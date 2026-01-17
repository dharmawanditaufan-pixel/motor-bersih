#!/usr/bin/env pwsh
# Script untuk menganalisa duplikasi script declarations

Write-Host "`n=== Analisa Duplikasi Script Declarations ===`n" -ForegroundColor Cyan

$scriptFiles = @{
    "api-client.js" = @()
    "auth.js" = @()
    "utils.js" = @()
    "dashboard.js" = @()
    "transactions-handler.js" = @()
    "camera.js" = @()
}

$htmlFiles = Get-ChildItem -Path "D:\PROJECT\motor-bersih" -Include *.html -Recurse

Write-Host "Scanning HTML files untuk script declarations..." -ForegroundColor Yellow

foreach ($file in $htmlFiles) {
    $content = Get-Content $file.FullName -Raw
    
    foreach ($script in $scriptFiles.Keys) {
        if ($content -match $script) {
            $scriptFiles[$script] += $file.Name
        }
    }
}

Write-Host "`nHasil Analisa:" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Gray

foreach ($script in $scriptFiles.Keys) {
    $count = $scriptFiles[$script].Count
    if ($count -gt 0) {
        Write-Host "`n$script digunakan di $count file:" -ForegroundColor Cyan
        $scriptFiles[$script] | ForEach-Object { Write-Host "  - $_" -ForegroundColor Gray }
    }
}

Write-Host "`n`nMencari duplikasi dalam satu file..." -ForegroundColor Yellow

foreach ($file in $htmlFiles) {
    $content = Get-Content $file.FullName -Raw
    $duplicates = @()
    
    foreach ($script in $scriptFiles.Keys) {
        $patternMatches = [regex]::Matches($content, $script)
        if ($patternMatches.Count -gt 1) {
            $duplicates += "$script ($($patternMatches.Count)x)"
        }
    }
    
    if ($duplicates.Count -gt 0) {
        Write-Host "`n⚠ DUPLIKASI di $($file.Name):" -ForegroundColor Red
        $duplicates | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
    }
}

Write-Host "`n`n=== Selesai ===`n" -ForegroundColor Green
