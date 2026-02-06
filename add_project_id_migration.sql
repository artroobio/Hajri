-- =====================================================
-- MULTI-PROJECT ARCHITECTURE MIGRATION
-- =====================================================
-- This script adds project_id foreign keys to all tables
-- and creates a default "Project A" with existing data
-- =====================================================

-- Step 1: Create default "Project A"
INSERT INTO public.projects (id, name, created_at)
VALUES (
    '00000000-0000-0000-0000-000000000001'::UUID,
    'Project A',
    now()
)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Add project_id columns to all tables

-- Add to workers table
ALTER TABLE public.workers 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id);

-- Add to attendance table
ALTER TABLE public.attendance 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id);

-- Add to expenses table
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id);

-- Add to estimates table
ALTER TABLE public.estimates 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id);

-- Add to client_ledger table (handle potential conflicts)
DO $$ 
BEGIN
    -- Drop any existing foreign key constraints on project_id column
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name='client_ledger' AND constraint_type='FOREIGN KEY' AND constraint_name LIKE '%project_id%'
    ) THEN
        EXECUTE (
            SELECT 'ALTER TABLE public.client_ledger DROP CONSTRAINT ' || constraint_name || ';'
            FROM information_schema.table_constraints
            WHERE table_name='client_ledger' 
                AND constraint_type='FOREIGN KEY' 
                AND constraint_name LIKE '%project_id%'
            LIMIT 1
        );
    END IF;
    
    -- Add column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='client_ledger' AND column_name='project_id'
    ) THEN
        ALTER TABLE public.client_ledger ADD COLUMN project_id UUID;
    END IF;
    
    -- Add correct foreign key constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name='fk_client_ledger_project' AND table_name='client_ledger'
    ) THEN
        ALTER TABLE public.client_ledger 
        ADD CONSTRAINT fk_client_ledger_project 
        FOREIGN KEY (project_id) REFERENCES public.projects(id);
    END IF;
END $$;

-- Step 3: Assign all existing data to "Project A"

-- Update workers
UPDATE public.workers 
SET project_id = '00000000-0000-0000-0000-000000000001'::UUID
WHERE project_id IS NULL;

-- Update attendance
UPDATE public.attendance 
SET project_id = '00000000-0000-0000-0000-000000000001'::UUID
WHERE project_id IS NULL;

-- Update expenses
UPDATE public.expenses 
SET project_id = '00000000-0000-0000-0000-000000000001'::UUID
WHERE project_id IS NULL;

-- Update estimates
UPDATE public.estimates 
SET project_id = '00000000-0000-0000-0000-000000000001'::UUID
WHERE project_id IS NULL;

-- Update client_ledger
UPDATE public.client_ledger 
SET project_id = '00000000-0000-0000-0000-000000000001'::UUID
WHERE project_id IS NULL;

-- Step 4: Make project_id required (NOT NULL) for future inserts
-- Note: We don't enforce this yet to avoid breaking existing code during migration

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_workers_project_id ON public.workers(project_id);
CREATE INDEX IF NOT EXISTS idx_attendance_project_id ON public.attendance(project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_project_id ON public.expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_estimates_project_id ON public.estimates(project_id);
CREATE INDEX IF NOT EXISTS idx_client_ledger_project_id ON public.client_ledger(project_id);

-- Step 6: Update RLS policies (if applicable)
-- Note: Since current policies use "true" for all access, no changes needed
-- If you have specific RLS policies, they should be updated to include:
-- AND project_id = (SELECT current_setting('app.current_project_id')::UUID)

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Next Steps:
-- 1. Run this script in Supabase SQL Editor
-- 2. Verify "Project A" exists in projects table
-- 3. Verify all existing records have project_id set
-- 4. Update application code to use project_id filtering
-- =====================================================
