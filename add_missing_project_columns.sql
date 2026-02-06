-- =====================================================
-- FIX: Add ALL missing columns to projects table
-- =====================================================
-- This adds all columns that AddProjectModal expects
-- =====================================================

-- Add all missing columns
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS client_name TEXT,
ADD COLUMN IF NOT EXISTS site_address TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS gst_number TEXT,
ADD COLUMN IF NOT EXISTS architect_name TEXT,
ADD COLUMN IF NOT EXISTS engineer_name TEXT,
ADD COLUMN IF NOT EXISTS project_start_date DATE;

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Verify all columns were added correctly
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns
WHERE table_name = 'projects'
ORDER BY ordinal_position;

-- Test insert with all fields
INSERT INTO public.projects (
    name, 
    client_name, 
    site_address, 
    phone, 
    gst_number, 
    architect_name, 
    engineer_name, 
    project_start_date
)
VALUES (
    'Test Project B',
    'Test Client',
    '123 Main St',
    '1234567890',
    'GST123',
    'Architect Name',
    'Engineer Name',
    '2026-02-01'
)
RETURNING *;

-- Clean up test
DELETE FROM public.projects WHERE name = 'Test Project B';
