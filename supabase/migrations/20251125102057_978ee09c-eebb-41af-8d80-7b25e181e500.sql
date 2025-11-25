-- Add units_per_package column to purchases table to track how many units are in a crate/package
ALTER TABLE public.purchases 
ADD COLUMN units_per_package integer DEFAULT 1;

COMMENT ON COLUMN public.purchases.units_per_package IS 'Number of units in a package/crate (e.g., 24 beers in a crate, 12 sodas in a crate)';
