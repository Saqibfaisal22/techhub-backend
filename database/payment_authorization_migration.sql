-- ============================================
-- PAYMENT AUTHORIZATION DATABASE MIGRATION
-- Run this SQL in phpMyAdmin or MySQL Workbench
-- ============================================

-- Step 1: Add stripe_payment_id column (if not exists)
ALTER TABLE `orders` 
ADD COLUMN IF NOT EXISTS `stripe_payment_id` VARCHAR(255) NULL 
AFTER `payment_reference`;

-- Step 2: Verify column was added
DESCRIBE `orders`;

-- Step 3: Check if payment_status enum needs update
-- Current values should include: pending, paid, cancelled, failed
ALTER TABLE `orders` 
MODIFY COLUMN `payment_status` 
ENUM('pending', 'paid', 'cancelled', 'failed', 'processing', 'refunded') 
DEFAULT 'pending' NOT NULL;

-- Step 4: Verify payment_status column
SHOW COLUMNS FROM `orders` LIKE 'payment_status';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check orders table structure
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE, 
    COLUMN_DEFAULT,
    COLUMN_TYPE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'techhub_ecommerce' 
  AND TABLE_NAME = 'orders'
  AND COLUMN_NAME IN ('stripe_payment_id', 'payment_status', 'payment_method');

-- Check if any existing orders need updating
SELECT 
    id, 
    order_number, 
    status, 
    payment_status, 
    payment_method,
    stripe_payment_id
FROM orders 
ORDER BY created_at DESC 
LIMIT 10;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
-- If no errors, migration is complete!
-- Now restart your backend server:
-- cd backend
-- node server.js
