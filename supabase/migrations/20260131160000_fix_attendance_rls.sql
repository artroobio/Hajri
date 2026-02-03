-- Fix RLS policy for attendance table
BEGIN;

-- Ensure RLS is enabled
ALTER TABLE "public"."attendance" ENABLE ROW LEVEL SECURITY;

-- Create explicitly permissive policy for INSERT
-- We use DO block to avoid error if policy already exists (though CREATE POLICY IF NOT EXISTS is not standard in all PG versions usually used with Supabase)
-- Supabase Postgres usually supports CREATE POLICY IF NOT EXISTS in newer versions, but let's be safe.
DROP POLICY IF EXISTS "Enable insert for attendance" ON "public"."attendance";

CREATE POLICY "Enable insert for attendance"
ON "public"."attendance"
FOR INSERT
To public
WITH CHECK (true);

-- Also ensure SELECT is allowed if they need to read back the inserted row
DROP POLICY IF EXISTS "Enable select for attendance" ON "public"."attendance";

CREATE POLICY "Enable select for attendance"
ON "public"."attendance"
FOR SELECT
TO public
USING (true);

COMMIT;
