-- ================================================
-- Stripe Payment Integration - Database Migration
-- ================================================
-- Run this in your MySQL database

USE techhub_ecommerce;

-- Add stripe_payment_id column to orders table
ALTER TABLE orders 
ADD COLUMN stripe_payment_id VARCHAR(255) NULL 
AFTER payment_reference;

-- Create index for faster lookups
CREATE INDEX idx_orders_stripe_payment_id 
ON orders(stripe_payment_id);

-- Verify the column was added
SHOW COLUMNS FROM orders LIKE 'stripe_payment_id';

SELECT 'Migration completed successfully!' as Status;
