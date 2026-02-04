-- Remove the generated column constraint from 'amount'
-- We will make it a standard column so the application can calculate it efficiently.

ALTER TABLE estimate_items DROP COLUMN IF EXISTS amount;
ALTER TABLE estimate_items ADD COLUMN amount NUMERIC DEFAULT 0;

-- Optional: Update existing rows (if any survived) to calculate amount
UPDATE estimate_items SET amount = (quantity * rate);
