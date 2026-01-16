# 🚀 QUICK DEPLOY - Motor Bersih POS

**3 Langkah Deploy ke Production**

---

## STEP 1️⃣: Buat GitHub Repository

1. Buka: **https://github.com/new**
2. Repository name: `motor-bersih`
3. Description: `Motor Bersih POS System - Full Stack Application`
4. Public atau Private (pilih sesuai kebutuhan)
5. **JANGAN** centang "Initialize with README" (sudah ada)
6. Klik **"Create repository"**

---

## STEP 2️⃣: Deploy dengan Script

```powershell
# Buka PowerShell di folder motor-bersih
cd "d:\PROJECT\motor-bersih"

# Jalankan auto-deploy (ganti YOUR-USERNAME dengan username GitHub Anda)
.\auto-deploy.ps1 -repoUrl "https://github.com/YOUR-USERNAME/motor-bersih.git"
```

Script akan:
- ✅ Push code ke GitHub
- ✅ Trigger GitHub Actions
- ✅ Auto-deploy ke Vercel (Frontend)
- ✅ Auto-deploy ke Railway (Backend)

---

## STEP 3️⃣: Setup Secrets (untuk auto-deploy)

### A. Vercel Secrets

1. Install Vercel CLI (jika belum):
   ```powershell
   npm install -g vercel
   ```

2. Login dan get token:
   ```powershell
   vercel login
   vercel token create
   ```
   Copy token yang dihasilkan

3. Add secrets di GitHub:
   - Buka: `https://github.com/YOUR-USERNAME/motor-bersih/settings/secrets/actions`
   - Klik **"New repository secret"**
   - Name: `VERCEL_TOKEN`
   - Value: (paste token dari step 2)
   - Klik **"Add secret"**

### B. Railway Secrets

1. Install Railway CLI (jika belum):
   ```powershell
   npm install -g @railway/cli
   ```

2. Login dan get token:
   ```powershell
   railway login
   railway token
   ```
   Copy token yang dihasilkan

3. Add secret di GitHub:
   - Name: `RAILWAY_TOKEN`
   - Value: (paste token dari step 2)

---

## ✅ VERIFY DEPLOYMENT

### Check GitHub Actions:
```
https://github.com/YOUR-USERNAME/motor-bersih/actions
```

Tunggu sampai ✅ hijau (sekitar 3-5 menit)

### Check Vercel:
```
https://vercel.com/dashboard
```

Cari project `motor-bersih` → lihat production URL

### Check Railway:
```
https://railway.app/dashboard
```

Cari project `motor-bersih-api` → lihat deployment URL

---

## 🧪 TEST PRODUCTION

### 1. Update Postman Environment:

```json
{
  "base_url": "https://your-api-url.up.railway.app"
}
```

### 2. Run Health Check:
```bash
curl https://your-api-url.up.railway.app/api/status
```

### 3. Test Login:
```bash
curl -X POST https://your-api-url.up.railway.app/api/auth \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123","role":"admin"}'
```

### 4. Open Frontend:
```
https://motor-bersih.vercel.app
```

Login dengan:
- Username: `admin`
- Password: `admin123`

---

## 🔄 DEPLOY UPDATES (Future)

Setelah initial deploy, untuk deploy changes:

```powershell
# 1. Make changes to code
# 2. Commit changes
git add .
git commit -m "Your change description"

# 3. Push to GitHub (auto-deploy!)
git push origin main
```

GitHub Actions akan otomatis:
- ✅ Deploy ke Vercel
- ✅ Deploy ke Railway
- ✅ Run tests (jika dikonfigurasi)

---

## ⚡ ALTERNATIVE: Manual Deploy

### Deploy ke Vercel only:
```powershell
.\auto-deploy.ps1 -VercelOnly
```

### Deploy ke Railway only:
```powershell
.\auto-deploy.ps1 -RailwayOnly
```

### Skip GitHub push:
```powershell
.\auto-deploy.ps1 -SkipGitHub -VercelOnly
```

---

## 🆘 TROUBLESHOOTING

### Error: "remote: Repository not found"
**Solution:** Update remote URL dengan repository yang sudah dibuat:
```powershell
git remote set-url origin https://github.com/YOUR-USERNAME/motor-bersih.git
```

### Error: "fatal: unable to auto-detect email"
**Solution:** Set Git identity:
```powershell
git config user.name "Your Name"
git config user.email "your@email.com"
```

### GitHub Actions Failed
**Solution:** Check logs di GitHub Actions tab, mungkin secrets belum dikonfigurasi

### Vercel Deployment Failed
**Solution:** 
1. Check `VERCEL_TOKEN` secret
2. Verify `vercel.json` configuration
3. Check Vercel dashboard logs

### Railway Deployment Failed
**Solution:**
1. Check `RAILWAY_TOKEN` secret
2. Verify `railway.toml` configuration
3. Check Railway dashboard logs

---

## 📊 DEPLOYMENT CHECKLIST

- [ ] GitHub repository created
- [ ] Code pushed to GitHub
- [ ] `VERCEL_TOKEN` secret added
- [ ] `RAILWAY_TOKEN` secret added
- [ ] GitHub Actions completed successfully
- [ ] Vercel deployment successful
- [ ] Railway deployment successful
- [ ] Database schema imported
- [ ] Production URLs tested
- [ ] Postman collection tested with production URL
- [ ] Frontend accessible
- [ ] API endpoints working
- [ ] Login tested
- [ ] Transaction tested

---

## 🎉 SUCCESS!

Jika semua checklist ✅, aplikasi Anda sudah **LIVE DI PRODUCTION**!

**URLs:**
- Frontend: `https://motor-bersih.vercel.app`
- API: `https://motor-bersih-api.up.railway.app`

**Features:**
- ✅ Auto HTTPS
- ✅ CDN enabled
- ✅ Database hosted
- ✅ Monitoring enabled
- ✅ Auto-deploy on push

---

**Need help?** Check:
- [AUTO_DEPLOY_INSTRUCTIONS.md](AUTO_DEPLOY_INSTRUCTIONS.md) - Detailed guide
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Complete documentation
- [README.md](README.md) - Project overview

**Ready to deploy? Run:**
```powershell
.\auto-deploy.ps1 -repoUrl "https://github.com/YOUR-USERNAME/motor-bersih.git"
```
