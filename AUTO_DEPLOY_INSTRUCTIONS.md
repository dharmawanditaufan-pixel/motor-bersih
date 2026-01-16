# 🚀 AUTO-DEPLOY INSTRUCTIONS

**Status: Git Repository Ready ✅**  
**Commit: b50d4f1 - Production-ready Motor Bersih POS**

---

## 📋 OPSI DEPLOYMENT

### Option 1: GitHub Push → Auto-Deploy (RECOMMENDED)

```bash
# 1. Update remote URL dengan repository Anda
git remote set-url origin https://github.com/YOUR-USERNAME/motor-bersih.git

# 2. Push ke GitHub
git push -u origin main

# 3. Auto-deploy akan berjalan otomatis! 🎉
```

**Setelah push:**
- ✅ GitHub Actions akan trigger otomatis
- ✅ Vercel akan deploy frontend
- ✅ Railway akan deploy backend + database
- ⏱️ Deployment time: ~3-5 menit

---

### Option 2: Manual Deploy via CLI

#### Deploy ke Vercel:
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy production
vercel --prod
```

#### Deploy ke Railway:
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link project (first time)
railway init

# Deploy
railway up

# Import database
railway run mysql -h ${MYSQLHOST} -u ${MYSQLUSER} -p${MYSQLPASSWORD} ${MYSQLDATABASE} < api/schema.sql
```

---

## 🔧 SETUP GITHUB SECRETS

Untuk auto-deploy via GitHub Actions, tambahkan secrets:

### Vercel Secrets:
1. Buka: `https://github.com/YOUR-USERNAME/motor-bersih/settings/secrets/actions`
2. Add secrets:
   - `VERCEL_TOKEN` - Get dari: `vercel token create`
   - `VERCEL_ORG_ID` - Get dari: `.vercel/project.json`
   - `VERCEL_PROJECT_ID` - Get dari: `.vercel/project.json`

### Railway Secrets:
1. Add secret:
   - `RAILWAY_TOKEN` - Get dari: `railway login` → `railway token`

### Database Environment:
Add di Vercel/Railway dashboard:
```
DB_HOST=<railway-mysql-host>
DB_USER=<railway-mysql-user>
DB_PASS=<railway-mysql-password>
DB_NAME=<railway-mysql-database>
JWT_SECRET=<your-secret-key-change-this>
```

---

## 📊 MONITORING DEPLOYMENT

### Check GitHub Actions:
```
https://github.com/YOUR-USERNAME/motor-bersih/actions
```

### Check Vercel:
```
https://vercel.com/dashboard
```

### Check Railway:
```
https://railway.app/dashboard
```

---

## ✅ VERIFICATION

Setelah deploy, test endpoints:

### Production URLs:
```bash
# Vercel (Frontend)
https://motor-bersih.vercel.app

# Railway (API)
https://motor-bersih-api.up.railway.app/api/status
```

### Test API:
```bash
# Health check
curl https://your-api-url.railway.app/api/status

# Login test
curl -X POST https://your-api-url.railway.app/api/auth \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123","role":"admin"}'
```

### Update Postman:
1. Open Postman
2. Import collection: `postman/Motor-Bersih-API.postman_collection.json`
3. Update `base_url` environment variable ke production URL
4. Run tests

---

## 🔄 AUTO-DEPLOY FLOW

```
1. git add .
2. git commit -m "Your changes"
3. git push origin main
   ↓
4. GitHub Actions triggered
   ↓
5. Run tests (if configured)
   ↓
6. Deploy to Vercel (Frontend)
   ↓
7. Deploy to Railway (Backend)
   ↓
8. ✅ LIVE IN PRODUCTION
```

---

## 🚨 QUICK DEPLOY NOW

```powershell
# Windows PowerShell - One-command deploy:

cd "d:\PROJECT\motor-bersih"

# Update remote (ganti dengan repo Anda)
git remote set-url origin https://github.com/YOUR-USERNAME/motor-bersih.git

# Push dan auto-deploy
git push -u origin main

Write-Host "`n🚀 AUTO-DEPLOY STARTED!" -ForegroundColor Green
Write-Host "Check GitHub Actions for deployment status" -ForegroundColor Cyan
Write-Host "https://github.com/YOUR-USERNAME/motor-bersih/actions" -ForegroundColor Yellow
```

---

## 📝 NEXT STEPS

1. **Create GitHub Repository:**
   - Buka: https://github.com/new
   - Repository name: `motor-bersih`
   - Public/Private: Your choice
   - Don't initialize with README (sudah ada)
   - Create repository

2. **Push Code:**
   ```bash
   git remote set-url origin https://github.com/YOUR-USERNAME/motor-bersih.git
   git push -u origin main
   ```

3. **Setup Secrets:**
   - Add `VERCEL_TOKEN`
   - Add `RAILWAY_TOKEN`

4. **Watch Deployment:**
   - GitHub Actions tab akan show progress
   - Selesai dalam ~3-5 menit

5. **Test Production:**
   - Buka production URL
   - Test login
   - Test all features

---

## 🎉 SELESAI!

Setelah push ke GitHub:
- ✅ Code tersimpan aman di GitHub
- ✅ Auto-deploy ke Vercel (Frontend)
- ✅ Auto-deploy ke Railway (Backend)
- ✅ Database auto-migrate
- ✅ HTTPS enabled
- ✅ CDN enabled
- ✅ Monitoring enabled

**Aplikasi langsung LIVE di production!** 🚀

---

**Files ready for auto-deploy:**
- [x] vercel.json
- [x] railway.toml
- [x] Dockerfile
- [x] .github/workflows/deploy-vercel.yml
- [x] .github/workflows/deploy-railway.yml
- [x] server.js (Node.js API)
- [x] package.json (dependencies)
- [x] api/schema.sql (database)
- [x] All frontend files

**Total Files: 90+**  
**Commit: b50d4f1**  
**Branch: main**  
**Status: READY TO PUSH** ✅
