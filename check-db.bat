@echo off
echo Checking Motor Bersih database...
echo.

"C:\xampp\mysql\bin\mysql.exe" -u root -e "
USE motowash_db;

SELECT 
    'Database: ' AS ' ',
    DATABASE() AS Database_Name,
    '✓' AS Status
UNION ALL
SELECT 
    'Tables: ',
    COUNT(*) AS Table_Count,
    '✓'
FROM information_schema.tables 
WHERE table_schema = 'motowash_db'
UNION ALL
SELECT 
    CONCAT(t.TABLE_NAME, ': '),
    CONCAT(COUNT(c.COLUMN_NAME), ' columns'),
    '✓'
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON t.TABLE_SCHEMA = c.TABLE_SCHEMA 
    AND t.TABLE_NAME = c.TABLE_NAME
WHERE t.TABLE_SCHEMA = 'motowash_db'
GROUP BY t.TABLE_NAME
ORDER BY 1;
"
