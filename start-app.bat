@echo off
echo ========================================
echo  MOTOR BERSIH POS - APPLICATION LAUNCHER
echo ========================================
echo.

REM Check if XAMPP is installed
if not exist "C:\xampp\xampp-control.exe" (
    echo ERROR: XAMPP not found at C:\xampp
    echo Please install XAMPP first from apachefriends.org
    pause
    exit /b 1
)

echo 1. Starting XAMPP services...
start "" "C:\xampp\xampp-control.exe"

echo.
echo 2. Waiting for services to start...
timeout /t 10 /nobreak > nul

echo.
echo 3. Testing database connection...
"C:\xampp\mysql\bin\mysql.exe" -u root -e "USE motowash_db; SHOW TABLES;" > nul 2>&1

if %errorlevel% equ 0 (
    echo Database: motowash_db ✓ Connected
) else (
    echo Database: motowash_db ✗ Not found
    echo.
    echo Would you like to create the database? (Y/N)
    set /p CREATE_DB=
    
    if /i "%CREATE_DB%"=="Y" (
        call :CREATE_DATABASE
    )
)

echo.
echo 4. Opening application in browser...
start "" "http://localhost/motor-bersih/"

echo.
echo 5. Opening phpMyAdmin...
timeout /t 2 /nobreak > nul
start "" "http://localhost/phpmyadmin/"

echo.
echo ========================================
echo  APPLICATION READY!
echo ========================================
echo.
echo Application URL: http://localhost/motor-bersih/
echo phpMyAdmin: http://localhost/phpmyadmin/
echo.
echo Press any key to exit...
pause > nul
exit /b 0

:CREATE_DATABASE
echo.
echo Creating database motowash_db...
"C:\xampp\mysql\bin\mysql.exe" -u root -e "CREATE DATABASE IF NOT EXISTS motowash_db;"
echo Database created successfully.
exit /b
