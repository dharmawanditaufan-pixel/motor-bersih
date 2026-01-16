# Motor Bersih POS - Setup Guide

## Prerequisites
- Windows 7 or later
- XAMPP (with Apache & MySQL)
- Modern web browser (Chrome, Firefox, Edge)

## Installation Steps

### 1. Install XAMPP
- Download from: https://www.apachefriends.org/
- Install to default location: `C:\xampp`
- Select Apache and MySQL components

### 2. Copy Project Files
1. Open File Explorer
2. Navigate to: `C:\xampp\htdocs`
3. Create a new folder called `motor-bersih`
4. Copy all project files into this folder

Your path should be: `C:\xampp\htdocs\motor-bersih`

### 3. Create Database
1. Open XAMPP Control Panel
2. Start **Apache** and **MySQL**
3. Click **Admin** button next to MySQL
4. In phpMyAdmin, create new database: `motowash_db`

OR run the `start-app.bat` script which will do this automatically.

### 4. Run the Application
**Option A: Using Script (Recommended)**
1. Double-click `start-app.bat` in the project folder
2. This will:
   - Start XAMPP services
   - Create database if needed
   - Open the app in browser at `http://localhost/motor-bersih`

**Option B: Manual**
1. Start XAMPP (Apache & MySQL)
2. Open browser: `http://localhost/motor-bersih`

## Demo Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Operator | operator1 | op123 |

## Project Structure

```
motor-bersih/
├── api/                    # PHP API endpoints
│   ├── config.php         # Database config & helpers
│   ├── auth.php           # Authentication
│   ├── dashboard.php      # Dashboard data
│   ├── status.php         # API health check
│   └── transactions.php   # Transaction management
├── pages/                 # HTML pages
│   ├── index.html         # Login page
│   ├── dashboard.html     # Dashboard
│   └── ...                # Other pages
├── js/                    # JavaScript
│   ├── api-client.js      # API wrapper
│   ├── auth.js            # Auth manager
│   ├── dashboard.js       # Dashboard logic
│   └── ...                # Other scripts
├── css/                   # Stylesheets
│   ├── auth.css           # Login styles
│   ├── style.css          # Global styles
│   └── ...                # Other styles
├── data/                  # JSON data files
└── assets/                # Images & fonts
```

## Troubleshooting

### White page on login
- **Check:** Is XAMPP running? (Apache green, MySQL green)
- **Check:** Browser console for errors (F12 > Console tab)
- **Solution:** Restart Apache and MySQL in XAMPP

### Database connection error
- **Check:** Is MySQL started in XAMPP?
- **Check:** Does database `motowash_db` exist in phpMyAdmin?
- **Solution:** Run `check-db.bat` to verify setup

### API endpoints returning 404
- **Check:** Is Apache running?
- **Check:** Is project in `C:\xampp\htdocs\motor-bersih`?
- **Solution:** Verify URL is `http://localhost/motor-bersih/`

### Login not working
- **Check:** API status indicator on login page
- **Check:** Browser console for JavaScript errors
- **Try:** Using demo credentials: `admin` / `admin123`

## API Endpoints

All API endpoints are at: `/api/`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/status.php` | GET | Check API & DB connection |
| `/api/auth.php` | POST | User login |
| `/api/auth.php` | GET | Verify token |
| `/api/dashboard.php` | GET | Dashboard data |
| `/api/transactions.php` | GET/POST | Manage transactions |

## Features

✅ Modern login interface with API status check
✅ Real-time dashboard with statistics
✅ Transaction management
✅ Customer & member tracking
✅ Operator commission calculation
✅ Responsive design
✅ Demo mode (works offline)

## Browser Support

- Chrome 90+
- Firefox 88+
- Edge 90+
- Safari 14+

## For Development

### Check API connectivity
Visit: `http://localhost/motor-bersih/api/status.php`

### View database
1. Open XAMPP Control Panel
2. Click **Admin** next to MySQL
3. phpMyAdmin will open

### Check logs
Logs are stored in: `/logs/api.log`

## Notes

- All demo data is in-memory and resets on restart
- For production, implement proper authentication (JWT)
- Database tables should be created during first setup
- Change default passwords before production use

## Support

For issues, check:
1. XAMPP is running (Apache + MySQL)
2. Database `motowash_db` exists
3. Files are in `C:\xampp\htdocs\motor-bersih`
4. Browser console for JavaScript errors (F12)

---

**Version:** 1.0  
**Last Updated:** January 2026
