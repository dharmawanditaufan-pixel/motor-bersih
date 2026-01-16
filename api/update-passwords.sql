-- Update users table with correct password hashes for demo accounts
-- admin/admin123, operator1/op123, operator2/op456

USE motowash_db;

-- Admin user
UPDATE users SET password = '$2y$10$1mVdiMo/dTBjlQ4SyteM4OLNJHJW.TFA47FS/yAgPDDsVGdTFRmXG' WHERE username = 'admin';

-- Operator1 user  
UPDATE users SET password = '$2y$10$FJzKv4qU0wzLSmILxZDWt.DDsYQIbstybI35V3tCetJCFZiwMcB9W' WHERE username = 'operator1';

-- Operator2 user
UPDATE users SET password = '$2y$10$bUDAP2s0nr4gpbNuHp0aTeaxa8KBDrMmku9AkH.esbW.72NsVLSkK' WHERE username = 'operator2';

-- Verify update
SELECT id, username, role, active, 
       CONCAT('Password hash updated: ', SUBSTRING(password, 1, 20), '...') as password_status
FROM users;
