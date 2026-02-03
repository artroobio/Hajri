-- MASTER SCHEMA SYNC SCRIPT
-- Generated based on scan of AddWorkerModal.tsx, Workers.tsx, and Dashboard.tsx
-- Run this in Supabase SQL Editor to fix "Column not found" and Constraint errors.

-- 1. DROP EXISTING TABLES (Safely)
DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.workers CASCADE;

-- 2. CREATE WORKERS TABLE (Matches AddWorkerModal.tsx)
CREATE TABLE public.workers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- Basic Info
    full_name TEXT NOT NULL,
    phone_number TEXT,
    skill_type TEXT DEFAULT 'Laborer', -- 'Mason', 'Laborer', etc.
    daily_wage NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'active', -- 'active', 'inactive'

    -- KYC / Extra Fields identified in AddWorkerModal
    gender TEXT,
    age INTEGER,
    address TEXT,
    alternate_phone TEXT,
    aadhaar_number TEXT,
    id_document_url TEXT
);

-- 3. CREATE ATTENDANCE TABLE (Matches Workers.tsx / Dashboard.tsx)
CREATE TABLE public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- Relations
    worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,

    -- Core Data
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL, -- 'Present', 'Absent', 'Half-day'
    hajri_count NUMERIC DEFAULT 0, -- 1, 0.5, 0
    kharchi_amount NUMERIC DEFAULT 0, -- Advances taken on the spot (Kharchi)
    
    -- Optional: Check-in time if used later
    check_in_time TIMESTAMPTZ
);

-- 4. CREATE PAYMENTS TABLE (For Salary/Advances - "advances" in user request)
-- This handles the Payroll/Billing logic
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),

    worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
    
    amount NUMERIC NOT NULL DEFAULT 0,
    payment_date TIMESTAMPTZ DEFAULT now(),
    payment_type TEXT, -- 'Salary', 'Advance', 'Bonus'
    payment_method TEXT -- 'Cash', 'Online'
);

-- 5. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 6. CREATE POLICIES (Open Access for Development)
CREATE POLICY "Enable all access for workers" ON public.workers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for attendance" ON public.attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for payments" ON public.payments FOR ALL USING (true) WITH CHECK (true);

-- 7. STORAGE BUCKET POLICIES (Optional but recommended for worker-docs)
-- Note: You may need to create 'worker-docs' bucket in Storage explicitly if it doesn't exist.
-- This part creates a policy if the bucket exists.
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public) 
    VALUES ('worker-docs', 'worker-docs', true)
    ON CONFLICT (id) DO NOTHING;
EXCEPTION
    WHEN undefined_table THEN NULL; -- Ignore if storage schema not accessible
END $$;

-- Policy for storage (if applicable)
-- CREATE POLICY "Allow public uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'worker-docs'); 
