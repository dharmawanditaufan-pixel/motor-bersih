# Motor Bersih POS - Quick Reference Guide

## 🚀 Getting Started

### Current Status
- **Database**: ✅ Complete (motowash_db with 7 tables)
- **APIs**: ✅ Complete (auth, dashboard, transactions)
- **Frontend**: 🔄 In Progress (60% complete)

### Demo Credentials
```
Admin:     admin / admin123
Operator1: operator1 / op123
Operator2: operator2 / op123
```

---

## 🔌 API Endpoints Reference

### Authentication
```
POST /api/auth.php
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123",
  "role": "admin"
}

Response: {
  "success": true,
  "token": "eyJ1c2VyX2lkIjoxLCJ1c2VybmFtZSI6ImFkbWluIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzY4NjIzMDU5fQ==",
  "user": {
    "id": 1,
    "username": "admin",
    "name": "Administrator",
    "role": "admin"
  }
}
```

### Dashboard
```
GET /api/dashboard.php
Authorization: Bearer <token>

Response includes:
- revenue: {total, count, average}
- commission: {total, paid, pending, count}
- status_summary: {pending, in_progress, completed, cancelled}
- payment_methods: {cash, transfer, qris, ewallet}
- motorcycle_types: {matic, sport, bigbike, lainnya}
- top_operators: [{id, name, transactions, commission, revenue}]
- members: {total, active, points}
- recent_transactions: [{id, code, customer, plate, operator, type, amount, status}]
```

### Transactions - Get List
```
GET /api/transactions.php?page=1&limit=20
Authorization: Bearer <token>

Optional parameters:
- status: pending|in_progress|completed|cancelled
- operator_id: <id>
- customer_id: <id>
- start_date: YYYY-MM-DD
- end_date: YYYY-MM-DD
- page: <number>
- limit: <number>
```

### Transactions - Create
```
POST /api/transactions.php
Authorization: Bearer <token>
Content-Type: application/json

{
  "customer_id": 1,
  "operator_id": 1,
  "wash_type": "premium",
  "amount": 100000,
  "payment_method": "cash"
}

Response: {
  "success": true,
  "transaction": {
    "id": 5,
    "transaction_code": "TRX2026011611301234",
    "amount": 100000,
    "commission_amount": 5000,
    "status": "completed"
  }
}
```

### Transactions - Update
```
PUT /api/transactions.php/<id>
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "completed",
  "notes": "Premium wash completed",
  "payment_method": "transfer"
}
```

### Transactions - Delete (Soft Delete)
```
DELETE /api/transactions.php/<id>
Authorization: Bearer <token>
```

---

## 📊 Frontend Integration Status

### Completed
- ✅ api-client.js - Dynamic URL detection
- ✅ auth.js - Login form integration
- ✅ dashboard.js - API data loading methods
- ✅ index.html - Login page

### In Progress
- 🔄 dashboard.js - Real data rendering
- 🔄 Chart updates
- 🔄 Pagination

### Not Started
- ⏳ register-wash.html - Transaction form
- ⏳ Security hardening
- ⏳ Testing suite

---

## 🔧 Development Workflow

### To Test APIs Locally
```powershell
# Login and get token
$body = @{username="admin"; password="admin123"; role="admin"} | ConvertTo-Json
$headers = @{"Content-Type"="application/json"}
$authResp = Invoke-WebRequest -Uri "http://localhost/motor-bersih/api/auth.php" -Method POST -Body $body -Headers $headers
$token = ($authResp.Content | ConvertFrom-Json).token

# Use token for dashboard
$headers2 = @{"Authorization"="Bearer $token"}
$dashResp = Invoke-WebRequest -Uri "http://localhost/motor-bersih/api/dashboard.php" -Method GET -Headers $headers2
$dashResp.Content | ConvertFrom-Json
```

### To Sync Files from Project to XAMPP
```powershell
Copy-Item -Path "d:\PROJECT\motor-bersih\api\*" -Destination "C:\xampp\htdocs\motor-bersih\api\" -Recurse -Force
Copy-Item -Path "d:\PROJECT\motor-bersih\js\*" -Destination "C:\xampp\htdocs\motor-bersih\js\" -Recurse -Force
Copy-Item -Path "d:\PROJECT\motor-bersih\pages\*" -Destination "C:\xampp\htdocs\motor-bersih\pages\" -Recurse -Force
```

---

## 🐛 Common Issues & Solutions

### Issue: "API endpoint not found"
**Solution**: Make sure files are in XAMPP document root at `C:\xampp\htdocs\motor-bersih\`

### Issue: "Token invalid or expired"
**Solution**: Token expires after 24 hours. Login again to get a new token.

### Issue: "Database connection failed"
**Solution**: Check MySQL is running and verify DB credentials in `api/config.php`

### Issue: "Unknown column error in dashboard.php"
**Solution**: This was fixed - ensure you have the updated dashboard.php file

---

## 📱 Browser Testing

### Available URLs
- **Login**: http://localhost/motor-bersih/
- **Dashboard**: http://localhost/motor-bersih/pages/dashboard.html
- **API Status**: http://localhost/motor-bersih/api/status.php

### Supported Browsers
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari 14+

---

## 📈 Database Schema Quick Reference

### Users Table
- `id` (int) - Primary key
- `username` (varchar) - Unique username
- `password` (varchar) - Password (bcrypt Phase 2)
- `name` (varchar) - Full name
- `role` (enum) - admin | operator
- `active` (boolean) - Active status
- `created_at` (timestamp)

### Transactions Table
- `id` (int) - Primary key
- `transaction_code` (varchar) - Unique code
- `customer_id` (int) - FK to customers
- `operator_id` (int) - FK to operators
- `wash_type` (enum) - basic | standard | premium
- `amount` (decimal) - Transaction amount
- `commission_amount` (decimal) - Commission calculated
- `payment_method` (enum) - cash | transfer | qris | ewallet
- `status` (enum) - pending | in_progress | completed | cancelled
- `created_at` (timestamp)

### Customers Table
- `id` (int)
- `name` (varchar)
- `license_plate` (varchar)
- `motorcycle_type` (enum)
- `phone` (varchar)
- `total_washes` (int)
- `member_points` (int)
- `created_at` (timestamp)

---

## 🎯 Next Priorities

1. **Test Dashboard Loading** (15 mins)
   - Open dashboard.html
   - Verify data loads from API
   - Check chart rendering

2. **Transaction Form Integration** (1-2 hours)
   - Update register-wash.html
   - Add form submission handler
   - Test transaction creation

3. **Security Hardening** (2-3 hours)
   - Implement bcrypt hashing
   - Add JWT tokens
   - Input validation

4. **Complete Testing** (2-3 hours)
   - Full flow testing
   - Security testing
   - Cross-browser testing

---

**Last Updated**: 2026-01-16 11:30 UTC+7
**Current Phase**: 2 (API Integration & Frontend Development)
**Estimated Completion**: 2026-01-17 (16-18 hours total)
