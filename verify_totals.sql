-- Check Total Amounts
SELECT sum(amount) as total_project_value FROM estimate_items;

-- Check grouped by estimate
SELECT e.name, sum(ei.amount) as estimate_total 
FROM estimates e 
LEFT JOIN estimate_items ei ON e.id = ei.estimate_id
GROUP BY e.name;
