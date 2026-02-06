-- Migration: Create database function for monthly labor stats aggregation
-- Purpose: Replace client-side aggregation with PostgreSQL server-side calculation
-- Created: 2026-02-05

-- Drop function if it exists (for re-running migration)
DROP FUNCTION IF EXISTS get_monthly_labor_stats();

-- Create function to calculate monthly labor payment totals
CREATE OR REPLACE FUNCTION get_monthly_labor_stats()
RETURNS TABLE (
    month TEXT,
    amount NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        TO_CHAR(DATE_TRUNC('month', a.date), 'FMMonth YYYY') as month,
        SUM(a.hajri_count * w.daily_wage)::NUMERIC as amount
    FROM attendance a
    INNER JOIN workers w ON a.worker_id = w.id
    GROUP BY DATE_TRUNC('month', a.date)
    ORDER BY DATE_TRUNC('month', a.date) DESC;
END;
$$;

-- Test the function (optional - comment out if not needed)
-- SELECT * FROM get_monthly_labor_stats();
