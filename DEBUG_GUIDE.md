# 🔧 Panduan Debug Login Issues

## Langkah-langkah untuk Mengecek Masalah Login

### 1. **Cek API Status Terlebih Dahulu**

Buka di browser: `http://localhost/motor-bersih/debug.html`

Kemudian klik tombol **"Test API Status"** untuk memastikan API bisa diakses.

**Expected Response:**
```json
{
  "success": true,
  "message": "API and Database are working!",
  "database": {
    "name": "motowash_db",
    "version": "5.7.x",
    "table_count": 6
  },
  "api": {
    "version": "1.0",
    "timestamp": "2024-01-15 10:30:45"
  }
}
```

Jika mendapat error, masalahnya adalah:
- ❌ XAMPP tidak berjalan
- ❌ Database tidak ada
- ❌ Project path salah

### 2. **Jika API Status Berhasil, Test Login**

Di halaman debug, masukkan:
- Username: `admin`
- Password: `admin123`
- Role: `Administrator`

Kemudian klik **"Test Login"**

**Expected Response:**
```json
{
  "success": true,
  "token": "eyJ1c2VyX2lkIjoxLCJ1c2VybmFtZSI6ImFkbWluIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNjM2MzU4NDAwfQ==",
  "user": {
    "id": 1,
    "username": "admin",
    "name": "Administrator",
    "role": "admin"
  }
}
```

Jika error, kemungkinan:
- ❌ Credentials salah (periksa spelling)
- ❌ Database tidak punya user data
- ❌ PHP tidak mengolah request dengan benar

### 3. **Periksa Browser Console**

Ketika mencoba login di halaman login:

1. Buka halaman login: `http://localhost/motor-bersih/pages/index.html`
2. Tekan `F12` untuk buka Developer Tools
3. Klik tab **Console**
4. Coba login dengan admin/admin123
5. Lihat pesan di console

Harus ada log seperti:
```
Login form found: true
Attaching login submit handler
Form submitted
Calling apiClient.login with: {username: 'admin', password: 'admin123', role: 'admin'}
API response: {success: true, token: '...', user: {...}}
```

---

## Troubleshooting Berdasarkan Error

### ❌ Error: "API Offline (Demo Mode)"

**Penyebab:** XAMPP tidak berjalan atau API tidak bisa diakses

**Solusi:**
1. Buka XAMPP Control Panel
2. Klik **Start** untuk Apache dan MySQL (harus berwarna green)
3. Tunggu 10 detik
4. Refresh browser (`F5`)

### ❌ Error: "Username, password, atau role salah"

**Kemungkinan Penyebab:**

**A. Database tidak ada**
- Solusi: Buat database `motowash_db` di phpMyAdmin
- Periksa di: `http://localhost/phpmyadmin`
- Atau jalankan: `check-db.bat`

**B. Credentials salah**
- Periksa spelling: `admin` bukan `Admin`
- Periksa password: `admin123` (tanpa spasi)
- Pastikan role dipilih: `Administrator` bukan `admin`

**C. API response format salah**
- Lihat debug.html > Test Login
- Lihat di browser console apa exact response dari API
- Pastikan response adalah valid JSON

**D. Form handler tidak terikat**
- Buka console (F12)
- Lihat apakah log "Attaching login submit handler" muncul
- Jika tidak, berarti form tidak ditemukan

### ❌ Error: "Cannot find pages/dashboard.html"

**Penyebab:** Redirect path salah setelah login sukses

**Solusi:**
- Jika login dari `http://localhost/motor-bersih/pages/index.html`
  - Redirect otomatis ke: `http://localhost/motor-bersih/pages/dashboard.html` ✅

- Jika login dari `http://localhost/motor-bersih/index.html`
  - Akan coba redirect ke: `http://localhost/motor-bersih/pages/dashboard.html` ❌ (tidak ada)
  - Solusi: Akses dari `http://localhost/motor-bersih/pages/index.html`

---

## Checklist Sebelum Debug

✅ XAMPP running (Apache + MySQL green)
✅ Project di: `C:\xampp\htdocs\motor-bersih`
✅ Database `motowash_db` sudah dibuat
✅ Akses dari: `http://localhost/motor-bersih/pages/index.html`
✅ Browser console tidak ada error (F12 > Console)

---

## Step-by-Step Setup Jika Belum Pernah Setup

1. **Install XAMPP**
   ```
   Download dari: apachefriends.org
   Install ke: C:\xampp
   ```

2. **Copy Project**
   ```
   Copy folder motor-bersih ke: C:\xampp\htdocs\
   Lokasi final: C:\xampp\htdocs\motor-bersih
   ```

3. **Start XAMPP**
   ```
   Buka XAMPP Control Panel
   Klik Start untuk Apache & MySQL
   Tunggu sampai indicator berwarna green
   ```

4. **Create Database**
   ```
   Option A - Menggunakan phpMyAdmin:
   - Buka: http://localhost/phpmyadmin
   - Klik "New"
   - Database name: motowash_db
   - Charset: utf8mb4_unicode_ci
   - Klik Create

   Option B - Menggunakan script:
   - Jalankan: check-db.bat (dari folder motor-bersih)
   ```

5. **Akses Aplikasi**
   ```
   Buka browser: http://localhost/motor-bersih/pages/index.html
   Login dengan: admin / admin123
   ```

---

## API Endpoints untuk Testing

### Test Connection
```
GET /api/status.php
```

### Login
```
POST /api/auth.php
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123",
  "role": "admin"
}
```

### Dashboard Data
```
GET /api/dashboard.php?period=today
GET /api/dashboard.php?period=week
GET /api/dashboard.php?period=month
```

---

## Debug Tools

**1. Debug Console:**
- URL: `http://localhost/motor-bersih/debug.html`
- Test API tanpa perlu membuka console
- Lihat response JSON dengan format rapi

**2. Browser Console:**
- Tekan: `F12`
- Tab: `Console`
- Lihat semua error dan log

**3. Network Tab:**
- Tekan: `F12`
- Tab: `Network`
- Lihat semua request ke API
- Klik request untuk lihat response

**4. phpMyAdmin:**
- URL: `http://localhost/phpmyadmin`
- Lihat dan manage database
- Check table structure

---

## Contact Support

Jika masih error setelah semua langkah di atas:

1. Buka: `http://localhost/motor-bersih/debug.html`
2. Klik semua tombol test
3. Screenshot hasil response
4. Copy error message dari browser console (F12)
5. Share informasi tersebut

---

**Last Updated:** January 15, 2026
**Version:** 1.0
