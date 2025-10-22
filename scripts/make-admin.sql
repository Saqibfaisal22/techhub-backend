-- Quick Fix: Make User Admin
-- Run this in your MySQL client (phpMyAdmin, MySQL Workbench, etc.)

-- Step 1: See all users and their roles
SELECT id, email, role, first_name, last_name, is_active 
FROM users;

-- Step 2: Update YOUR user to admin (replace the email with yours)
UPDATE users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';  -- CHANGE THIS EMAIL!

-- Step 3: Verify the change
SELECT id, email, role, first_name, last_name 
FROM users 
WHERE email = 'your-email@example.com';  -- CHANGE THIS EMAIL!

-- Alternative: If you know your user ID (e.g., ID = 1)
-- UPDATE users SET role = 'admin' WHERE id = 1;

-- To make ALL users admin (NOT RECOMMENDED FOR PRODUCTION):
-- UPDATE users SET role = 'admin';
