-- Migration to add Stripe payment support
-- Run this script to update existing database

-- Add stripe_payment_id column to orders table if it doesn't exist
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS stripe_payment_id VARCHAR(255) AFTER payment_reference;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_stripe_payment_id ON orders(stripe_payment_id);

-- Update existing orders with 'stripe' payment_method to have a note
UPDATE orders 
SET notes = CONCAT(COALESCE(notes, ''), ' - Migrated to Stripe integration')
WHERE payment_method = 'stripe' AND stripe_payment_id IS NULL;
