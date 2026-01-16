-- ============================================================
-- MOTOR BERSIH POS - DATABASE SCHEMA
-- Created: January 16, 2026
-- Database: motowash_db
-- ============================================================

-- ============================================================
-- CREATE DATABASE
-- ============================================================
DROP DATABASE IF EXISTS `motowash_db`;
CREATE DATABASE `motowash_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `motowash_db`;

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE `users` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `username` VARCHAR(50) UNIQUE NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `role` ENUM('admin', 'operator') DEFAULT 'operator',
  `email` VARCHAR(100),
  `phone` VARCHAR(15),
  `active` BOOLEAN DEFAULT true,
  `last_login` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_username` (`username`),
  INDEX `idx_role` (`role`),
  INDEX `idx_active` (`active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- CUSTOMERS TABLE
-- ============================================================
CREATE TABLE `customers` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `license_plate` VARCHAR(20) UNIQUE NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(15),
  `email` VARCHAR(100),
  `motorcycle_type` ENUM('matic', 'sport', 'bigbike', 'lainnya') DEFAULT 'matic',
  `is_member` BOOLEAN DEFAULT false,
  `member_points` INT DEFAULT 0,
  `total_washes` INT DEFAULT 0,
  `last_wash_date` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_license_plate` (`license_plate`),
  INDEX `idx_is_member` (`is_member`),
  INDEX `idx_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- OPERATORS TABLE
-- ============================================================
CREATE TABLE `operators` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(15),
  `commission_rate` DECIMAL(5,2) DEFAULT 30.00,
  `status` ENUM('active', 'inactive', 'on_leave') DEFAULT 'active',
  `bank_name` VARCHAR(50),
  `bank_account` VARCHAR(50),
  `total_commission` DECIMAL(15,2) DEFAULT 0,
  `total_washes` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TRANSACTIONS TABLE
-- ============================================================
CREATE TABLE `transactions` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `transaction_code` VARCHAR(20) UNIQUE NOT NULL,
  `customer_id` INT NOT NULL,
  `operator_id` INT NOT NULL,
  `wash_type` ENUM('basic', 'standard', 'premium') DEFAULT 'standard',
  `service_duration` INT DEFAULT 30,
  `amount` DECIMAL(10,2) NOT NULL,
  `commission_amount` DECIMAL(10,2) DEFAULT 0,
  `payment_method` ENUM('cash', 'transfer', 'qris', 'ewallet') DEFAULT 'cash',
  `status` ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `completed_at` TIMESTAMP NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`operator_id`) REFERENCES `operators` (`id`) ON DELETE RESTRICT,
  INDEX `idx_transaction_code` (`transaction_code`),
  INDEX `idx_customer_id` (`customer_id`),
  INDEX `idx_operator_id` (`operator_id`),
  INDEX `idx_created_at` (`created_at`),
  INDEX `idx_status` (`status`),
  INDEX `idx_payment_method` (`payment_method`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- COMMISSIONS TABLE
-- ============================================================
CREATE TABLE `commissions` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `operator_id` INT NOT NULL,
  `transaction_id` INT NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `status` ENUM('pending', 'paid', 'cancelled') DEFAULT 'pending',
  `paid_date` TIMESTAMP NULL,
  `payment_notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`operator_id`) REFERENCES `operators` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE CASCADE,
  INDEX `idx_operator_id` (`operator_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SETTINGS TABLE
-- ============================================================
CREATE TABLE `settings` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `key` VARCHAR(50) UNIQUE NOT NULL,
  `value` LONGTEXT,
  `description` VARCHAR(255),
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- AUDIT LOG TABLE
-- ============================================================
CREATE TABLE `audit_logs` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT,
  `action` VARCHAR(100),
  `table_name` VARCHAR(50),
  `record_id` INT,
  `old_values` JSON,
  `new_values` JSON,
  `ip_address` VARCHAR(45),
  `user_agent` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_created_at` (`created_at`),
  INDEX `idx_action` (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- INSERT INITIAL DATA
-- ============================================================

-- Insert users (passwords should be hashed in production)
INSERT INTO `users` (`username`, `password`, `name`, `role`, `email`, `phone`) VALUES
('admin', '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/TVG2', 'Admin User', 'admin', 'admin@motobersih.local', '081234567890'),
('operator1', '$2y$10$V9T4iyVsEp8JJ3H2QKVXUOdWqNRHvXXvZwWN3nZQvGvGYRq6vMkPq', 'Budi Santoso', 'operator', 'budi@motobersih.local', '081234567891'),
('operator2', '$2y$10$m7rIKP.T/3vG0kS4V6vhZeqMN8rC3dK0zV1dL5tQ9uW8xN4pY2kLq', 'Andi Wijaya', 'operator', 'andi@motobersih.local', '081234567892');

-- Insert operators
INSERT INTO `operators` (`user_id`, `name`, `phone`, `commission_rate`, `status`, `bank_name`, `bank_account`) VALUES
(2, 'Budi Santoso', '081234567891', 30.00, 'active', 'BCA', '1234567890'),
(3, 'Andi Wijaya', '081234567892', 30.00, 'active', 'Mandiri', '9876543210');

-- Insert sample customers
INSERT INTO `customers` (`license_plate`, `name`, `phone`, `email`, `motorcycle_type`, `is_member`, `total_washes`) VALUES
('B1234ABC', 'Ahmad Riyadi', '081987654321', 'ahmad@email.com', 'matic', true, 5),
('B5678DEF', 'Siti Nurhaliza', '082123456789', 'siti@email.com', 'sport', false, 2),
('B9012GHI', 'Rudi Hartono', '083456789012', 'rudi@email.com', 'bigbike', true, 8),
('B3456JKL', 'Diana Putri', '084567890123', 'diana@email.com', 'matic', false, 1),
('B7890MNO', 'Supandi Kusuma', '085678901234', 'supandi@email.com', 'bigbike', true, 12);

-- Insert sample transactions
INSERT INTO `transactions` (`transaction_code`, `customer_id`, `operator_id`, `wash_type`, `amount`, `commission_amount`, `payment_method`, `status`, `created_at`, `completed_at`) VALUES
('TRX001-20250116', 1, 1, 'premium', 150000, 45000, 'cash', 'completed', NOW() - INTERVAL 2 HOUR, NOW() - INTERVAL 1 HOUR),
('TRX002-20250116', 2, 2, 'standard', 100000, 30000, 'transfer', 'completed', NOW() - INTERVAL 3 HOUR, NOW() - INTERVAL 2 HOUR),
('TRX003-20250116', 3, 1, 'basic', 75000, 22500, 'cash', 'completed', NOW() - INTERVAL 4 HOUR, NOW() - INTERVAL 3 HOUR),
('TRX004-20250116', 4, 2, 'standard', 100000, 30000, 'qris', 'in_progress', NOW() - INTERVAL 30 MINUTE, NULL),
('TRX005-20250116', 5, 1, 'premium', 150000, 45000, 'cash', 'pending', NOW() - INTERVAL 15 MINUTE, NULL);

-- Insert commissions
INSERT INTO `commissions` (`operator_id`, `transaction_id`, `amount`, `status`, `paid_date`) VALUES
(1, 1, 45000, 'paid', NOW() - INTERVAL 1 DAY),
(2, 2, 30000, 'paid', NOW() - INTERVAL 1 DAY),
(1, 3, 22500, 'paid', NOW() - INTERVAL 1 DAY),
(2, 4, 30000, 'pending', NULL),
(1, 5, 45000, 'pending', NULL);

-- Insert application settings
INSERT INTO `settings` (`key`, `value`, `description`) VALUES
('app_name', 'Motor Bersih POS', 'Nama aplikasi'),
('app_version', '2.0', 'Versi aplikasi'),
('currency', 'IDR', 'Mata uang'),
('commission_rate_default', '30', 'Komisi default operator (persen)'),
('basic_wash_price', '75000', 'Harga cuci dasar'),
('standard_wash_price', '100000', 'Harga cuci standar'),
('premium_wash_price', '150000', 'Harga cuci premium'),
('member_discount_rate', '10', 'Diskon member (persen)'),
('daily_closing_time', '22:00', 'Waktu tutup harian'),
('timezone', 'Asia/Jakarta', 'Zona waktu');

-- ============================================================
-- VIEWS FOR EASY QUERIES
-- ============================================================

-- Dashboard Summary View
CREATE VIEW `v_dashboard_summary` AS
SELECT
  (SELECT COUNT(*) FROM transactions WHERE DATE(created_at) = CURDATE()) as transactions_today,
  (SELECT COUNT(*) FROM customers WHERE is_member = true) as total_members,
  (SELECT COUNT(*) FROM operators WHERE status = 'active') as active_operators,
  (SELECT SUM(amount) FROM transactions WHERE DATE(created_at) = CURDATE()) as revenue_today,
  (SELECT SUM(commission_amount) FROM transactions WHERE DATE(created_at) = CURDATE()) as commission_today;

-- Operator Performance View
CREATE VIEW `v_operator_performance` AS
SELECT
  o.id,
  o.name,
  COUNT(t.id) as total_transactions,
  SUM(t.amount) as total_revenue,
  SUM(t.commission_amount) as total_commission,
  AVG(t.service_duration) as avg_duration_minutes,
  (SELECT COUNT(*) FROM commissions WHERE operator_id = o.id AND status = 'paid') as paid_commissions,
  (SELECT SUM(amount) FROM commissions WHERE operator_id = o.id AND status = 'pending') as pending_commission
FROM operators o
LEFT JOIN transactions t ON o.id = t.operator_id
GROUP BY o.id, o.name;

-- Customer Statistics View
CREATE VIEW `v_customer_statistics` AS
SELECT
  c.id,
  c.name,
  c.license_plate,
  c.motorcycle_type,
  c.is_member,
  COUNT(t.id) as total_washes,
  SUM(t.amount) as total_spent,
  MAX(t.completed_at) as last_wash_date,
  MIN(t.created_at) as first_wash_date
FROM customers c
LEFT JOIN transactions t ON c.id = t.customer_id AND t.status = 'completed'
GROUP BY c.id, c.name, c.license_plate, c.motorcycle_type, c.is_member;

-- ============================================================
-- BACKUP INFORMATION
-- ============================================================
-- To backup this database:
-- mysqldump -u root -p motowash_db > motowash_db_backup.sql
--
-- To restore from backup:
-- mysql -u root -p motowash_db < motowash_db_backup.sql
-- ============================================================

-- Note: Password hashes in users table are bcrypt hashes for:
-- admin / admin123
-- operator1 / operator123
-- operator2 / operator123
