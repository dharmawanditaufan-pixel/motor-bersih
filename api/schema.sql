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
  `whatsapp_number` VARCHAR(15),
  `email` VARCHAR(100),
  `motorcycle_type` ENUM('motor_kecil', 'motor_sedang', 'motor_besar') DEFAULT 'motor_kecil',
  `motorcycle_brand` VARCHAR(50),
  `photo_url` VARCHAR(255),
  `is_member` BOOLEAN DEFAULT false,
  `member_points` INT DEFAULT 0,
  `loyalty_count` INT DEFAULT 0 COMMENT 'Jumlah cuci, setiap 5x dapat gratis 1x',
  `total_washes` INT DEFAULT 0,
  `last_wash_date` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_license_plate` (`license_plate`),
  INDEX `idx_is_member` (`is_member`),
  INDEX `idx_phone` (`phone`),
  INDEX `idx_whatsapp_number` (`whatsapp_number`)
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
-- OPERATOR ATTENDANCE TABLE
-- ============================================================
CREATE TABLE `operator_attendance` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `operator_id` INT NOT NULL,
  `date` DATE NOT NULL,
  `check_in` TIME NULL,
  `check_out` TIME NULL,
  `status` ENUM('present', 'absent', 'late', 'leave') DEFAULT 'present',
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`operator_id`) REFERENCES `operators` (`id`) ON DELETE CASCADE,
  INDEX `idx_operator_id` (`operator_id`),
  INDEX `idx_date` (`date`),
  INDEX `idx_status` (`status`),
  UNIQUE KEY `unique_attendance` (`operator_id`, `date`)
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
INSERT INTO `customers` (`license_plate`, `name`, `phone`, `whatsapp_number`, `motorcycle_type`, `motorcycle_brand`, `is_member`, `loyalty_count`, `total_washes`) VALUES
('B1234ABC', 'Ahmad Riyadi', '081987654321', '081987654321', 'motor_kecil', 'Honda Beat', true, 3, 5),
('B5678DEF', 'Siti Nurhaliza', '082123456789', '082123456789', 'motor_sedang', 'Yamaha Vixion', false, 1, 2),
('B9012GHI', 'Rudi Hartono', '083456789012', '083456789012', 'motor_besar', 'Kawasaki Ninja', true, 6, 8),
('B3456JKL', 'Diana Putri', '084567890123', '084567890123', 'motor_kecil', 'Honda Scoopy', false, 0, 1),
('B7890MNO', 'Supandi Kusuma', '085678901234', '085678901234', 'motor_besar', 'Honda CBR', true, 2, 12);

-- Insert sample transactions
INSERT INTO `transactions` (`transaction_code`, `customer_id`, `operator_id`, `wash_type`, `amount`, `commission_amount`, `payment_method`, `status`, `created_at`, `completed_at`) VALUES
('TRX001-20250117', 1, 1, 'standard', 15000, 4500, 'cash', 'completed', NOW() - INTERVAL 2 HOUR, NOW() - INTERVAL 1 HOUR),
('TRX002-20250117', 2, 2, 'standard', 20000, 6000, 'transfer', 'completed', NOW() - INTERVAL 3 HOUR, NOW() - INTERVAL 2 HOUR),
('TRX003-20250117', 3, 1, 'standard', 20000, 6000, 'cash', 'completed', NOW() - INTERVAL 4 HOUR, NOW() - INTERVAL 3 HOUR),
('TRX004-20250117', 4, 2, 'standard', 15000, 4500, 'qris', 'in_progress', NOW() - INTERVAL 30 MINUTE, NULL),
('TRX005-20250117', 5, 1, 'standard', 20000, 6000, 'cash', 'pending', NOW() - INTERVAL 15 MINUTE, NULL);

-- Insert commissions
INSERT INTO `commissions` (`operator_id`, `transaction_id`, `amount`, `status`, `paid_date`) VALUES
(1, 1, 4500, 'paid', NOW() - INTERVAL 1 DAY),
(2, 2, 6000, 'paid', NOW() - INTERVAL 1 DAY),
(1, 3, 6000, 'paid', NOW() - INTERVAL 1 DAY),
(2, 4, 4500, 'pending', NULL),
(1, 5, 6000, 'pending', NULL);

-- Insert operator attendance (sample data for current month)
INSERT INTO `operator_attendance` (`operator_id`, `date`, `check_in`, `check_out`, `status`) VALUES
(1, CURDATE() - INTERVAL 7 DAY, '08:00:00', '17:00:00', 'present'),
(1, CURDATE() - INTERVAL 6 DAY, '08:15:00', '17:05:00', 'late'),
(1, CURDATE() - INTERVAL 5 DAY, '08:00:00', '17:00:00', 'present'),
(1, CURDATE() - INTERVAL 4 DAY, NULL, NULL, 'absent'),
(1, CURDATE() - INTERVAL 3 DAY, '08:00:00', '17:00:00', 'present'),
(1, CURDATE() - INTERVAL 2 DAY, '08:00:00', '17:00:00', 'present'),
(1, CURDATE() - INTERVAL 1 DAY, '08:00:00', '17:00:00', 'present'),
(2, CURDATE() - INTERVAL 7 DAY, '08:00:00', '17:00:00', 'present'),
(2, CURDATE() - INTERVAL 6 DAY, '08:00:00', '17:00:00', 'present'),
(2, CURDATE() - INTERVAL 5 DAY, '08:00:00', '16:00:00', 'present'),
(2, CURDATE() - INTERVAL 4 DAY, '08:00:00', '17:00:00', 'present'),
(2, CURDATE() - INTERVAL 3 DAY, NULL, NULL, 'leave'),
(2, CURDATE() - INTERVAL 2 DAY, '08:00:00', '17:00:00', 'present'),
(2, CURDATE() - INTERVAL 1 DAY, '08:30:00', '17:00:00', 'late');

-- Insert application settings
INSERT INTO `settings` (`key`, `value`, `description`) VALUES
('app_name', 'Motor Bersih POS', 'Nama aplikasi'),
('app_version', '2.0', 'Versi aplikasi'),
('currency', 'IDR', 'Mata uang'),
('commission_rate_default', '30', 'Komisi default operator (persen)'),
('motor_kecil_price', '15000', 'Harga cuci motor kecil'),
('motor_sedang_price', '20000', 'Harga cuci motor sedang'),
('motor_besar_price', '20000', 'Harga cuci motor besar'),
('loyalty_free_wash', '5', 'Cuci gratis setiap N kali cuci'),
('member_discount_rate', '0', 'Diskon member (persen)'),
('daily_closing_time', '22:00', 'Waktu tutup harian'),
('timezone', 'Asia/Jakarta', 'Zona waktu'),
('whatsapp_notification', '1', 'Aktifkan notifikasi WhatsApp');

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
  c.motorcycle_brand,
  c.is_member,
  c.loyalty_count,
  COUNT(t.id) as total_washes,
  SUM(t.amount) as total_spent,
  MAX(t.completed_at) as last_wash_date,
  MIN(t.created_at) as first_wash_date,
  CASE 
    WHEN c.loyalty_count >= 5 THEN 1 
    ELSE 0 
  END as has_free_wash
FROM customers c
LEFT JOIN transactions t ON c.id = t.customer_id AND t.status = 'completed'
GROUP BY c.id, c.name, c.license_plate, c.motorcycle_type, c.motorcycle_brand, c.is_member, c.loyalty_count;

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
