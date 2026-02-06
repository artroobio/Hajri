-- =====================================================
-- TEMPORARY: Disable RLS to test frontend
-- =====================================================
-- Run this to temporarily disable RLS
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;

-- Now try creating a project from the frontend
-- If it works, we know RLS policies are the issue

-- =====================================================
-- After confirming it works, re-enable RLS
-- =====================================================
-- ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
