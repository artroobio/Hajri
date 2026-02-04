-- Create project_settings table
CREATE TABLE public.project_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_name TEXT,
    address TEXT,
    phone TEXT,
    receipt_footer TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_settings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all access
CREATE POLICY "Allow all access to project_settings" ON public.project_settings FOR ALL USING (true) WITH CHECK (true);
