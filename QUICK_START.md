# 🚀 QUICK START GUIDE

## ⚡ Get Started in 60 Seconds

### 1. Start XAMPP
```bash
1. Open XAMPP Control Panel
2. Click "Start" on Apache
3. Click "Start" on MySQL
4. Wait for both to show "Running" status
```

### 2. Access the Application
```
Login Page: http://localhost/motor-bersih/
Dashboard: http://localhost/motor-bersih/pages/dashboard.html
Test Suite: http://localhost/motor-bersih/test-suite.html
```

### 3. Login Credentials
```
Username: admin
Password: admin123
Role: admin
```

---

## ✅ What's Available Now

### 🎯 Core Features (All Working)
| Feature | Location | Status |
|---------|----------|--------|
| Login | `/` | ✅ JWT Auth |
| Dashboard | `/pages/dashboard.html` | ✅ Real-time Charts |
| Transactions | `/pages/register-wash.html` | ✅ Multi-step Form |
| Operators | `/pages/operators.html` | ✅ List + Rates |
| Reports | Dashboard Page | ✅ Export/Print |

### 🧪 Testing
| Test | Location | Status |
|------|----------|--------|
| Complete Test Suite | `/test-suite.html` | ✅ 15 Tests |
| API Status | Test Suite | ✅ Live Check |
| Security | Test Suite | ✅ Validated |

### 🔐 Security (All Implemented)
- ✅ JWT Token Authentication
- ✅ Bcrypt Password Hashing
- ✅ CSRF Protection
- ✅ Rate Limiting (5 attempts/5min)
- ✅ Input Validation & Sanitization
- ✅ Security Headers
- ✅ Audit Logging

---

## 🧪 RUN TESTS (Recommended First)

### Option A: Run All Tests at Once
```
1. Open: http://localhost/motor-bersih/test-suite.html
2. Click: "Run All Tests" button
3. Wait: All 15 tests execute (~30 seconds)
4. View: Green ✓ = Pass, Red ✗ = Fail
5. Check: Performance metrics + charts
```

### Option B: Test by Category
```
1. Open test-suite.html
2. Click specific category:
   - "API Tests" (3 tests)
   - "Auth Tests" (4 tests)
   - "Security Tests" (4 tests)
   - "Data Tests" (4 tests)
3. View results for that category
```

### Option C: Run Individual Tests
```
1. Open test-suite.html
2. Click individual test
3. View specific test result
4. Check response time + details
```

---

## 📊 TEST THE DASHBOARD

### Step 1: Login
```
1. Go to: http://localhost/motor-bersih/
2. Enter:
   - Username: admin
   - Password: admin123
   - Role: admin
3. Click: Login
4. Result: Redirected to dashboard
```

### Step 2: View Dashboard Data
```
Dashboard shows:
✅ Total Revenue: IDR 325,000+
✅ Total Transactions: 3+
✅ Total Commission: IDR 50,000+
✅ Total Members: 5
✅ Last 7 Days Revenue: IDR 200,000+
✅ Active Operators: 2

Charts:
✅ Daily Revenue (Line chart)
✅ Motorcycle Types (Doughnut chart)
✅ Operator Commission (Bar chart)
✅ Payment Methods (Pie chart)

Lists:
✅ Recent Transactions (Top 10)
✅ Top Operators (Ranking)
```

### Step 3: Test Auto-Refresh
```
1. Dashboard auto-refreshes every 30 seconds
2. Charts update automatically
3. Stats update in real-time
4. You can toggle auto-refresh on/off
```

---

## 💳 TEST TRANSACTION FORM

### Step 1: Navigate to Form
```
1. From Dashboard, click "Register Wash" or go to:
   http://localhost/motor-bersih/pages/register-wash.html
2. Form has 3 steps visible
```

### Step 2: Fill Step 1 (Vehicle Data)
```
License Plate: B 1234 ABC (Indonesian format)
Motorcycle Type: Select from dropdown
Customer Name: John Doe
Customer Phone: 081234567890
→ Click: Next
```

### Step 3: Fill Step 2 (Service Selection)
```
Wash Type: Select from dropdown
  - Basic: IDR 25,000
  - Standard: IDR 50,000
  - Premium: IDR 100,000
Operator: Select from dropdown
Payment Method: Select method
→ Summary shows calculated amount + commission
→ Click: Confirm
```

### Step 4: Confirm Step 3 (Success)
```
✅ Transaction created successfully
✅ Transaction Code: WASH-XXXXX
✅ Amount: IDR 50,000
✅ Commission: IDR 5,000
✅ Status: Pending
→ Click: "Register Another Wash" to create more
```

---

## 🔍 TEST SECURITY

### Test 1: Rate Limiting
```
1. Go to login page: http://localhost/motor-bersih/
2. Try to login 6 times with wrong password
3. On 6th attempt: Get "Too many login attempts" error (429)
4. Wait 5 minutes to reset the counter
```

### Test 2: SQL Injection Protection
```
1. At login form, try:
   Username: admin' OR '1'='1
   Password: anything
2. Result: Login fails with "Invalid username or password"
3. Check security.log for logged attempt
```

### Test 3: Invalid Token
```
1. Login successfully with admin / admin123
2. In browser console, open DevTools (F12)
3. Go to Application → Cookies
4. Find "auth_token" cookie
5. Modify it (change one character)
6. Refresh page
7. Result: Token rejected, redirect to login
```

