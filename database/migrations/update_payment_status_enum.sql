-- Add 'cancelled' to payment_status ENUM
-- This migration updates the payment_status column to include 'cancelled' status

-- For MySQL/MariaDB:
ALTER TABLE orders 
MODIFY COLUMN payment_status ENUM('pending', 'paid', 'failed', 'refunded', 'cancelled') 
DEFAULT 'pending';

-- If the above doesn't work (some MySQL versions), use this approach:
-- Step 1: Add a temporary column
-- ALTER TABLE orders ADD COLUMN payment_status_new ENUM('pending', 'paid', 'failed', 'refunded', 'cancelled') DEFAULT 'pending';
-- 
-- Step 2: Copy data
-- UPDATE orders SET payment_status_new = payment_status;
-- 
-- Step 3: Drop old column
-- ALTER TABLE orders DROP COLUMN payment_status;
-- 
-- Step 4: Rename new column
-- ALTER TABLE orders CHANGE payment_status_new payment_status ENUM('pending', 'paid', 'failed', 'refunded', 'cancelled') DEFAULT 'pending';
