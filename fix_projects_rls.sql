-- =====================================================
-- FIX: Add RLS Policies for Projects Table
-- =====================================================
-- This script enables RLS and adds policies to allow
-- frontend access to the projects table
-- =====================================================

-- Enable RLS on projects table if not already enabled
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Allow all access to projects" ON public.projects;
DROP POLICY IF EXISTS "Allow read access to projects" ON public.projects;
DROP POLICY IF EXISTS "Allow write access to projects" ON public.projects;
DROP POLICY IF EXISTS "Allow update access to projects" ON public.projects;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.projects;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.projects;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.projects;

-- Create policy to allow authenticated users to SELECT projects
CREATE POLICY "Enable read access for authenticated users" 
ON public.projects 
FOR SELECT
TO authenticated
USING (true);

-- Create policy to allow authenticated users to INSERT projects
CREATE POLICY "Enable insert for authenticated users" 
ON public.projects 
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create policy to allow authenticated users to UPDATE projects
CREATE POLICY "Enable update for authenticated users" 
ON public.projects 
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Run this query to verify the policies were created:
-- SELECT * FROM public.projects;
--
-- You should now be able to create new projects
-- =====================================================
