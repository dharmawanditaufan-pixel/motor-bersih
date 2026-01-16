# 🚀 INSTALLATION & SETUP GUIDE
## Motor Bersih POS - Complete Setup Instructions

**Last Updated:** January 16, 2026
**Version:** 2.0
**Status:** Ready for Installation

---

## 📋 TABLE OF CONTENTS

1. [Prerequisites](#prerequisites)
2. [XAMPP Installation & Configuration](#xampp-setup)
3. [Database Setup](#database-setup)
4. [Application Configuration](#application-configuration)
5. [Verification & Testing](#verification--testing)
6. [Troubleshooting](#troubleshooting)
7. [First-Time Login](#first-time-login)
8. [Ongoing Maintenance](#ongoing-maintenance)

---

## 📌 PREREQUISITES

### System Requirements

- **Operating System:** Windows 7 or Higher
- **RAM:** Minimum 2GB (4GB+ recommended)
- **Storage:** 500MB free space
- **Browser:** Chrome, Firefox, Edge, or Safari (latest versions)

### Software to Install

1. **XAMPP 7.4 or Higher**
   - Download: https://www.apachefriends.org/
   - Includes: Apache, MySQL, PHP, phpMyAdmin

2. **Text Editor (Optional but recommended)**
   - VS Code: https://code.visualstudio.com/
   - Notepad++: https://notepad-plus-plus.org/

3. **Git (Optional for version control)**
   - Download: https://git-scm.com/

---

## ⚙️ XAMPP SETUP

### Step 1: Download & Install XAMPP

1. Download XAMPP 7.4+ from https://www.apachefriends.org/
2. Run the installer
3. Accept default installation location: `C:\xampp`
4. Select components to install:
   - ✅ Apache
   - ✅ MySQL
   - ✅ PHP
   - ✅ phpMyAdmin
   - (Others optional)

### Step 2: Verify PHP Extensions

1. Open XAMPP Control Panel
2. Click "Config" button next to Apache
3. Select "PHP (php.ini)" 
4. Verify these extensions are **uncommented** (no `;` before them):
   ```
   extension=pdo_mysql
   extension=mysql
   extension=json
   extension=curl
   extension=gd
   ```

5. If not found, add these lines in `[Dynamic Extensions]` section:
   ```ini
   extension=pdo_mysql
   extension=mysql
   extension=json
   extension=curl
   extension=gd
   ```

6. Save and close the file

### Step 3: Configure MySQL

1. In XAMPP Control Panel, click "Config" next to MySQL
2. Select "my.ini"
3. Find the line with `max_allowed_packet` and set it to:
   ```ini
   max_allowed_packet=256M
   ```

4. Save and close

### Step 4: Start Services

1. In XAMPP Control Panel:
   - Click "Start" for **Apache**
   - Click "Start" for **MySQL**

2. You should see:
   ```
   Apache: [Running] [PID: XXXX]
   MySQL: [Running] [PID: XXXX]
   ```

3. If you see errors, check [Troubleshooting](#troubleshooting) section

---

## 🗄️ DATABASE SETUP

### Step 1: Place Project Files

1. Navigate to: `C:\xampp\htdocs`
2. Copy the entire `motor-bersih` folder here
3. Final path should be: `C:\xampp\htdocs\motor-bersih`

### Step 2: Create Database & Tables

#### Method 1: Using Command Line (Recommended)

1. Open Command Prompt (Windows key + R, type `cmd`)
2. Navigate to XAMPP MySQL bin:
   ```cmd
   cd C:\xampp\mysql\bin
   ```

3. Login to MySQL:
   ```cmd
   mysql -u root -p
   ```
   (Press Enter when asked for password - root has no password by default)

4. Create database and import schema:
   ```sql
   CREATE DATABASE IF NOT EXISTS motowash_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   USE motowash_db;
   ```

5. Import the schema file:
   ```cmd
   mysql -u root motowash_db < C:\xampp\htdocs\motor-bersih\api\schema.sql
   ```

6. Verify tables were created:
   ```sql
   SHOW TABLES;
   ```

7. You should see these tables:
   ```
   audit_logs
   commissions
   customers
   operators
   settings
   transactions
   users
   ```

#### Method 2: Using phpMyAdmin (Web Interface)

1. Open browser and go to: `http://localhost/phpmyadmin`
2. Login (default: username `root`, no password)
3. Click "New" button
4. Database name: `motowash_db`
5. Collation: `utf8mb4_unicode_ci`
6. Click "Create"
7. Click on the newly created database
8. Go to "Import" tab
9. Click "Choose File"
10. Select: `C:\xampp\htdocs\motor-bersih\api\schema.sql`
11. Click "Import"

### Step 3: Verify Database

1. Go to `http://localhost/phpmyadmin`
2. Click on `motowash_db` database
3. You should see 7 tables:
   - ✅ users (with 3 demo users)
   - ✅ customers (with 5 sample customers)
   - ✅ operators (with 2 operators)
   - ✅ transactions (with 5 sample transactions)
   - ✅ commissions (with commission records)
   - ✅ settings (with configuration)
   - ✅ audit_logs (empty initially)

---

## ⚙️ APPLICATION CONFIGURATION

### Step 1: Copy Environment File

1. Navigate to: `C:\xampp\htdocs\motor-bersih\api`
2. Copy the file `.env.example` and rename to `.env`
3. Open `.env` file in text editor
4. Review and update if needed (most defaults are fine for local development):
   ```
   APP_ENV=development
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=
   DB_NAME=motowash_db
   ALLOWED_ORIGINS=http://localhost
   ```

5. Save the file

### Step 2: Create Required Directories

The application needs these folders to exist:

1. Open Command Prompt
2. Run:
   ```cmd
   mkdir C:\xampp\htdocs\motor-bersih\logs
   mkdir C:\xampp\htdocs\motor-bersih\cache
   mkdir C:\xampp\htdocs\motor-bersih\uploads
   ```

3. Or create them manually in File Explorer if you prefer

### Step 3: Set File Permissions (Windows)

1. Right-click each folder (logs, cache, uploads)
2. Properties → Security → Edit
3. Add "IUSR" user (IIS User) with Full Control
4. Or just ensure they're writable by Everyone

### Step 4: Review Backend Configuration

The improved config file is ready at: `api/config-improved.php`

**Note:** When ready to upgrade, backup `api/config.php` and rename `api/config-improved.php` to `api/config.php`

---

## ✅ VERIFICATION & TESTING

### Test 1: API Status Check

1. Open browser: `http://localhost/motor-bersih/api/status.php`
2. You should see:
   ```json
   {
     "success": true,
     "status": "API is running",
     "mysql_version": "5.7.x or 8.0.x",
     "table_count": 7
   }
   ```

3. If you see errors, check [Troubleshooting](#troubleshooting)

### Test 2: Frontend Access

1. Open browser: `http://localhost/motor-bersih/`
2. You should see the Motor Bersih login page
3. Check browser console (F12) for any JavaScript errors

### Test 3: Login Test (Demo)

1. Go to login page
2. Try these credentials:
   - Username: `admin`
   - Password: `admin123`
   - Role: `admin`

3. Or:
   - Username: `operator1`
   - Password: `operator123`
   - Role: `operator`

4. If login works, dashboard loads successfully ✅

### Test 4: Database Query Test

1. Open Command Prompt
2. Run:
   ```cmd
   cd C:\xampp\mysql\bin
   mysql -u root motowash_db -e "SELECT id, username, name, role FROM users;"
   ```

3. You should see the 3 demo users

### Test 5: API Connection Test

1. Open browser: `http://localhost/motor-bersih/`
2. Open Developer Tools (F12)
3. Go to Console tab
4. Type and run:
   ```javascript
   const client = new APIClient();
   client.testConnection().then(result => console.log('API Test:', result));
   ```

5. Should return success: `true`

---

## 🔧 TROUBLESHOOTING

### Problem: "Cannot connect to database"

**Solution:**
1. Check MySQL is running in XAMPP Control Panel
2. Verify database name is `motowash_db`
3. Check file exists: `C:\xampp\htdocs\motor-bersih\api\config.php`
4. Verify DB_HOST is `localhost` and DB_USER is `root`

### Problem: "Connection refused" or "Port already in use"

**Solution:**
1. Check if MySQL is running on correct port (default: 3306)
2. Check if another application is using port 3306:
   ```cmd
   netstat -ano | findstr :3306
   ```
3. Change MySQL port in `my.ini` if needed
4. Restart XAMPP services

### Problem: "Cannot access http://localhost/motor-bersih"

**Solution:**
1. Check Apache is running in XAMPP Control Panel
2. Verify folder path: `C:\xampp\htdocs\motor-bersih` exists
3. Check browser address is exactly: `http://localhost/motor-bersih/` (note trailing slash)
4. Clear browser cache (Ctrl+Shift+Delete)

### Problem: "404 Not Found" on API endpoints

**Solution:**
1. Check PHP is installed and enabled in XAMPP
2. Verify file exists: `C:\xampp\htdocs\motor-bersih\api\auth.php`
3. Check file permissions are readable
4. Review Apache error log: `C:\xampp\apache\logs\error.log`

### Problem: "Login page loads but fails to login"

**Solution:**
1. Open Developer Tools (F12)
2. Check Console for JavaScript errors
3. Check Network tab for API response
4. Verify API status: `http://localhost/motor-bersih/api/status.php`
5. Check database has users: Run the [Test 4](#test-4-database-query-test)

### Problem: "Folder permissions denied"

**Solution:**
1. Right-click `C:\xampp\htdocs\motor-bersih` folder
2. Properties → Security → Edit
3. Select Users group and click Edit
4. Enable "Full Control" for this folder
5. Apply and OK

### Problem: "MySQL service won't start"

**Solution:**
1. Check port 3306 is not already in use:
   ```cmd
   netstat -ano | findstr :3306
   ```
2. Kill process using that port (if it's not MySQL)
3. Try starting MySQL again
4. Check error log: `C:\xampp\mysql\data\mysql_error.log`

---

## 🔐 FIRST-TIME LOGIN

### Demo User Credentials

After database setup, you can login with:

**Admin Account:**
- Username: `admin`
- Password: `admin123`
- Role: `admin`

**Operator Account:**
- Username: `operator1`
- Password: `operator123`
- Role: `operator`

### Important Notes

⚠️ **FOR DEVELOPMENT ONLY**: These are demo credentials. Do NOT use in production!

⚠️ **Change These Immediately:**
1. Change admin password
2. Change operator passwords
3. Add your own users
4. Keep database.sql secure

---

## 🔄 ONGOING MAINTENANCE

### Daily Tasks

- [ ] Check API is responsive
- [ ] Review error logs
- [ ] Monitor database size

### Weekly Tasks

- [ ] Backup database
- [ ] Check for PHP security updates
- [ ] Review user activity logs

### Monthly Tasks

- [ ] Full database backup
- [ ] Update XAMPP/PHP if updates available
- [ ] Review performance metrics
- [ ] Update documentation

### Backup Database

**Using Command Line:**
```cmd
cd C:\xampp\mysql\bin
mysqldump -u root motowash_db > C:\backups\motowash_db_backup.sql
```

**Using phpMyAdmin:**
1. Go to `http://localhost/phpmyadmin`
2. Select `motowash_db` database
3. Click "Export" tab
4. Click "Go" button to download

### Restore Database

**Using Command Line:**
```cmd
cd C:\xampp\mysql\bin
mysql -u root motowash_db < C:\backups\motowash_db_backup.sql
```

---

## 📞 SUPPORT & HELP

### If You Get Stuck

1. **Check Error Logs**
   - Apache: `C:\xampp\apache\logs\error.log`
   - MySQL: `C:\xampp\mysql\data\mysql_error.log`
   - API: `C:\xampp\htdocs\motor-bersih\logs\`

2. **Test API Manually**
   ```
   http://localhost/motor-bersih/api/status.php
   http://localhost/motor-bersih/api/test.php
   ```

3. **Check Database**
   ```cmd
   mysql -u root -e "SHOW DATABASES;"
   mysql -u root motowash_db -e "SHOW TABLES;"
   ```

4. **Review Configuration**
   - File: `C:\xampp\htdocs\motor-bersih\api\config.php`
   - Check all database connection values

---

## ✨ FINAL CHECKLIST

Before considering setup complete:

- [ ] XAMPP installed and running
- [ ] Apache service started
- [ ] MySQL service started
- [ ] Database `motowash_db` created
- [ ] All 7 tables exist with data
- [ ] Application folder in `C:\xampp\htdocs\motor-bersih`
- [ ] Can access `http://localhost/motor-bersih/`
- [ ] API status returns success
- [ ] Can login with demo credentials
- [ ] Dashboard loads without errors
- [ ] logs and cache folders exist and are writable

---

## 🎉 READY TO GO!

Once all checks pass, your Motor Bersih POS application is ready to use!

**Next Steps:**
1. Configure pricing in Settings
2. Add your operators and customers
3. Start processing transactions
4. Monitor the dashboard

---

**Questions or Issues?** Check the troubleshooting section or review error logs for more details.

**Report generated:** January 16, 2026
