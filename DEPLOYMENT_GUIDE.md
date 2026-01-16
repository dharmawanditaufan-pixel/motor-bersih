# 🚀 Motor Bersih POS - Deployment Guide

## 📋 Prerequisites

- Node.js 18+ installed
- MySQL database
- Git repository
- Vercel account (untuk frontend)
- Railway account (untuk backend + database)

---

## 🔧 Local Development Setup

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd motor-bersih
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
```bash
cp .env.example .env
# Edit .env dengan database credentials Anda
```

### 4. Import Database
```bash
mysql -u root -p < api/schema.sql
```

### 5. Start Development Server
```bash
npm run dev
```

Server akan jalan di: `http://localhost:3000`

---

## ☁️ Vercel Deployment (Frontend + API)

### Option 1: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Production deployment
vercel --prod
```

### Option 2: Via GitHub Integration

1. Push code ke GitHub
2. Buka [vercel.com](https://vercel.com)
3. Import repository
4. Klik "Deploy"

### Environment Variables di Vercel:
```
DB_HOST=<railway-mysql-host>
DB_USER=<railway-mysql-user>
DB_PASS=<railway-mysql-password>
DB_NAME=<railway-mysql-database>
JWT_SECRET=<your-secret-key>
```

---

## 🚂 Railway Deployment (Backend + Database)

### Step 1: Create MySQL Database

1. Buka [railway.app](https://railway.app)
2. New Project → Provision MySQL
3. Copy connection details

### Step 2: Deploy API

#### Via Railway CLI:
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# Deploy
railway up
```

#### Via GitHub:
1. Push ke GitHub
2. Railway → New Project → Deploy from GitHub
3. Select repository
4. Railway akan auto-deploy

### Step 3: Set Environment Variables

Di Railway dashboard:
```
DB_HOST=${MYSQLHOST}
DB_USER=${MYSQLUSER}
DB_PASS=${MYSQLPASSWORD}
DB_NAME=${MYSQLDATABASE}
DB_PORT=${MYSQLPORT}
JWT_SECRET=<your-secret-key>
NODE_ENV=production
PORT=3000
```

### Step 4: Import Database Schema

```bash
# Via Railway CLI
railway run mysql -h ${MYSQLHOST} -u ${MYSQLUSER} -p${MYSQLPASSWORD} ${MYSQLDATABASE} < api/schema.sql
```

---

## 🔄 CI/CD dengan GitHub Actions

### Auto-deploy ke Vercel:

1. Get Vercel token:
```bash
vercel login
vercel token create
```

2. Add GitHub Secrets:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`

3. Push ke `main` branch → auto deploy

### Auto-deploy ke Railway:

1. Get Railway token:
```bash
railway login
railway token
```

2. Add GitHub Secret:
   - `RAILWAY_TOKEN`

3. Push ke `main` branch → auto deploy

---

## 🧪 Testing Deployment

### Test Local:
```bash
curl http://localhost:3000/api/status
```

### Test Vercel:
```bash
curl https://your-project.vercel.app/api/status
```

### Test Railway:
```bash
curl https://your-project.up.railway.app/api/status
```

### Test dengan Postman:

1. Import `postman/Motor-Bersih-API.postman_collection.json`
2. Import `postman/Motor-Bersih.postman_environment.json`
3. Update `base_url` ke deployment URL
4. Run collection tests

---

## 🛠️ Troubleshooting

### Error: Database connection failed
**Solution:** Check environment variables, pastikan DB credentials benar

### Error: CORS blocked
**Solution:** Update `CORS_ORIGIN` di environment variables

### Error: Module not found
**Solution:** 
```bash
rm -rf node_modules
npm install
```

### Railway deployment failed
**Solution:** Check logs:
```bash
railway logs
```

---

## 📊 Monitoring

### Railway:
- Dashboard → Metrics tab
- View CPU, Memory, Network usage
- Check deployment logs

### Vercel:
- Dashboard → Analytics
- View function invocations
- Check edge network performance

---

## 🔐 Security Checklist

- [ ] Change `JWT_SECRET` di production
- [ ] Use strong database passwords
- [ ] Enable HTTPS (auto di Vercel/Railway)
- [ ] Set proper CORS origins
- [ ] Never commit `.env` to git
- [ ] Use environment variables untuk sensitive data
- [ ] Regular database backups
- [ ] Monitor API usage

---

## 📚 Additional Resources

- [Vercel Docs](https://vercel.com/docs)
- [Railway Docs](https://docs.railway.app)
- [Express.js Docs](https://expressjs.com)
- [MySQL2 Docs](https://github.com/sidorares/node-mysql2)

---

## 🆘 Support

Jika ada masalah deployment:
1. Check logs (Railway/Vercel dashboard)
2. Verify environment variables
3. Test API endpoints dengan Postman
4. Check database connection

**Deployment berhasil? Test semua fitur di production!** ✅
