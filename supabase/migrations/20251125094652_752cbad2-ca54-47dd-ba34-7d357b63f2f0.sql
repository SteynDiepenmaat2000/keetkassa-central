-- Add payment_method column to purchases table
ALTER TABLE public.purchases 
ADD COLUMN payment_method TEXT;