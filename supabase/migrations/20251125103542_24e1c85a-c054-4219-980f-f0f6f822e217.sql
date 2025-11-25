-- Add bottle_size column to purchases table for tracking bottle sizes of drinks
ALTER TABLE purchases
ADD COLUMN bottle_size numeric;

COMMENT ON COLUMN purchases.bottle_size IS 'Bottle size in liters (e.g., 1.0, 1.25, 1.5, 2.0) for Frisdrank and Wijn categories';