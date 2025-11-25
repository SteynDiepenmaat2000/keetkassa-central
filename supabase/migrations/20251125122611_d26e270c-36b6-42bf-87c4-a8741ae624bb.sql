-- Add volume_ml column to drinks table to store the size of each drink
ALTER TABLE public.drinks ADD COLUMN volume_ml integer;

-- Add a comment to explain the column
COMMENT ON COLUMN public.drinks.volume_ml IS 'Volume of the drink in milliliters (e.g., 330 for small cola, 500 for large cola)';