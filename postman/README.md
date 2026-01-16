# 🚀 Motor Bersih POS - Postman Collection

## 📦 Apa yang Ada di Sini?

Folder ini berisi Postman Collection dan Environment untuk testing Motor Bersih API dengan mudah.

### Files:
1. **Motor-Bersih-API.postman_collection.json** - API collection lengkap
2. **Motor-Bersih.postman_environment.json** - Environment variables
3. **README.md** - Panduan ini

---

## 🎯 Quick Start

### 1. Import ke Postman

#### Via Postman Desktop App:
1. Buka Postman
2. Klik **Import** (tombol di kiri atas)
3. Drag & drop file JSON atau klik **Upload Files**
4. Select kedua file:
   - `Motor-Bersih-API.postman_collection.json`
   - `Motor-Bersih.postman_environment.json`
5. Klik **Import**

#### Via Postman Web:
1. Buka https://web.postman.co/
2. Login ke akun Anda
3. Klik **Import** di workspace
4. Upload kedua file JSON

### 2. Set Environment
1. Di Postman, pilih **"Motor Bersih - Development"** dari dropdown environment (kanan atas)
2. Klik icon mata (👁️) untuk melihat variables
3. Pastikan `base_url` = `http://localhost/motor-bersih`

### 3. Start Testing!
1. Expand collection **"Motor Bersih POS API"**
2. Mulai dari **Authentication > Login - Admin**
3. Klik **Send**
4. Token akan tersimpan otomatis!

---

## 📚 Collection Structure

```
Motor Bersih POS API
├── Authentication
│   ├── Login - Admin          ✓ Auto-save token
│   ├── Login - Operator        ✓ Auto-save token
│   ├── Login - Invalid         ✗ Test error handling
│   └── Verify Token (GET)      ✓ Check token validity
│
├── Dashboard
│   └── Get Dashboard Data      📊 Stats & recent transactions
│
├── Transactions
│   ├── Get All Transactions    📋 List semua transaksi
│   ├── Create Transaction      ➕ Buat transaksi baru
│   ├── Get Transaction by ID   🔍 Detail transaksi
│   ├── Update Transaction      ✏️ Update transaksi
│   └── Delete Transaction      🗑️ Hapus transaksi
│
└── System
    ├── API Status Check        ❤️ Health check
    └── Database Test           🗄️ DB connection test
```

---

## 🔐 Authentication Flow

### Automatic Token Management:

1. **Login** (POST /api/auth.php)
   ```json
   {
       "username": "admin",
       "password": "admin123",
       "role": "admin"
   }
   ```
   ✅ Response includes token → **Auto-saved to environment**

2. **All Subsequent Requests**
   - Header otomatis: `Authorization: Bearer {{auth_token}}`
   - Token diambil dari environment variable
   - Tidak perlu copy-paste manual!

3. **Token Verification** (GET /api/auth.php)
   - Check apakah token masih valid
   - Response includes user data

---

## 🧪 Test Scripts

Setiap request dilengkapi dengan **automated tests**:

### Example Tests:
```javascript
// Status code check
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

// Response validation
pm.test("Login successful", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.success).to.eql(true);
});

// Auto-save token
if (jsonData.token) {
    pm.environment.set("auth_token", jsonData.token);
}
```

### View Test Results:
- Test results muncul di tab **"Test Results"** (bawah response)
- ✅ Passed tests = hijau
- ❌ Failed tests = merah dengan detail error

---

## 🎨 Features

### ✨ Automated Features:

1. **Auto Token Storage**
   - Login sekali, token tersimpan
   - Semua request protected otomatis authenticated

2. **Response Validation**
   - Setiap response di-validate otomatis
   - Checks: status code, JSON structure, data integrity

3. **Error Handling Tests**
   - Test invalid credentials
   - Test missing required fields
   - Test expired tokens

4. **Transaction ID Tracking**
   - Create transaction → ID tersimpan
   - Get/Update/Delete menggunakan ID yang sama

5. **Console Logging**
   - Lihat response details di Console tab
   - Token info, stats, response time

---

## 🔧 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `base_url` | API base URL | `http://localhost/motor-bersih` |
| `auth_token` | JWT token (auto-saved) | `eyJ0eXAiOiJKV1QiLCJhbG...` |
| `last_transaction_id` | Last created transaction (auto-saved) | `TRX20260116001` |
| `api_version` | API version | `v1` |

### How to View/Edit:
1. Klik icon mata (👁️) di kanan atas
2. Atau klik **Environments** tab
3. Select environment
4. Edit values as needed

---

## 📖 Usage Examples

### Workflow 1: Complete Testing Flow

1. **System Check**
   ```
   System > API Status Check
   ```
   ✓ Verify API is online

