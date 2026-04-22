-- ======================
-- CREDITS (Loans, Mortgages, Credit Cards, etc.)
-- ======================

CREATE TABLE public.credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('mortgage', 'personal_loan', 'auto_loan', 'student_loan', 'credit_card', 'line_of_credit', 'other')),
  institution TEXT,
  account_number TEXT,
  original_amount DECIMAL(12, 2) NOT NULL,
  current_balance DECIMAL(12, 2) NOT NULL,
  interest_rate DECIMAL(5, 2) NOT NULL, -- Annual percentage rate (e.g., 4.5 for 4.5%)
  currency TEXT DEFAULT 'USD',
  start_date DATE,
  maturity_date DATE,
  minimum_payment DECIMAL(12, 2),
  payment_due_day INTEGER CHECK (payment_due_day >= 1 AND payment_due_day <= 31),
  color TEXT DEFAULT '#ef4444',
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.credits IS 'Credit accounts including mortgages, loans, and credit cards';
COMMENT ON COLUMN public.credits.type IS 'Type of credit: mortgage, personal_loan, auto_loan, student_loan, credit_card, line_of_credit, or other';
COMMENT ON COLUMN public.credits.interest_rate IS 'Annual percentage rate (APR)';
COMMENT ON COLUMN public.credits.current_balance IS 'Current outstanding balance';
COMMENT ON COLUMN public.credits.original_amount IS 'Original loan/credit amount';
COMMENT ON COLUMN public.credits.payment_due_day IS 'Day of month when payment is due';

-- ======================
-- CREDIT STATEMENTS
-- ======================

CREATE TABLE public.credit_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_id UUID REFERENCES public.credits(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  statement_date DATE NOT NULL,
  balance DECIMAL(12, 2) NOT NULL,
  interest_rate DECIMAL(5, 2), -- Monthly interest rate snapshot
  minimum_payment DECIMAL(12, 2),
  payment_due_date DATE,
  interest_charged DECIMAL(12, 2),
  principal_paid DECIMAL(12, 2),
  fees_charged DECIMAL(12, 2),
  new_charges DECIMAL(12, 2),
  payments_made DECIMAL(12, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_credit_statement UNIQUE(credit_id, statement_date)
);

COMMENT ON TABLE public.credit_statements IS 'Monthly statements for credit accounts';
COMMENT ON COLUMN public.credit_statements.statement_date IS 'Date of the statement (typically end of billing cycle)';
COMMENT ON COLUMN public.credit_statements.balance IS 'Balance as of statement date';
COMMENT ON COLUMN public.credit_statements.interest_rate IS 'Interest rate applicable for this statement period';
COMMENT ON COLUMN public.credit_statements.interest_charged IS 'Interest charged during this period';
COMMENT ON COLUMN public.credit_statements.principal_paid IS 'Amount of principal paid during this period';
COMMENT ON COLUMN public.credit_statements.fees_charged IS 'Any fees charged during this period';
COMMENT ON COLUMN public.credit_statements.new_charges IS 'New charges during this period (for credit cards)';
COMMENT ON COLUMN public.credit_statements.payments_made IS 'Total payments made during this period';

-- ======================
-- INDEXES
-- ======================

CREATE INDEX idx_credits_user ON public.credits(user_id);
CREATE INDEX idx_credits_type ON public.credits(type);
CREATE INDEX idx_credits_active ON public.credits(is_active);

CREATE INDEX idx_credit_statements_credit ON public.credit_statements(credit_id);
CREATE INDEX idx_credit_statements_user ON public.credit_statements(user_id);
CREATE INDEX idx_credit_statements_date ON public.credit_statements(statement_date);

-- ======================
-- ROW LEVEL SECURITY
-- ======================

ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_statements ENABLE ROW LEVEL SECURITY;

-- Credits policies
CREATE POLICY "Users can view their own credits"
  ON public.credits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credits"
  ON public.credits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own credits"
  ON public.credits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own credits"
  ON public.credits FOR DELETE
  USING (auth.uid() = user_id);

-- Credit statements policies
CREATE POLICY "Users can view their own credit statements"
  ON public.credit_statements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credit statements"
  ON public.credit_statements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own credit statements"
  ON public.credit_statements FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own credit statements"
  ON public.credit_statements FOR DELETE
  USING (auth.uid() = user_id);
