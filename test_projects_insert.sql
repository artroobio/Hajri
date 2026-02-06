-- Test if you can insert into projects table
-- Run this in Supabase SQL Editor to verify RLS policies

-- Test 1: Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'projects';

-- Test 2: Try to insert a test project
INSERT INTO public.projects (name, client_name)
VALUES ('Test Project', 'Test Client')
RETURNING *;

-- Test 3: Check if it was created
SELECT id, name, client_name, created_at 
FROM public.projects 
ORDER BY created_at DESC 
LIMIT 5;

-- Clean up test (optional)
-- DELETE FROM public.projects WHERE name = 'Test Project';
