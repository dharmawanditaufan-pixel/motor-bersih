# Motor Bersih POS - Complete Deployment Guide
**Production Ready: Vercel + Railway**
*Last Updated: January 17, 2026*

---

## 🎯 Deployment Architecture

```
┌─────────────────────┐
│   USER BROWSER      │
│  (Any Device)       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  VERCEL CDN         │ ← Frontend (HTML/CSS/JS)
│  Global Edge        │   Static Files
└──────────┬──────────┘
           │ HTTPS API Calls
           ▼
┌─────────────────────┐
│  RAILWAY PHP        │ ← Backend (api/*.php)
│  App Server         │   Business Logic
└──────────┬──────────┘
           │ MySQL Protocol
           ▼
┌─────────────────────┐
│  RAILWAY MySQL      │ ← Database (motowash_db)
│  Database Server    │   Data Storage
└─────────────────────┘
```

---

## 📋 Pre-Flight Checklist

### Backend API Completeness
- ✅ api/auth.php - Authentication with session & JWT
- ✅ api/config.php - Local development configuration
- ✅ api/config-production.php - Production with env vars
- ✅ api/customers.php - Full CRUD (license_plate search, loyalty_count)
- ✅ api/operators.php - CRUD with statistics (commission_rate, status)
- ✅ api/attendance.php - Check-in/out (automatic late detection)
- ✅ api/transactions.php - CRUD with JOIN (customer+operator data)
- ✅ api/dashboard.php - Statistics aggregation
- ✅ api/schema.sql - Complete database with sample data

### Frontend-Backend Data Contract
- ✅ Motor types: `motor_kecil` (15k), `motor_sedang` (20k), `motor_besar` (20k)
- ✅ Loyalty system: 5x cuci → 1x gratis, auto-reset after free wash
- ✅ Commission: 30% calculated from original price (even for free washes)
- ✅ Transaction fields: transaction_id, license_plate, customer_name, is_loyalty_free
- ✅ API responses: Consistent `{success, message, data}` structure
- ✅ Authentication: Bearer token in Authorization header

---

## 🚀 Deployment Steps

### Step 1: Git Repository Preparation

```bash
# Navigate to project
cd D:\PROJECT\motor-bersih

# Add new API files
git add api/customers.php api/operators.php api/attendance.php
git add api/config-production.php DEPLOYMENT_GUIDE_FINAL.md

# Commit
git commit -m "feat: Complete Backend API Endpoints + Production Config

✅ Backend API Endpoints:
- customers.php: CRUD with motorcycle_type, loyalty_count, whatsapp_number
- operators.php: CRUD with commission stats and attendance data
- attendance.php: Check-in/out with auto status (present/late/absent/leave)
- transactions.php: Enhanced GET with JOIN, flexible POST for guest/member
- config-production.php: Railway-ready with environment variables

✅ Frontend-Backend Integration:
- Motor types standardized: motor_kecil/motor_sedang/motor_besar
- Loyalty calculation: (count % 5 === 0 && count >= 5) → Free
- Commission: 30% from original_price for free washes
- GET /transactions returns: license_plate, customer_name, operator_name, motorcycle_type
- POST /transactions accepts: transaction_id, license_plate, customer_name, is_loyalty_free

✅ Production Ready:
- CORS configured for Vercel frontend
- Error logging to files (not displayed)
- Environment variable support (DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT)
- Rate limiting on authentication
- Session-based auth with Bearer token

Ready for deployment to Vercel + Railway"

# Push to GitHub
git push origin main
```

---

### Step 2: Railway MySQL Database Setup

#### 2.1 Create MySQL Service

1. Login to **Railway**: https://railway.app
2. Click **"New Project"** → **"Provision MySQL"**
3. Wait for service creation (~30 seconds)

#### 2.2 Note Database Credentials

Click on MySQL service → **Variables** tab:

```
MYSQL_HOST: mysql.railway.internal  (internal) atau viaduct.proxy.rlwy.net (public)
MYSQL_PORT: 3306
MYSQL_USER: root
MYSQL_PASSWORD: [auto-generated 32-char]
MYSQL_DATABASE: railway
MYSQLHOST: [public hostname]
MYSQLPORT: [public port, e.g., 51367]
```

Save these values - you'll need them!

#### 2.3 Import Database Schema

**Option A: Railway CLI** (Recommended)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link
# Select your project from list

