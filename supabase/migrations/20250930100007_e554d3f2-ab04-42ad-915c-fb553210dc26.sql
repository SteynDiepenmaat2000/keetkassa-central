-- Create members table
CREATE TABLE public.members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  credit DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create drinks table
CREATE TABLE public.drinks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  drink_id UUID NOT NULL REFERENCES public.drinks(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expenses table (for costs like chips, gas, beer crates)
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  settled BOOLEAN NOT NULL DEFAULT false,
  payment_method TEXT, -- 'credit' or 'cash'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create settings table (for password and other settings)
CREATE TABLE public.settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drinks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Create policies (public access since this is for internal keet use)
CREATE POLICY "Public read access" ON public.members FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON public.members FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON public.members FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON public.members FOR DELETE USING (true);

CREATE POLICY "Public read access" ON public.drinks FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON public.drinks FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON public.drinks FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON public.drinks FOR DELETE USING (true);

CREATE POLICY "Public read access" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON public.transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON public.transactions FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON public.transactions FOR DELETE USING (true);

CREATE POLICY "Public read access" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON public.expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON public.expenses FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON public.expenses FOR DELETE USING (true);

CREATE POLICY "Public read access" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON public.settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON public.settings FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON public.settings FOR DELETE USING (true);

-- Insert initial members
INSERT INTO public.members (name) VALUES
  ('Steyn Diepenmaat'),
  ('Luc Bolk'),
  ('Nanne Oude Egbrink'),
  ('Riccardo Wennink'),
  ('Rick Haverkotte'),
  ('Teun Eerdman'),
  ('Anne Snijders'),
  ('Anne te Koppele'),
  ('Ashmara Groen'),
  ('Fleur Oude Egbrink'),
  ('Gian Klaas'),
  ('Hugo Stubbe'),
  ('Jelle Stockmann'),
  ('Jesse Haverkotte'),
  ('Joanke van Capelle'),
  ('Leonne Floothuis'),
  ('Lisa Geerdink'),
  ('Lisan Wissink'),
  ('Maithe Groen'),
  ('Marissa Spit'),
  ('Max Willemsen'),
  ('Michael Wennink'),
  ('Mirte Nijhuis'),
  ('Morris Westerik'),
  ('Pepijn Blokhuis'),
  ('Remy Stoolhuis'),
  ('Stan Franke'),
  ('Stijn Segerink'),
  ('Tim Nienhuis'),
  ('Tycho Westerik'),
  ('Yasmijn van der Sluis'),
  ('Lieke Stockmann');

-- Insert some default drinks (you can customize these later)
INSERT INTO public.drinks (name, price) VALUES
  ('Bier', 1.50),
  ('Cola', 1.00),
  ('Fanta', 1.00),
  ('Sprite', 1.00),
  ('Water', 0.50),
  ('Energy Drink', 2.00),
  ('Wijn', 2.50),
  ('Shots', 2.00);

-- Insert password setting (7591)
INSERT INTO public.settings (key, value) VALUES ('admin_password', '7591');