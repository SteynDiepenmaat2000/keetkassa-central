-- Create purchases table for structured expense tracking
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  category TEXT NOT NULL,
  price_per_unit NUMERIC NOT NULL,
  quantity INTEGER NOT NULL,
  deposit_per_unit NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  description TEXT,
  member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  settled BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Public read access" ON public.purchases FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON public.purchases FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON public.purchases FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON public.purchases FOR DELETE USING (true);

-- Add index for better performance
CREATE INDEX idx_purchases_category ON public.purchases(category);
CREATE INDEX idx_purchases_created_at ON public.purchases(created_at DESC);