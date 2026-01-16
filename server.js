const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'motor-bersih-secret-key-2026';

// Middleware
app.use(cors());
app.use(express.json());

// Database connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'motowash_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Middleware untuk verifikasi token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Token tidak ditemukan'
        });
    }
    
    const token = authHeader.substring(7);
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token tidak valid atau sudah expired'
        });
    }
};

// ==========================================
// HEALTH CHECK
// ==========================================
app.get('/api/status', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT DATABASE() as db, NOW() as time');
        connection.release();
        
        res.json({
            success: true,
            message: 'API Motor Bersih berjalan',
            database: rows[0].db,
            timestamp: rows[0].time,
            version: '2.0.0'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Database connection failed',
            error: error.message
        });
    }
});

// ==========================================
// AUTHENTICATION
// ==========================================
app.post('/api/auth', async (req, res) => {
    try {
        const { username, password, role } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username dan password harus diisi'
            });
        }
        
        const connection = await pool.getConnection();
        const [users] = await connection.query(
            'SELECT * FROM users WHERE username = ? AND role = ? AND active = 1',
            [username, role || 'admin']
        );
        connection.release();
        
        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Username atau password salah'
            });
        }
        
        const user = users[0];
        
        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Username atau password salah'
            });
        }
        
        // Generate JWT token
        const token = jwt.sign(
            {
                user_id: user.id,
                username: user.username,
                role: user.role,
                name: user.name
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        // Update last login
        await pool.query(
            'UPDATE users SET last_login = NOW() WHERE id = ?',
            [user.id]
        );
        
        res.json({
            success: true,
            message: 'Login berhasil',
            token: token,
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                role: user.role,
                email: user.email
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
        });
    }
});

// ==========================================
// DASHBOARD
// ==========================================
app.get('/api/dashboard', verifyToken, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        // Today's revenue
        const [revenueResult] = await connection.query(`
            SELECT COALESCE(SUM(price), 0) as total
            FROM transactions
            WHERE DATE(created_at) = CURDATE()
        `);
        
        // Today's transactions count
        const [transactionsResult] = await connection.query(`
            SELECT COUNT(*) as count
            FROM transactions
            WHERE DATE(created_at) = CURDATE()
        `);
        
        // Total commission today
        const [commissionResult] = await connection.query(`
            SELECT COALESCE(SUM(commission_amount), 0) as total
            FROM commission
            WHERE DATE(created_at) = CURDATE()
        `);
        
        // Total members
        const [membersResult] = await connection.query(`
            SELECT COUNT(*) as count
            FROM customers
            WHERE is_member = 1
        `);
        
        // Recent transactions
        const [recentTransactions] = await connection.query(`
            SELECT 
                t.id,
                t.transaction_id,
                c.name as customer_name,
                c.license_plate,
                s.name as service_name,
                t.price,
                t.payment_method,
                t.status,
                t.created_at
            FROM transactions t
            LEFT JOIN customers c ON t.customer_id = c.id
            LEFT JOIN services s ON t.service_id = s.id
            ORDER BY t.created_at DESC
            LIMIT 10
        `);
        
        connection.release();
        
        res.json({
            success: true,
            todayRevenue: revenueResult[0].total,
            todayTransactions: transactionsResult[0].count,
            todayCommission: commissionResult[0].total,
            totalMembers: membersResult[0].count,
            recentTransactions: recentTransactions
        });
        
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil data dashboard',
            error: error.message
        });
    }
});

// ==========================================
// TRANSACTIONS
// ==========================================

// Get all transactions
app.get('/api/transactions', verifyToken, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [transactions] = await connection.query(`
            SELECT 
                t.*,
                c.name as customer_name,
                c.license_plate,
                u.name as operator_name,
                s.name as service_name
            FROM transactions t
            LEFT JOIN customers c ON t.customer_id = c.id
            LEFT JOIN users u ON t.operator_id = u.id
            LEFT JOIN services s ON t.service_id = s.id
            ORDER BY t.created_at DESC
        `);
        connection.release();
        
        res.json({
            success: true,
            data: transactions
        });
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil data transaksi',
            error: error.message
        });
    }
});

// Create new transaction
app.post('/api/transactions', verifyToken, async (req, res) => {
    try {
        const {
            operator_id,
            customer_name,
            license_plate,
            phone,
            wash_type,
            price,
            payment_method
        } = req.body;
        
        const connection = await pool.getConnection();
        
        // Check or create customer
        let [customers] = await connection.query(
            'SELECT id FROM customers WHERE license_plate = ?',
            [license_plate]
        );
        
        let customerId;
        if (customers.length === 0) {
            const [result] = await connection.query(
                'INSERT INTO customers (name, license_plate, phone) VALUES (?, ?, ?)',
                [customer_name, license_plate, phone]
            );
            customerId = result.insertId;
        } else {
            customerId = customers[0].id;
        }
        
        // Generate transaction ID
        const transactionId = 'TRX' + Date.now();
        
        // Insert transaction
        const [txResult] = await connection.query(`
            INSERT INTO transactions (
                transaction_id, customer_id, operator_id, 
                wash_type, price, payment_method, status
            ) VALUES (?, ?, ?, ?, ?, ?, 'completed')
        `, [transactionId, customerId, operator_id || req.user.user_id, wash_type, price, payment_method]);
        
        connection.release();
        
        res.json({
            success: true,
            message: 'Transaksi berhasil dibuat',
            transaction_id: transactionId,
            id: txResult.insertId
        });
        
    } catch (error) {
        console.error('Create transaction error:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal membuat transaksi',
            error: error.message
        });
    }
});

// ==========================================
// ERROR HANDLER
// ==========================================
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// ==========================================
// START SERVER
// ==========================================
app.listen(PORT, () => {
    console.log(`✅ Motor Bersih API Server running on port ${PORT}`);
    console.log(`🔗 http://localhost:${PORT}/api/status`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing server...');
    await pool.end();
    process.exit(0);
});
