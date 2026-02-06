-- Quick verification query to check if Project A exists
SELECT * FROM public.projects WHERE id = '00000000-0000-0000-0000-000000000001';

-- Check all projects
SELECT id, name, created_at FROM public.projects ORDER BY created_at DESC;

-- Check if there are any RLS policies blocking access
SELECT tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'projects';
