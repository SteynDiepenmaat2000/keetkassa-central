-- Enable realtime for transactions table
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;

-- Enable realtime for members table
ALTER PUBLICATION supabase_realtime ADD TABLE public.members;

-- Enable realtime for drinks table
ALTER PUBLICATION supabase_realtime ADD TABLE public.drinks;