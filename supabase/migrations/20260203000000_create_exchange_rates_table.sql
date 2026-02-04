-- Create exchange_rates table
CREATE TABLE IF NOT EXISTS public.exchange_rates (
    currency_code TEXT PRIMARY KEY,
    rate NUMERIC NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- Policy for reading (all authenticated users can read)
CREATE POLICY "Allow all authenticated users to read exchange rates"
    ON public.exchange_rates
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy for writing (only admins can insert/update/delete)
CREATE POLICY "Allow admins to write exchange rates"
    ON public.exchange_rates
    FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
