# Motor Bersih - Auto Deploy Script
# Automatically deploy to GitHub, Vercel, and Railway

param(
    [string]$repoUrl = "",
    [switch]$SkipGitHub,
    [switch]$VercelOnly,
    [switch]$RailwayOnly
)

Write-Host "`n" -NoNewline
Write-Host "================================" -ForegroundColor Cyan
Write-Host "  MOTOR BERSIH AUTO-DEPLOY" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Check if in correct directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Not in motor-bersih directory" -ForegroundColor Red
    Write-Host "Please run from: d:\PROJECT\motor-bersih" -ForegroundColor Yellow
    exit 1
}

# Check Git status
Write-Host "📊 Checking Git status..." -ForegroundColor Yellow
$gitStatus = git status --short
if ($gitStatus) {
    Write-Host "✅ Changes detected" -ForegroundColor Green
    git status --short
} else {
    Write-Host "✅ No uncommitted changes" -ForegroundColor Green
}

# Step 1: GitHub Push (unless skipped)
if (-not $SkipGitHub) {
    Write-Host "`n📤 Step 1: Push to GitHub" -ForegroundColor Yellow
    
    if ($repoUrl) {
        Write-Host "Setting remote URL: $repoUrl" -ForegroundColor Cyan
        git remote set-url origin $repoUrl
    }
    
    $remote = git remote get-url origin 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Remote: $remote" -ForegroundColor Gray
        
        $confirm = Read-Host "Push to GitHub? (y/n)"
        if ($confirm -eq 'y') {
            Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
            git push -u origin main
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Pushed to GitHub successfully!" -ForegroundColor Green
                Write-Host "`n🔄 GitHub Actions will auto-deploy to Vercel & Railway" -ForegroundColor Cyan
                Write-Host "Check status at: $($remote -replace '\.git$', '')/actions" -ForegroundColor Yellow
            } else {
                Write-Host "❌ Push failed. Check error above." -ForegroundColor Red
                exit 1
            }
        } else {
            Write-Host "⏭️  Skipping GitHub push" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️  No remote configured" -ForegroundColor Yellow
        Write-Host "Run with: .\auto-deploy.ps1 -repoUrl 'https://github.com/YOUR-USERNAME/motor-bersih.git'" -ForegroundColor Cyan
    }
}

# Step 2: Vercel Deploy (if not Railway-only)
if (-not $RailwayOnly) {
    Write-Host "`n🌐 Step 2: Deploy to Vercel" -ForegroundColor Yellow
    
    # Check if Vercel CLI installed
    $vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
    
    if ($vercelInstalled) {
        $confirm = Read-Host "Deploy to Vercel now? (y/n)"
        if ($confirm -eq 'y') {
            Write-Host "Deploying to Vercel..." -ForegroundColor Cyan
            vercel --prod
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Deployed to Vercel successfully!" -ForegroundColor Green
            } else {
                Write-Host "⚠️  Vercel deployment had issues" -ForegroundColor Yellow
            }
        } else {
            Write-Host "⏭️  Skipping Vercel deploy" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️  Vercel CLI not installed" -ForegroundColor Yellow
        Write-Host "Install with: npm install -g vercel" -ForegroundColor Cyan
        Write-Host "Or wait for GitHub Actions auto-deploy" -ForegroundColor Gray
    }
}

# Step 3: Railway Deploy (if not Vercel-only)
if (-not $VercelOnly) {
    Write-Host "`n🚂 Step 3: Deploy to Railway" -ForegroundColor Yellow
    
    # Check if Railway CLI installed
    $railwayInstalled = Get-Command railway -ErrorAction SilentlyContinue
    
    if ($railwayInstalled) {
        $confirm = Read-Host "Deploy to Railway now? (y/n)"
        if ($confirm -eq 'y') {
            Write-Host "Deploying to Railway..." -ForegroundColor Cyan
            railway up
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Deployed to Railway successfully!" -ForegroundColor Green
                
                # Ask to import database
                $importDb = Read-Host "Import database schema? (y/n)"
                if ($importDb -eq 'y') {
                    Write-Host "Importing database..." -ForegroundColor Cyan
                    railway run mysql < api/schema.sql
                    
                    if ($LASTEXITCODE -eq 0) {
                        Write-Host "✅ Database imported successfully!" -ForegroundColor Green
                    }
                }
            } else {
                Write-Host "⚠️  Railway deployment had issues" -ForegroundColor Yellow
            }
        } else {
            Write-Host "⏭️  Skipping Railway deploy" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️  Railway CLI not installed" -ForegroundColor Yellow
        Write-Host "Install with: npm install -g @railway/cli" -ForegroundColor Cyan
        Write-Host "Or wait for GitHub Actions auto-deploy" -ForegroundColor Gray
    }
}

# Summary
Write-Host "`n" -NoNewline
Write-Host "================================" -ForegroundColor Cyan
Write-Host "  DEPLOYMENT SUMMARY" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

Write-Host "✅ Script completed" -ForegroundColor Green

if (-not $SkipGitHub) {
    Write-Host "`n📊 Check deployment status:" -ForegroundColor Yellow
    Write-Host "GitHub Actions: $($remote -replace '\.git$', '')/actions" -ForegroundColor Cyan
}

Write-Host "`n📚 Next steps:" -ForegroundColor Yellow
Write-Host "1. Check GitHub Actions for deployment status" -ForegroundColor Gray
Write-Host "2. Verify Vercel deployment at: https://vercel.com/dashboard" -ForegroundColor Gray
Write-Host "3. Verify Railway deployment at: https://railway.app/dashboard" -ForegroundColor Gray
Write-Host "4. Test production endpoints with Postman" -ForegroundColor Gray
Write-Host "5. Update production URLs in Postman environment" -ForegroundColor Gray

Write-Host "`n🎉 Ready for production!" -ForegroundColor Green
Write-Host ""
