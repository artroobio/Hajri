-- =====================================================
-- COMPREHENSIVE DIAGNOSTIC FOR PROJECTS TABLE
-- =====================================================
-- Run each section separately to diagnose the issue
-- =====================================================

-- SECTION 1: Check table structure and constraints
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_name = 'projects'
ORDER BY ordinal_position;

-- SECTION 2: Check all constraints
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'projects';

-- SECTION 3: Check current RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'projects';

-- SECTION 4: Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'projects';

-- SECTION 5: Test insert directly (as superuser/service role)
-- This bypasses RLS to see if the issue is RLS or schema
INSERT INTO public.projects (name)
VALUES ('Direct Test Project')
RETURNING *;

-- SECTION 6: Clean up test
DELETE FROM public.projects WHERE name = 'Direct Test Project';

-- =====================================================
-- POTENTIAL FIX: Disable RLS temporarily to test
-- =====================================================
-- If the direct insert works but frontend doesn't, 
-- the issue is definitely RLS. Try this:

ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;

-- Then try creating a project from the frontend
-- If it works, the RLS policies are the problem
-- Re-enable after testing:
-- ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
