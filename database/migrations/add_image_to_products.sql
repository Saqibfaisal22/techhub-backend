-- Add image column to products table for main product image
-- This allows direct image storage without using product_images table
-- Run this migration to fix image display issue

ALTER TABLE products ADD COLUMN image VARCHAR(500) AFTER meta_description;

-- Update existing products to use their primary image from product_images table
UPDATE products p
LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
SET p.image = pi.image_url
WHERE pi.image_url IS NOT NULL;
