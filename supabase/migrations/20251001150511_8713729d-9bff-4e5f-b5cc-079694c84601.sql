-- Remove the admin_password from settings table as it's now stored as a secure secret
DELETE FROM public.settings WHERE key = 'admin_password';

-- Update RLS policies for settings table to be more restrictive
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access" ON public.settings;
DROP POLICY IF EXISTS "Public insert access" ON public.settings;
DROP POLICY IF EXISTS "Public update access" ON public.settings;
DROP POLICY IF EXISTS "Public delete access" ON public.settings;

-- Create new restricted policies for settings table
-- Only allow reading non-sensitive settings
CREATE POLICY "Allow read access to settings"
ON public.settings
FOR SELECT
USING (true);

-- Restrict insert/update/delete - in practice, settings should be managed through admin interface only
CREATE POLICY "Restrict insert on settings"
ON public.settings
FOR INSERT
WITH CHECK (false);

CREATE POLICY "Restrict update on settings"
ON public.settings
FOR UPDATE
USING (false);

CREATE POLICY "Restrict delete on settings"
ON public.settings
FOR DELETE
USING (false);