# Import schema
railway run mysql -u root -p railway < D:\PROJECT\motor-bersih\api\schema.sql
# Enter MYSQL_PASSWORD when prompted
```

**Option B: MySQL Workbench**

1. Open MySQL Workbench
2. New Connection:
   - Hostname: [MYSQLHOST from Railway]
   - Port: [MYSQLPORT from Railway]
   - Username: root
   - Password: [MYSQL_PASSWORD]
3. Test Connection
4. Open `api/schema.sql`
5. Execute entire script
6. Verify: `SHOW TABLES;` should list 8 tables

**Option C: Railway Web Console** (Slow but works)

1. Railway MySQL service → **"Query"** tab
2. Copy entire `api/schema.sql` content
3. Paste and click **"Run Query"**
4. Wait (~2 minutes for all inserts)

#### 2.4 Verify Database

```bash
railway run mysql -u root -p railway

# Inside MySQL prompt:
USE railway;
SHOW TABLES;
SELECT * FROM users;
SELECT * FROM customers LIMIT 5;
SELECT * FROM operators;
EXIT;
```

Expected output:
```
+-------------------------+
| Tables_in_railway       |
+-------------------------+
| audit_logs              |
| commissions             |
| customers               | ← 5 sample records
| operator_attendance     |
| operators               | ← 2 sample records
| settings                |
| transactions            | ← 5 sample records
| users                   | ← 3 records (admin, operator1, operator2)
+-------------------------+
```

---

### Step 3: Railway PHP Backend Deployment

#### 3.1 Create PHP Service

1. In same Railway project, click **"+ New"** → **"GitHub Repo"**
2. Authorize Railway to access GitHub
3. Select repository: **`dharmawanditaufan-pixel/motor-bersih`**
4. Wait for initial build (~2 minutes)

#### 3.2 Configure Environment Variables

Railway PHP service → **Variables** tab → Add these:

```env
# Database Connection (IMPORTANT: Use internal hostname for speed)
DB_HOST=mysql.railway.internal
DB_USER=root
DB_PASS=[your MYSQL_PASSWORD from Step 2.2]
DB_NAME=railway
DB_PORT=3306

# PHP Configuration
PHP_VERSION=8.1

