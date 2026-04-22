-- ======================
-- EXCHANGE RATES
-- ======================

CREATE TABLE public.exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate DECIMAL(20, 10) NOT NULL,
  date DATE NOT NULL,
  source TEXT DEFAULT 'exchangerate-api.com',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_exchange_rate_per_day UNIQUE(from_currency, to_currency, date)
);

COMMENT ON TABLE public.exchange_rates IS 'Daily exchange rates between currencies';
COMMENT ON COLUMN public.exchange_rates.rate IS 'Exchange rate from base currency to target currency';
COMMENT ON COLUMN public.exchange_rates.date IS 'Date for which this rate is valid';
COMMENT ON COLUMN public.exchange_rates.source IS 'Source of the exchange rate data';

-- Update accounts table to ensure currency field exists
-- (It already exists with default 'USD', but we'll make sure it's documented)
COMMENT ON COLUMN public.accounts.currency IS 'Currency code (ISO 4217): USD, CRC, etc.';

-- Update credits table currency field
COMMENT ON COLUMN public.credits.currency IS 'Currency code (ISO 4217): USD, CRC, etc.';

-- ======================
-- INDEXES
-- ======================

CREATE INDEX idx_exchange_rates_currencies ON public.exchange_rates(from_currency, to_currency);
CREATE INDEX idx_exchange_rates_date ON public.exchange_rates(date DESC);

-- ======================
-- ROW LEVEL SECURITY
-- ======================

-- Exchange rates are public data (no RLS needed)
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- Anyone can read exchange rates
CREATE POLICY "Anyone can view exchange rates"
  ON public.exchange_rates FOR SELECT
  USING (true);

-- Only authenticated users can insert rates (for API sync)
CREATE POLICY "Authenticated users can insert exchange rates"
  ON public.exchange_rates FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only authenticated users can update rates
CREATE POLICY "Authenticated users can update exchange rates"
  ON public.exchange_rates FOR UPDATE
  TO authenticated
  USING (true);
