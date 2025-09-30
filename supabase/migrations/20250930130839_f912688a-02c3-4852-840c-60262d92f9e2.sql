-- Add active column to members table
ALTER TABLE public.members 
ADD COLUMN active BOOLEAN NOT NULL DEFAULT true;

-- Create index for filtering active members
CREATE INDEX idx_members_active ON public.members(active);

-- Create function to delete inactive members from previous year
CREATE OR REPLACE FUNCTION public.delete_inactive_members_from_previous_year()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete members that have been inactive and it's a new year
  -- This should be run at the start of each year
  DELETE FROM public.members
  WHERE active = false
  AND EXTRACT(YEAR FROM created_at) < EXTRACT(YEAR FROM CURRENT_DATE);
END;
$$;