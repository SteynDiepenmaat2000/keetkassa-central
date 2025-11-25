-- Create credit_transactions table to track credit top-ups
CREATE TABLE public.credit_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (matching other tables)
CREATE POLICY "Public read access" 
ON public.credit_transactions 
FOR SELECT 
USING (true);

CREATE POLICY "Public insert access" 
ON public.credit_transactions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public update access" 
ON public.credit_transactions 
FOR UPDATE 
USING (true);

CREATE POLICY "Public delete access" 
ON public.credit_transactions 
FOR DELETE 
USING (true);

-- Create index for better query performance
CREATE INDEX idx_credit_transactions_member_id ON public.credit_transactions(member_id);
CREATE INDEX idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);