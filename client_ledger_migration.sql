-- Create client_ledger table
CREATE TABLE public.client_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT NOT NULL,
    bill_amount NUMERIC DEFAULT 0,
    payment_received NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for client_ledger
ALTER TABLE public.client_ledger ENABLE ROW LEVEL SECURITY;

-- Create policy for client_ledger
CREATE POLICY "Allow all access to client_ledger" ON public.client_ledger FOR ALL USING (true) WITH CHECK (true);