2. **Login**
   ```
   Authentication > Login - Admin
   ```
   ✓ Get token

3. **Get Dashboard**
   ```
   Dashboard > Get Dashboard Data
   ```
   ✓ View stats

4. **Create Transaction**
   ```
   Transactions > Create Transaction
   ```
   ✓ ID auto-saved

5. **View Transaction**
   ```
   Transactions > Get Transaction by ID
   ```
   ✓ Uses saved ID

### Workflow 2: Debug Failed Login

1. Run: **Authentication > Login - Invalid**
2. Check response:
   - Status: 401 or 200 with `success: false`
   - Message: Error description
3. Check Console for details

### Workflow 3: Test Dashboard Issue

1. Login first to get token
2. Run: **Dashboard > Get Dashboard Data**
3. Check Test Results tab:
   - Is status 200? ✓
   - Is stats object present? ✓
   - Is data valid? ✓
4. View Console for detailed response

---

## 🐛 Debugging dengan Postman

### Common Issues:

#### ❌ Error: "auth_token not found"
**Solution:**
1. Run **Authentication > Login - Admin** first
2. Check environment variables (👁️ icon)
3. Verify token is saved

#### ❌ Error: 404 Not Found
**Solution:**
1. Check `base_url` in environment
2. Verify XAMPP is running
3. Test: http://localhost/motor-bersih/api/status.php in browser

#### ❌ Error: Unauthorized (401)
**Solution:**
1. Token expired? Re-login
2. Check Authorization header
3. Run **Authentication > Verify Token**

#### ❌ Error: Database connection failed
**Solution:**
1. Run **System > Database Test**
2. Check MySQL is running in XAMPP
3. Verify database config in `api/config.php`

---

## 🔥 Pro Tips

### 1. Collection Runner
Run all tests at once:
1. Click **Collections**
2. Click **...** next to collection name
3. Select **Run collection**
4. View automated test results

### 2. Response Visualization
View formatted response:
- **Pretty** tab: Formatted JSON
- **Raw** tab: Raw response
- **Preview** tab: HTML preview (if applicable)

### 3. Save Examples
Save good responses as examples:
1. Send request
2. Click **Save Response**
3. Choose **Save as example**
4. Useful for documentation!

### 4. Generate Code
Convert to code:
1. Click **Code** (</> icon)
2. Select language (cURL, PHP, JavaScript, etc.)
3. Copy & use in your app!

### 5. Monitor API
Setup monitoring:
1. Click **Monitors** in Postman
2. Create new monitor
3. Schedule automated tests
4. Get alerts on failures

---

## 📊 Testing Checklist

### ✅ Before Starting:
- [ ] XAMPP running (Apache + MySQL)
- [ ] Database `motowash_db` exists
- [ ] Postman installed/accessible
- [ ] Collection & Environment imported
- [ ] Environment selected

### ✅ Basic Tests:
- [ ] API Status Check (200 OK)
- [ ] Database Test (connected)
- [ ] Login Admin (token saved)
- [ ] Verify Token (valid)
- [ ] Get Dashboard Data (stats present)

### ✅ Transaction Tests:
- [ ] Get All Transactions (list retrieved)
- [ ] Create Transaction (ID saved)
- [ ] Get Transaction by ID (details present)
- [ ] Update Transaction (success)
- [ ] Delete Transaction (success)

### ✅ Error Handling:
- [ ] Login with invalid credentials (fails properly)
- [ ] Request without token (401)
- [ ] Request with expired token (401)

---

## 🚀 Alternative: PowerShell Testing

Jika tidak mau pakai Postman, gunakan PowerShell script:

```powershell
# test-api.ps1
.\test-api-complete.ps1
```

Postman lebih visual, PowerShell lebih scriptable.

---

## 📝 Notes

- **Token Expiry:** Tokens expire after 1 hour (3600 seconds)
- **Rate Limiting:** Not implemented yet (can test rapidly)
- **CORS:** Enabled via .htaccess
- **SSL:** Not configured (using HTTP not HTTPS)

---

## 🆘 Help & Support

### Documentation:
- [FIX_404_ERRORS.md](../FIX_404_ERRORS.md) - API file issues
- [ROUTING_GUIDE.md](../ROUTING_GUIDE.md) - Frontend routing
- [DEBUG_GUIDE.md](../DEBUG_GUIDE.md) - General debugging
- [TROUBLESHOOTING.md](../TROUBLESHOOTING.md) - Common problems

### Postman Resources:
- [Postman Learning Center](https://learning.postman.com/)
- [Postman Collections](https://www.postman.com/collection/)
- [API Testing Guide](https://www.postman.com/api-testing/)

---

**Happy Testing! 🎉**

*Last Updated: January 16, 2026*
