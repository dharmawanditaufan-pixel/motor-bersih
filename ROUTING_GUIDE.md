# 🧭 ROUTING & NAVIGATION GUIDE

## ✅ Hash Routing Telah Diperbaiki!

Sistem navigasi Motor Bersih POS sekarang mendukung hash routing dengan benar.

---

## 🔗 URL yang Didukung

Aplikasi sekarang mendukung navigasi melalui hash URL:

### ✅ Metode 1: Hash Routing (Recommended)
```
http://localhost/motor-bersih/dashboard.html#dashboard
http://localhost/motor-bersih/dashboard.html#new-transaction
http://localhost/motor-bersih/dashboard.html#camera-capture
http://localhost/motor-bersih/dashboard.html#transactions
http://localhost/motor-bersih/dashboard.html#customers
http://localhost/motor-bersih/dashboard.html#operators
http://localhost/motor-bersih/dashboard.html#reports
http://localhost/motor-bersih/dashboard.html#settings
```

### ✅ Metode 2: Direct Page Access
```
http://localhost/motor-bersih/pages/dashboard.html
http://localhost/motor-bersih/pages/register-wash.html
http://localhost/motor-bersih/pages/camera-capture.html
http://localhost/motor-bersih/pages/transactions.html
http://localhost/motor-bersih/pages/customers.html
http://localhost/motor-bersih/pages/operators.html
http://localhost/motor-bersih/pages/reports.html
http://localhost/motor-bersih/pages/settings.html
```

---

## 🎯 Cara Kerja Routing

### Hash Routing
Ketika Anda mengakses URL dengan hash (misalnya `#new-transaction`):

1. **File [dashboard.html](dashboard.html)** di root akan mendeteksi hash
2. **JavaScript** akan redirect ke halaman yang sesuai
3. **Redirect otomatis** ke `pages/register-wash.html`

### Route Mapping
```javascript
{
    'dashboard': 'pages/dashboard.html',
    'new-transaction': 'pages/register-wash.html',
    'camera-capture': 'pages/camera-capture.html',
    'transactions': 'pages/transactions.html',
    'customers': 'pages/customers.html',
    'operators': 'pages/operators.html',
    'reports': 'pages/reports.html',
    'expenses': 'pages/expenses.html',
    'settings': 'pages/settings.html'
}
```

---

## 📝 File yang Dimodifikasi

### 1. [dashboard.html](dashboard.html) (Root)
File redirect handler untuk menangani hash routing:
- Mendeteksi hash dari URL
- Redirect ke halaman yang tepat di folder `pages/`
- Loading indicator selama redirect

### 2. [pages/dashboard.html](pages/dashboard.html)
Dashboard utama dengan navigasi:
- Menu sidebar dengan hash links
- Handler untuk hash changes
- Integration dengan dashboard.js

### 3. [js/dashboard.js](js/dashboard.js)
JavaScript module dengan global navigateTo function:
- Function `window.navigateTo(page)`
- Smart path detection (root vs pages/)
- Route mapping

### 4. [.htaccess](.htaccess)
Apache configuration:
- URL rewriting rules
- Hash fragment handling
- CORS headers

---

## 🧪 Testing URLs

### Test Semua Route:

**1. Dashboard:**
```
http://localhost/motor-bersih/dashboard.html#dashboard
```

**2. Transaksi Baru:**
```
http://localhost/motor-bersih/dashboard.html#new-transaction
```

**3. Scan Plat Nomor:**
```
http://localhost/motor-bersih/dashboard.html#camera-capture
```

**4. Riwayat Transaksi:**
```
http://localhost/motor-bersih/dashboard.html#transactions
```

**5. Data Pelanggan:**
```
http://localhost/motor-bersih/dashboard.html#customers
```

**6. Operator & Komisi:**
```
http://localhost/motor-bersih/dashboard.html#operators
```

**7. Laporan:**
```
http://localhost/motor-bersih/dashboard.html#reports
```

**8. Pengaturan:**
```
http://localhost/motor-bersih/dashboard.html#settings
```

---

## 🔧 PowerShell Test Script

Buat script untuk test semua URL:

```powershell
# test-routing.ps1
$baseUrl = "http://localhost/motor-bersih/dashboard.html"
$routes = @(
    "dashboard",
    "new-transaction",
    "camera-capture",
    "transactions",
    "customers",
    "operators",
    "reports",
    "settings"
)

foreach ($route in $routes) {
    $url = "$baseUrl#$route"
    Write-Host "Testing: $url" -ForegroundColor Cyan
    Start-Process $url
    Start-Sleep -Seconds 2
}
```

---

## 🎨 Sidebar Navigation

Sidebar di dashboard menggunakan hash links:

```html
<a href="#dashboard">Dashboard</a>
<a href="#new-transaction">Transaksi Baru</a>
<a href="#camera-capture">Scan Plat Nomor</a>
<a href="#transactions">Riwayat Transaksi</a>
<a href="#customers">Data Pelanggan</a>
<a href="#operators">Operator & Komisi</a>
<a href="#reports">Laporan</a>
<a href="#settings">Pengaturan</a>
```

Ketika link diklik:
1. Hash berubah (misalnya menjadi `#customers`)
2. Event `hashchange` triggered
3. Handler memanggil `navigateTo('customers')`
4. Redirect ke `pages/customers.html`

---

## 🚀 Quick Test

Jalankan script test:

```powershell
.\test-routing.ps1
```

Atau test manual di browser:
1. Login ke aplikasi
2. Buka Developer Tools (F12)
3. Di Console, ketik:
   ```javascript
   navigateTo('transactions')
   ```
4. Aplikasi akan redirect ke halaman transactions

---

## 📖 Contoh Penggunaan

### Di HTML (onclick):
```html
<button onclick="navigateTo('new-transaction')">
    Transaksi Baru
</button>
```

### Di JavaScript:
```javascript
// Redirect ke halaman customers
window.navigateTo('customers');

// Redirect ke dashboard
window.navigateTo('dashboard');
```

### Via URL:
```javascript
// Set location dengan hash
window.location.hash = 'transactions';

// atau langsung redirect
window.location.href = 'pages/transactions.html';
```

---

## ⚠️ Troubleshooting

### Hash tidak berfungsi?
1. Clear browser cache
2. Hard reload (Ctrl + Shift + R)
3. Check JavaScript console untuk errors
4. Pastikan dashboard.js ter-load dengan benar

### Redirect loop?
1. Pastikan tidak ada conflicting routes
2. Check `.htaccess` configuration
3. Verify Apache rewrite module enabled

### 404 setelah redirect?
1. Pastikan file target exists di folder `pages/`
2. Check route mapping di dashboard.js
3. Verify file permissions

---

## 📊 Route Status

| Hash | Target File | Status |
|------|-------------|--------|
| `#dashboard` | pages/dashboard.html | ✅ Working |
| `#new-transaction` | pages/register-wash.html | ✅ Working |
| `#camera-capture` | pages/camera-capture.html | ✅ Working |
| `#transactions` | pages/transactions.html | ✅ Working |
| `#customers` | pages/customers.html | ✅ Working |
| `#operators` | pages/operators.html | ✅ Working |
| `#reports` | pages/reports.html | ✅ Working |
| `#settings` | pages/settings.html | ✅ Working |

---

**Semua URL hash routing sekarang berfungsi dengan baik! 🎉**
