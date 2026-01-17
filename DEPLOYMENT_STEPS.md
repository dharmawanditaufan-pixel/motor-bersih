# 🚀 Motor Bersih POS - Deployment Steps

## ✅ Prerequisites
- [x] Code pushed to GitHub: `dharmawanditaufan-pixel/motor-bersih`
- [x] GitHub account
- [ ] Vercel account (free)
- [ ] Railway account (free)

---

## 📱 PART 1: Deploy Frontend ke Vercel (5 menit)

### Step 1: Buka Vercel
```
🔗 https://vercel.com/new
```
- Login dengan GitHub account kamu

### Step 2: Import Repository
1. Click **"Import Git Repository"**
2. Search: `motor-bersih`
3. Click **"Import"** next to `dharmawanditaufan-pixel/motor-bersih`

### Step 3: Configure Project
```yaml
Framework Preset: Other
Root Directory: ./
Build Command: (leave empty)
Output Directory: .
Install Command: npm install (default)
```

### Step 4: Deploy
1. Click blue **"Deploy"** button
2. Wait 2-3 minutes for build
3. Copy production URL: `https://motor-bersih-xxx.vercel.app`

✅ **Frontend Deployed!**

---

## 🔧 PART 2: Deploy Backend ke Railway (10 menit)

### Step 1: Create Project
```
🔗 https://railway.app/new
```
1. Login dengan GitHub
2. Click **"Deploy from GitHub repo"**
3. Select: `motor-bersih`
4. Click **"Deploy Now"**

### Step 2: Add MySQL Database
1. In project dashboard, click **"+ New"**
2. Select **"Database"**
3. Choose **"Add MySQL"**
4. Wait ~1 minute for provisioning

### Step 3: Get Database Credentials
1. Click on **MySQL** service
2. Go to **"Variables"** tab
3. Copy these values:
   - `MYSQL_HOST`
   - `MYSQL_DATABASE`
   - `MYSQL_USER`
   - `MYSQL_PASSWORD`
   - `MYSQL_PORT`

### Step 4: Configure Backend Variables
1. Click on **motor-bersih** service
2. Go to **"Variables"** tab
3. Click **"+ New Variable"** and add:

```env
DB_HOST=<from MySQL MYSQL_HOST>
DB_NAME=<from MySQL MYSQL_DATABASE>
DB_USER=<from MySQL MYSQL_USER>
DB_PASS=<from MySQL MYSQL_PASSWORD>
DB_PORT=<from MySQL MYSQL_PORT>
JWT_SECRET=motorbersih2025secret
PORT=3000
NODE_ENV=production
```

4. Click **"Add"** for each variable

### Step 5: Generate Domain
1. Click **motor-bersih** service
2. Go to **"Settings"** tab
3. Scroll to **"Networking"**
4. Click **"Generate Domain"**
5. Copy URL: `https://motor-bersih-production-xxx.up.railway.app`

### Step 6: Import Database Schema

**Option A: Via Railway CLI**
```bash
railway link
railway run mysql -h $MYSQL_HOST -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE < api/schema.sql
```

**Option B: Via phpMyAdmin/MySQL Client**
1. Connect using MySQL credentials from Step 3
2. Import file: `api/schema.sql`

✅ **Backend Deployed!**

---

## 🔗 PART 3: Connect Frontend to Backend

### Update API URLs in Frontend

Edit file: `js/api.js` or `js/api-client.js`

```javascript
// Change from localhost to Railway URL
const API_URL = 'https://motor-bersih-production-xxx.up.railway.app/api';
```

### Commit and Push
```bash
git add js/api.js
git commit -m "Update API URL to production"
git push origin main
```

Vercel will auto-deploy in ~2 minutes.

---

## ✅ Verification

### Test Frontend
```
🔗 https://motor-bersih-xxx.vercel.app
```
- Should load homepage
- Check all pages load correctly

### Test Backend API
```
🔗 https://motor-bersih-production-xxx.up.railway.app/api/status
```

Expected response:
```json
{
  "status": "ok",
  "message": "Motor Bersih API is running",
  "timestamp": "2026-01-16T12:00:00.000Z"
}
```

### Test Login
```bash
curl -X POST https://motor-bersih-production-xxx.up.railway.app/api/auth \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123","role":"admin"}'
```

---

## 🎯 Production URLs

| Service | URL |
|---------|-----|
| Frontend (Vercel) | `https://motor-bersih-xxx.vercel.app` |
| Backend API (Railway) | `https://motor-bersih-production-xxx.up.railway.app` |
| GitHub Repository | `https://github.com/dharmawanditaufan-pixel/motor-bersih` |

---

## 🔄 Auto-Deploy

Setelah setup ini, setiap kali kamu push ke GitHub:
- ✅ Vercel akan auto-deploy frontend (2-3 menit)
- ✅ Railway akan auto-deploy backend (3-5 menit)

```bash
git add .
git commit -m "Update features"
git push origin main
# Wait 5 minutes, then check production URLs
```

---

## 🆘 Troubleshooting

### Frontend tidak load
- Check Vercel deployment logs
- Verify all files committed to GitHub
- Check browser console for errors

### Backend API error
- Check Railway logs: Click service → "Deployments" → "View Logs"
- Verify environment variables set correctly
- Test database connection

### Database connection failed
- Verify database credentials in Railway Variables
- Check if database schema imported correctly
- Test direct MySQL connection

---

## 📚 Additional Resources

- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Complete deployment reference
- [QUICK_DEPLOY.md](QUICK_DEPLOY.md) - Quick start guide
- [README.md](README.md) - Project documentation

---

## 🎉 Congratulations!

Aplikasi Motor Bersih POS kamu sudah live di production! 🚀

**Share link frontend ke client:**
```
https://motor-bersih-xxx.vercel.app
```

**Default login credentials:**
- Username: `admin`
- Password: `admin123`
- Role: `admin`

**Remember to change default passwords in production!**