# Application Root (where api/ folder is)
NIXPACKS_PHP_ROOT_DIR=/
```

Click **"Add"** for each variable.

#### 3.3 Configure Build & Deployment

Railway PHP service → **Settings**:

1. **Root Directory**: `/` (default, don't change)
2. **Watch Paths**: `api/**` (trigger rebuild on API changes)
3. **Health Check**: `/api/status.php` (optional, create if needed)

#### 3.4 Generate Public URL

Railway PHP service → **Settings** → **Networking**:

1. Click **"Generate Domain"**
2. Wait 10 seconds
3. Copy URL: `https://motor-bersih-api-production-xxxx.up.railway.app`
4. (Optional) Add custom domain: `api.motor-bersih.com`

#### 3.5 Test Backend Endpoints

```bash
# Test 1: Basic connectivity
curl https://motor-bersih-api-production-xxxx.up.railway.app/api/auth.php

# Expected: {"success":false,"error":"..."}  (not {"success":false,"error":"Database connection failed"})

# Test 2: Login
curl -X POST https://motor-bersih-api-production-xxxx.up.railway.app/api/auth.php \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"admin123\",\"role\":\"admin\"}"

# Expected: {"success":true,"token":"...","user":{...}}

# Test 3: Get customers (without auth - should fail)
curl https://motor-bersih-api-production-xxxx.up.railway.app/api/customers.php

# Expected: {"success":false,"error":"Unauthorized - Please login first"}

# Test 4: Get customers (with auth)
TOKEN="paste-token-from-test-2"
curl https://motor-bersih-api-production-xxxx.up.railway.app/api/customers.php \
  -H "Authorization: Bearer $TOKEN"

# Expected: {"success":true,"message":"Customers retrieved","data":[...]}
```

All tests passed? ✅ Backend is ready!

---

### Step 4: Vercel Frontend Deployment

#### 4.1 Verify API URL Configuration

File: `js/api-client.js` (already configured, no changes needed)

```javascript
detectBaseURL() {
    // Production - Vercel domain → Railway backend
    if (window.location.hostname.includes('vercel.app')) {
        return 'https://motor-bersih-api-production-xxxx.up.railway.app/api/';
    }
    // Local - XAMPP
    return '/motor-bersih/api/';
}
```

**⚠️ IMPORTANT**: Update this URL to match your Railway domain from Step 3.4!

```bash
# Open file
code D:\PROJECT\motor-bersih\js\api-client.js

# Line ~19, change to YOUR Railway URL:
return 'https://motor-bersih-api-production-xxxx.up.railway.app/api/';

# Save and commit
git add js/api-client.js
git commit -m "fix: Update Railway API URL in production"
git push origin main
```

#### 4.2 Deploy to Vercel

**Option A: Vercel CLI** (Fastest)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login
# Follow browser authentication

# Deploy
cd D:\PROJECT\motor-bersih
vercel --prod

# Answer prompts:
# Set up and deploy? Y
# Which scope? [your account]
# Link to existing project? N
# Project name? motor-bersih-pos
# Directory? ./ (current)
# Override settings? N

# Wait for deployment (~1 minute)
# Note the URL: https://motor-bersih-pos-xxxx.vercel.app
```

**Option B: Vercel Dashboard** (Easier for first-time)

1. Visit: https://vercel.com
2. Login with **GitHub**
3. Click **"New Project"**
4. Import `dharmawanditaufan-pixel/motor-bersih`
5. Configure:
   - Framework Preset: **Other**
   - Root Directory: `./`
   - Build Command: (leave empty)
   - Output Directory: `./`
   - Install Command: (leave empty)
6. Click **"Deploy"**
7. Wait ~1 minute
8. Copy Production URL: `https://motor-bersih-pos.vercel.app`

#### 4.3 Configure Custom Domain (Optional)

Vercel project → **Settings** → **Domains**:

1. Add domain: `motor-bersih.com`
2. Configure DNS:
   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   ```
3. Verify (takes 1-24 hours)

---

### Step 5: End-to-End Testing

#### 5.1 Login Test

1. Open: `https://motor-bersih-pos.vercel.app`
2. Enter credentials:
   - Username: `admin`
   - Password: `admin123`
   - Role: Admin
3. Click **"Login"**
4. ✅ Should redirect to Dashboard

**If login fails:**
- Open browser DevTools (F12) → Console tab
- Check for errors (CORS, 404, 500)
- Verify Railway backend URL in api-client.js
- Test backend directly (Step 3.5)

#### 5.2 Member Management Test

1. Navigate to **"Member"** page
2. Should display 5 sample members
3. Check loyalty counts:
   - Ahmad Riyadi: 3/5 cuci (motor_kecil)
   - Rudi Hartono: 1/5 cuci (motor_besar) - **Next wash should be 2/5 or FREE if count >= 5**
4. Click **"Detail"** on any member
5. Edit: Change phone number
6. Save → Should update successfully

**Test Create Member:**
1. Click **"Tambah Member"**
2. Fill form:
   - Nama: Test Member
   - Plat Nomor: B1111XXX
   - No WA: 081234567890
   - Tipe Motor: Motor Sedang
   - Merk: Yamaha NMAX
3. Save → Should create successfully
4. ✅ New member appears in list

#### 5.3 Transaction Flow Test (CRITICAL)

**Scenario: Member with loyalty (4/5) → Create transaction → Should become FREE (5/5)**

1. Go to **"Scan Plat Nomor"**
2. Manual Input: **B1234ABC** (Ahmad Riyadi, currently 3/5)
3. Should display:
   - Name: Ahmad Riyadi
   - Tipe: Motor Kecil
   - Loyalty: 3/5 cuci (●●●○○)
4. Click **"Lanjut Transaksi"**

5. Transaction Form:
   - Auto-filled: Name, Phone, Tipe Motor
   - Select Operator: **Budi Santoso**
   - Payment: **Tunai**
   - Price shows: **Rp 15.000** (motor kecil)
6. Click **"Proses Transaksi"**
7. ✅ Success modal appears

8. **Verify Loyalty Updated:**
   - Go to "Member" page
   - Find Ahmad Riyadi
   - Loyalty should now be: **4/5 cuci**

9. **Create one more transaction:**
   - Scan **B1234ABC** again
   - Loyalty shows: **4/5 cuci**
   - Create transaction
   - Loyalty becomes: **0/5 cuci** (reset after 5th wash)
   - **BUT the 5th wash should be FREE!**

10. **Create 5th transaction (FREE WASH):**
    - Edit loyalty manually to 4 (via Member edit if needed)
    - Scan **B1234ABC** again
    - Loyalty shows: **4/5 cuci**
    - Create transaction
    - ✅ Price should show: **Rp 0** (GRATIS)
    - ✅ Discount row appears: "Diskon Loyalty (Gratis): - Rp 15.000"
    - Submit
    - ✅ Loyalty resets to: **0/5 cuci**

**Test Guest Transaction:**

1. Go to **"Transaksi Baru"** directly
2. Enter:
   - Plat: **B9999ZZZ** (non-member)
   - Name: Guest Customer
   - Phone: 08123456789
   - Tipe: Motor Besar
   - Operator: Andi Wijaya
   - Payment: QRIS
3. Price: **Rp 20.000** (motor besar)
4. Submit
5. ✅ Transaction recorded
6. ✅ New guest customer created (is_member = false)

#### 5.4 Reports Test

**Transaction Report:**

1. Go to **"Laporan"** → **"Laporan Transaksi"**
2. Select:
   - Periode: **Hari Ini**
   - Tipe Motor: **Semua**
3. Click **"Tampilkan"**
4. Should display:
   - Summary cards: Total, Pendapatan, Member Aktif, Rata-rata
   - Breakdown by motor type (Kecil/Sedang/Besar)
   - Transaction detail table
5. Click **"Export Excel"**
6. ✅ CSV file downloads: `laporan_transaksi_YYYY-MM-DD.csv`

**Attendance Report:**

1. Switch to **"Laporan Absensi"** tab
2. Select:
   - Operator: **Budi Santoso**
   - Month: **Current month**
3. Click **"Tampilkan"**
4. Should display:
   - Summary: Hadir, Terlambat, Tidak Hadir, Cuti
   - Detail table with check-in/out times and duration
5. Export Excel → ✅ CSV downloads

#### 5.5 Operator Attendance Test

1. Go to **"Operator"** page
2. Click **"Check In"** for Budi Santoso
3. ✅ Success message
4. Time should be recorded
5. Status:
   - If before 8:15 AM: **Present** (green)
   - If after 8:15 AM: **Late** (yellow)
6. Later, click **"Check Out"**
7. ✅ Success, duration calculated

---

### Step 6: Production Configuration Hardening

#### 6.1 Change Default Passwords

**⚠️ CRITICAL SECURITY STEP**

```sql
-- Connect to Railway MySQL
railway run mysql -u root -p railway

-- Change admin password
UPDATE users 
SET password = '$2y$10$YOUR_NEW_BCRYPT_HASH_HERE' 
WHERE username = 'admin';

-- Change operator passwords
UPDATE users 
SET password = '$2y$10$YOUR_NEW_BCRYPT_HASH_HERE' 
WHERE username = 'operator1';

-- Verify
SELECT username, role FROM users;
EXIT;
```

Generate bcrypt hash: https://bcrypt-generator.com/ (10 rounds)

#### 6.2 Enable HTTPS Only (Already done by Vercel & Railway)

Both platforms enforce HTTPS automatically. ✅

#### 6.3 Set Up Monitoring

**Railway Logs:**
```bash
# Real-time logs
railway logs --follow

# Filter errors
railway logs | grep ERROR

# Last 100 lines
railway logs --tail 100
```

**Vercel Analytics:**

1. Vercel project → **Analytics**
2. Enable **Web Analytics** (free)
3. Track:
   - Page views
   - Load time
   - Errors

#### 6.4 Database Backup Strategy

**Automated Backup (Railway):**

Railway MySQL automatically creates daily backups (retained for 7 days).

**Manual Backup:**

```bash
# Backup to file
railway run mysqldump -u root -p railway > motor-bersih-backup-$(date +%Y%m%d).sql

# Restore from backup
railway run mysql -u root -p railway < motor-bersih-backup-YYYYMMDD.sql
```

**Schedule Weekly Backups:**

Create `.github/workflows/backup.yml`:

```yaml
name: Weekly Database Backup
on:
  schedule:
    - cron: '0 0 * * 0'  # Every Sunday at midnight
jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Backup Database
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        run: |
          npm install -g @railway/cli
          railway login --token $RAILWAY_TOKEN
          railway run mysqldump -u root -p$MYSQL_PASSWORD railway > backup.sql
      - name: Upload to Storage
        # Add your storage solution (AWS S3, Google Drive, etc.)
```

---

## 🎉 Deployment Complete!

### Production URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | https://motor-bersih-pos.vercel.app | User Interface |
| **Backend API** | https://motor-bersih-api-production-xxxx.up.railway.app | API Endpoints |
| **GitHub Repo** | https://github.com/dharmawanditaufan-pixel/motor-bersih | Source Code |

### Default Credentials

**Admin:**
- Username: `admin`
- Password: `admin123`
- Role: Admin

**Operator 1:**
- Username: `operator1`
- Password: `operator123`
- Role: Operator

**⚠️ CHANGE THESE IMMEDIATELY IN PRODUCTION!**

### System Capabilities

✅ **Member Management**
- Full CRUD operations
- Loyalty tracking: 5x cuci → 1x gratis
- Automatic loyalty reset after free wash
- Photo upload for license plates
- WhatsApp notification-ready

✅ **Transaction Processing**
- Member & Guest transactions
- Real-time price calculation
- Loyalty discount application
- Multiple payment methods (Tunai/Transfer/QRIS/Debit)
- Commission auto-calculation: 30%

✅ **Operator Management**
- Commission tracking: 30% of original price
- Attendance system: Check-in/out with duration
- Automatic late detection (after 8:15 AM)
- Performance statistics

✅ **Reporting**
- Transaction reports: Harian/Mingguan/Bulanan/Tahunan
- Attendance reports: By operator and month
- Export to Excel (CSV format)
- Summary cards and breakdown by motor type

✅ **Camera Integration**
- License plate scanning (manual input for demo)
- Auto-search member database
- Quick transaction flow
- Scan history tracking

---

## 🔧 Troubleshooting Guide

### Problem 1: "Database connection failed"

**Cause:** Railway MySQL not accessible or wrong credentials

**Solutions:**
1. Check MySQL service is running: `railway status`
2. Verify environment variables in PHP service
3. Test connection: `railway run mysql -u root -p railway -e "SELECT 1"`
4. Ensure `DB_HOST=mysql.railway.internal` (not public hostname)

### Problem 2: "CORS policy blocked"

**Cause:** Frontend origin not allowed in backend

**Solutions:**
1. Check `api/config-production.php` → `$allowedOrigins` array
2. Add your Vercel domain: `'https://motor-bersih-pos.vercel.app'`
3. Redeploy backend: `git push origin main`
4. Wait 2 minutes for Railway rebuild

### Problem 3: "Token expired" or "Unauthorized"

**Cause:** Session not persisting or token not sent

**Solutions:**
1. Check browser console for token: `localStorage.getItem('authToken')`
2. Verify `api-client.js` sends Bearer token in Authorization header
3. Check backend `checkAuth()` function validates token
4. Clear browser cookies and login again

### Problem 4: Loyalty not updating correctly

**Cause:** Frontend-backend data mismatch

**Debug:**
```javascript
// In browser console
await apiClient.get('customers/1')
// Check loyalty_count value

await apiClient.get('transactions?customer_id=1')
// Check transaction history
```

**Solution:**
1. Verify `updateMemberLoyalty()` in `transactions-handler.js`
2. Check logic: `wasFreewash ? 0 : loyalty_count + 1`
3. Ensure `PUT /customers/{id}` updates loyalty_count
4. Test with sample member (B1234ABC)

### Problem 5: Free wash not showing as Rp 0

**Cause:** Loyalty calculation error

**Fix in `transactions-handler.js`:**
```javascript
// Line ~280
const loyaltyProgress = loyaltyCount % 5;
if (loyaltyProgress === 0 && loyaltyCount >= 5) {
    isLoyaltyFree = true;
    finalPrice = 0;  // Must be 0!
}
```

Verify:
- `loyaltyCount` is correct number (not string)
- Calculation: `5 % 5 === 0` and `5 >= 5` → TRUE → Free!
- `10 % 5 === 0` and `10 >= 5` → TRUE → Free again!

### Problem 6: Commission incorrect for free washes

**Expected:** 30% of **original price** (not Rp 0)

**Fix in `api/transactions.php`:**
```php
// Line ~169
$originalPrice = (float)($data['original_price'] ?? $price);
$commissionBasePrice = $isLoyaltyFree ? $originalPrice : $price;
$commissionAmount = ($commissionBasePrice * $commissionRate) / 100;
```

Example:
- Motor Kecil: Rp 15,000 (original)
- 5th wash: Rp 0 (free)
- Commission: 30% × Rp 15,000 = **Rp 4,500** ✅

---

## 📊 Post-Deployment Checklist

### Functional Tests
- [ ] Admin login works
- [ ] Operator login works
- [ ] Dashboard displays real data from Railway MySQL
- [ ] Members CRUD: Create, Read, Update, Delete
- [ ] Loyalty counter: Increments on transaction
- [ ] Free wash: Triggers at 5x, resets to 0
- [ ] Transactions: Create for member and guest
- [ ] Commission: Calculates 30% correctly
- [ ] Attendance: Check-in/out records time
- [ ] Reports: Generate with filters and export CSV
- [ ] Camera scan: Integrates with transaction form

### Performance Tests
- [ ] Dashboard loads < 2 seconds
- [ ] API responses < 500ms average
- [ ] Transaction form submits < 1 second
- [ ] Reports generate < 3 seconds
- [ ] Export CSV downloads instantly

### Security Tests
- [ ] Cannot access pages without login
- [ ] Operators cannot access admin functions
- [ ] SQL injection protected (try: `'; DROP TABLE users; --`)
- [ ] XSS protected (try: `<script>alert('xss')</script>` in inputs)
- [ ] Rate limiting works (try 10 failed logins fast)

### Data Integrity Tests
- [ ] Transaction creates customer if not exists
- [ ] Loyalty count never goes negative
- [ ] Free wash always Rp 0
- [ ] Commission always 30% of original price
- [ ] Attendance timestamps are accurate (Asia/Jakarta timezone)
- [ ] Database foreign keys enforce referential integrity

---

## 🛠️ Maintenance Guide

### Daily Tasks
```bash
# Check for errors
railway logs --tail 100 | grep ERROR

# Monitor API health
curl https://your-backend.railway.app/api/status.php

# Check database size
railway run mysql -u root -p railway -e "
SELECT 
  table_name,
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.TABLES
WHERE table_schema = 'railway'
ORDER BY (data_length + index_length) DESC;"
```

### Weekly Tasks
1. **Review Transaction Data**
   ```sql
   SELECT DATE(created_at) as date, COUNT(*) as count, SUM(amount) as revenue
   FROM transactions
   WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
   GROUP BY DATE(created_at)
   ORDER BY date DESC;
   ```

2. **Check Operator Performance**
   ```sql
   SELECT o.name, COUNT(t.id) as transactions, SUM(t.commission_amount) as total_commission
   FROM operators o
   LEFT JOIN transactions t ON o.id = t.operator_id
   WHERE t.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
   GROUP BY o.id
   ORDER BY transactions DESC;
   ```

3. **Backup Database**
   ```bash
   railway run mysqldump -u root -p railway > backup-$(date +%Y%m%d).sql
   ```

### Monthly Tasks
1. Archive old logs (> 30 days)
2. Review and optimize slow queries
3. Update dependencies (if any)
4. Generate monthly business report
5. Verify backup restoration works

### Quarterly Tasks
1. Security audit (check for vulnerabilities)
2. Performance optimization review
3. User feedback analysis
4. Feature roadmap planning

---

## 📞 Support & Resources

### Documentation
- This deployment guide
- API documentation: Check each `api/*.php` file headers
- Database schema: `api/schema.sql` with detailed comments

### Logging
- **Backend logs**: `railway logs --follow`
- **Frontend errors**: Browser DevTools → Console
- **Database queries**: Enable in `config-production.php` (dev only!)

### Monitoring
- **Railway dashboard**: https://railway.app/dashboard
- **Vercel analytics**: https://vercel.com/dashboard
- **GitHub commits**: https://github.com/dharmawanditaufan-pixel/motor-bersih/commits

### Getting Help
1. Check logs first (backend + frontend console)
2. Review this troubleshooting section
3. Test with curl/Postman to isolate frontend vs backend issues
4. Check Railway/Vercel status pages for platform issues

---

## ✅ Success Criteria

Your deployment is successful when:

✅ Users can login from any device  
✅ All CRUD operations work  
✅ Loyalty system calculates correctly (5x → gratis)  
✅ Commissions are 30% of original price  
✅ Reports export to CSV  
✅ Data persists across sessions  
✅ No console errors on happy path  
✅ Page load time < 3 seconds  
✅ API response time < 500ms  
✅ Mobile responsive (test on phone)  

---

## 🎊 You're Live!

**Congratulations! Your Motor Bersih POS system is now running in production.**

**Quick Start:**
1. Open: https://motor-bersih-pos.vercel.app
2. Login with admin/admin123
3. Change default passwords
4. Add real operators
5. Register members
6. Start processing transactions!

**Next Steps:**
- Train staff on the system
- Monitor first week closely
- Collect user feedback
- Plan feature enhancements

---

*Document Version: 1.0 FINAL*  
*Created: January 17, 2026*  
*Author: Motor Bersih Development Team*  
*Support: Check Railway logs and GitHub issues*

**END OF DEPLOYMENT GUIDE**
