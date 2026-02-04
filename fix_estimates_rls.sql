-- Enable RLS for estimates tables
ALTER TABLE IF EXISTS estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS estimate_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow all access to estimates" ON estimates;
DROP POLICY IF EXISTS "Allow all access to estimate_items" ON estimate_items;

-- Create permissive policies (since this is an internal tool for now)
CREATE POLICY "Allow all access to estimates" ON estimates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to estimate_items" ON estimate_items FOR ALL USING (true) WITH CHECK (true);
