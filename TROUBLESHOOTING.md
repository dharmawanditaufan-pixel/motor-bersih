# 🔧 TROUBLESHOOTING GUIDE - Motor Bersih POS

## ❌ Problem: JavaScript Files Not Found (404 Errors)

### Error Messages:
```
api-client.js:1 Failed to load resource: the server responded with a status of 404 (Not Found)
utils.js:1 Failed to load resource: the server responded with a status of 404 (Not Found)
dashboard.js:1 Failed to load resource: the server responded with a status of 404 (Not Found)
auth.js:1 Failed to load resource: the server responded with a status of 404 (Not Found)
```

---

## ✅ SOLUTION

### Cause:
You're accessing the application incorrectly, likely using one of these wrong methods:
- ❌ Opening HTML files directly from File Explorer (file:/// protocol)
- ❌ Using VS Code "Open with Live Server" on wrong port
- ❌ Opening from wrong directory

### Fix:

#### Method 1: Use the Startup Script (RECOMMENDED)
```bash
# Double-click this file:
start-app.bat

# Or run from PowerShell:
.\start-app.bat
```

This will:
- Start XAMPP automatically
- Open the app at http://localhost/motor-bersih/
- Open phpMyAdmin

#### Method 2: Manual Access
1. Make sure XAMPP is running (Apache + MySQL)
2. Open your browser
3. Navigate to: **http://localhost/motor-bersih/**
4. DO NOT open index.html directly from file explorer!

#### Method 3: Verify File Paths
Open this file in your browser to check if files are loading:
```
http://localhost/motor-bersih/verify-files.html
```

---

## 📁 Correct File Structure

Your files should be located at:
```
C:\xampp\htdocs\motor-bersih\
├── index.html
├── js\
│   ├── api-client.js
│   ├── api.js
│   ├── auth.js
│   ├── dashboard.js
│   ├── utils.js
│   └── ...
├── api\
│   ├── auth.php
│   ├── dashboard.php
│   └── ...
└── pages\
    └── dashboard.html
```

If your files are in `D:\PROJECT\motor-bersih\`, you need to:

### Option A: Copy to XAMPP htdocs
```powershell
# Run this in PowerShell:
Copy-Item "D:\PROJECT\motor-bersih\*" -Destination "C:\xampp\htdocs\motor-bersih\" -Recurse -Force
```

### Option B: Create Virtual Host
Add to `C:\xampp\apache\conf\extra\httpd-vhosts.conf`:
```apache
<VirtualHost *:80>
    DocumentRoot "D:/PROJECT/motor-bersih"
    ServerName motorbersih.local
    <Directory "D:/PROJECT/motor-bersih">
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

Then add to `C:\Windows\System32\drivers\etc\hosts`:
```
127.0.0.1 motorbersih.local
```

Access via: http://motorbersih.local/

---

## ⚠️ About Tailwind CDN Warning

The warning:
```
cdn.tailwindcss.com should not be used in production
```

**This is just a WARNING, not an error.** Your app will still work.

### To Remove This Warning (Optional):
1. Install Tailwind CSS locally:
```bash
npm install -D tailwindcss
npx tailwindcss init
```

2. Replace in HTML files:
```html
<!-- OLD -->
<script src="https://cdn.tailwindcss.com"></script>

<!-- NEW -->
<link href="./output.css" rel="stylesheet">
```

3. Build CSS:
```bash
npx tailwindcss -i ./input.css -o ./output.css --watch
```

**For development, you can ignore this warning.**

---

## 🧪 Quick Tests

### Test 1: Check if XAMPP is Running
```powershell
# In PowerShell:
Test-NetConnection -ComputerName localhost -Port 80

# Should show: TcpTestSucceeded : True
```

### Test 2: Check File Access
Navigate to:
- http://localhost/motor-bersih/js/api-client.js

If you see JavaScript code, it's working!
If you see 404, check your XAMPP setup.

### Test 3: Check API
```powershell
# In PowerShell:
Invoke-WebRequest -Uri "http://localhost/motor-bersih/api/status.php"

# Should return JSON with success: true
```

---

## 🔄 Still Not Working?

### Reset Everything:
```powershell
# 1. Stop XAMPP
# 2. Clear browser cache (Ctrl + Shift + Delete)
# 3. Restart Apache from XAMPP Control Panel
# 4. Try accessing again:
Start-Process "http://localhost/motor-bersih/"
```

### Check Apache Error Logs:
```
C:\xampp\apache\logs\error.log
```

### Check PHP Errors:
```
C:\xampp\php\logs\php_error_log
```

---

## 📞 Need More Help?

Check these files:
- [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)
- [DEBUG_GUIDE.md](DEBUG_GUIDE.md)
- [QUICK_START.md](QUICK_START.md)

---

**Remember:** Always access via `http://localhost/motor-bersih/`, never open HTML files directly!