### Test 4: CSRF Protection
```
1. Test suite automatically tests CSRF
2. CSRF tokens generated for all forms
3. Check logs for CSRF validation attempts
```

---

## 📊 CHECK DATABASE

### Option 1: Via PHPMyAdmin
```
1. Go to: http://localhost/phpmyadmin/
2. Login with:
   - Username: root
   - Password: (usually blank)
3. Database: motowash_db
4. Tables:
   - users (Demo users)
   - customers (Wash customers)
   - operators (Staff)
   - transactions (All transactions)
   - commissions (Tracking)
   - audit_logs (Security events)
```

### Option 2: Via Test Suite
```
1. Open: http://localhost/motor-bersih/test-suite.html
2. Run "Database Connection" test
3. Shows table count and connection status
4. Verifies all tables exist
```

### Option 3: Check Security Log
```
Path: C:\xampp\htdocs\motor-bersih\logs\security.log

Contains:
- Login attempts (success/failure)
- Rate limit violations
- SQL injection attempts
- Invalid tokens
- CSRF violations
- All timestamps and IPs
```

---

## 🐛 TROUBLESHOOTING

### Problem: "Cannot reach API"
**Solution**:
1. Check XAMPP Apache is running
2. Check MySQL is running
3. Go to: http://localhost/motor-bersih/test-suite.html
4. Run "API Status" test
5. Look at error details

### Problem: "Login Failed"
**Solution**:
1. Verify credentials: admin / admin123
2. Check database is running (MySQL)
3. Go to PHPMyAdmin and check users table
4. Try test user: operator1 / op123

### Problem: "Charts Not Showing"
**Solution**:
1. Check browser console (F12)
2. Go to Network tab, refresh page
3. Look for failed API calls
4. Run test suite to check API endpoints

### Problem: "Transaction Won't Submit"
**Solution**:
1. Check all form fields are filled correctly
2. License plate must be Indonesian format (e.g., B 1234 ABC)
3. Check browser console for errors
4. Run "Transaction CRUD" test in test suite

---

## 📈 PERFORMANCE CHECKS

### API Response Times
```
Expected:
- Auth login: < 100ms
- Dashboard load: < 200ms
- Transaction submit: < 150ms
- Chart rendering: < 500ms

Check in:
Test Suite → View "Response Time" chart
```

### Database Performance
```
Check:
- Transaction count: 5+ records
- Users count: 3 demo users
- Operators count: 2+ operators
- Commission tracking: Automatic

Via: PHPMyAdmin or Test Suite
```

---

## 🎓 KEY POINTS TO REMEMBER

1. **JWT Tokens**: Valid for 24 hours, then auto-logout
2. **Rate Limiting**: 5 attempts per 5 minutes on login
3. **Commission**: Auto-calculated based on operator rate
4. **License Plate**: Must be Indonesian format (B 1234 ABC)
5. **Transaction Code**: Auto-generated, unique per transaction
6. **Auto-Refresh**: Dashboard updates every 30 seconds
7. **Security Log**: All events logged to `/logs/security.log`
8. **Passwords**: Admin user has bcrypt hashing enabled
9. **CSRF**: All forms protected with CSRF tokens
10. **Audit Trail**: Complete history in database audit_logs table

---

## 🔑 API ENDPOINTS QUICK REFERENCE

```
POST   /api/auth.php              - Login (get JWT token)
GET    /api/auth.php              - Verify token (with Bearer)
GET    /api/dashboard.php          - Get dashboard stats
GET    /api/transactions.php       - List transactions
POST   /api/transactions.php       - Create transaction
PUT    /api/transactions.php/<id>  - Update transaction
DELETE /api/transactions.php/<id>  - Delete transaction
GET    /api/status.php             - Health check

All endpoints require Authorization: Bearer <jwt_token>
All endpoints enforce rate limiting
All endpoints log security events
```

---

## ✅ VERIFICATION CHECKLIST

After running tests, verify:

- [ ] All 15 tests pass (green checkmarks)
- [ ] Login works with admin / admin123
- [ ] Dashboard displays real data
- [ ] Charts render with data points
- [ ] Transaction form 3-step flow works
- [ ] Transaction submission succeeds
- [ ] Rate limiting blocks after 5 attempts
- [ ] Security log contains entries
- [ ] No console errors (F12 → Console tab)
- [ ] Auto-refresh works on dashboard

---

## 📞 SUPPORT RESOURCES

| Need | Location |
|------|----------|
| Full Documentation | `IMPLEMENTATION_COMPLETE.md` |
| API Reference | `api/README.md` |
| Code Structure | `/` root directory |
| Test Results | Test Suite page |
| Logs | `/logs/security.log` |
| Database | PHPMyAdmin (localhost/phpmyadmin) |

---

## 🎉 YOU'RE ALL SET!

The Motor Bersih POS system is **100% complete and ready to use**.

**Next Steps**:
1. ✅ Run test suite to verify everything works
2. ✅ Login and explore the dashboard
3. ✅ Create test transactions
4. ✅ Check security logging
5. ✅ Deploy to production when ready

**Enjoy using Motor Bersih! 🚗✨**

---

Last Updated: January 16, 2026
Status: ✅ Production Ready
