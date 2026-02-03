-- Add hajri_count and kharchi_amount columns to attendance table
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS hajri_count NUMERIC DEFAULT 0;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS kharchi_amount NUMERIC DEFAULT 0;

-- Optional: If you want to drop the check constraint for flexible status (optional)
-- ALTER TABLE public.attendance DROP CONSTRAINT attendance_status_check;
-- ALTER TABLE public.attendance ADD CONSTRAINT attendance_status_check CHECK (status IN ('Present', 'Half-day', 'Absent', 'Leave'));
