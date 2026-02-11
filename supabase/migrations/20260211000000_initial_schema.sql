-- Initial Schema Migration
-- Consolidated migration with all tables and configurations

-- Set search path
SET search_path TO public;

-- ======================
-- EXPENSE GROUPS & CATEGORIES
-- ======================

-- Expense Groups table (main categories, per-user)
CREATE TABLE public.expense_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  color TEXT DEFAULT '#6366f1',
  sort_order INTEGER NOT NULL,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_expense_group_per_user UNIQUE(user_id, name)
);

COMMENT ON TABLE public.expense_groups IS 'User-specific expense groups. Each user has their own set.';
COMMENT ON COLUMN public.expense_groups.user_id IS 'Owner of this expense group';
COMMENT ON COLUMN public.expense_groups.is_system IS 'If false, this is a user-created group; if true, it was created during signup.';

-- Expense Categories table (subcategories within groups, per-user)
CREATE TABLE public.expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_group_id UUID REFERENCES public.expense_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_custom BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_expense_category_per_group UNIQUE(expense_group_id, name, user_id)
);

COMMENT ON TABLE public.expense_categories IS 'User-specific expense categories within expense groups.';
COMMENT ON COLUMN public.expense_categories.is_custom IS 'If true, this is a user-created category; if false, it was created during signup.';

-- ======================
-- ACCOUNTS
-- ======================

CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('checking', 'savings', 'credit_card', 'cash', 'investment')),
  institution TEXT,
  account_number TEXT,
  balance DECIMAL(12, 2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  color TEXT DEFAULT '#6366f1',
  is_active BOOLEAN DEFAULT true,
  include_in_plan BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON COLUMN public.accounts.include_in_plan IS 'If true, transactions from this account are included in plan calculations. Set to false for savings/investment accounts that receive transfers but should not be tracked in daily spending plan.';

-- ======================
-- MONTHLY PLANS
-- ======================

CREATE TABLE public.monthly_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_plan_per_month UNIQUE(user_id, month, year)
);

COMMENT ON TABLE public.monthly_plans IS 'Monthly financial plans for user budgeting';

-- ======================
-- PLAN ITEMS
-- ======================

CREATE TABLE public.plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES public.monthly_plans(id) ON DELETE CASCADE,
  expense_category_id UUID REFERENCES public.expense_categories(id) ON DELETE CASCADE,
  planned_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  due_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_plan_item UNIQUE(plan_id, expense_category_id)
);

COMMENT ON TABLE public.plan_items IS 'Individual line items within monthly plans';
COMMENT ON COLUMN public.plan_items.plan_id IS 'References monthly_plans table';
COMMENT ON COLUMN public.plan_items.expense_category_id IS 'References expense_categories table';

-- ======================
-- TRANSACTIONS
-- ======================

CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  expense_category_id UUID REFERENCES public.expense_categories(id) ON DELETE SET NULL,
  transfer_to_account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT NOT NULL,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_pending BOOLEAN DEFAULT false,
  notes TEXT,
  reference_number VARCHAR(25),
  reference VARCHAR(250),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_category_or_transfer CHECK (
    (expense_category_id IS NOT NULL AND transfer_to_account_id IS NULL) OR
    (expense_category_id IS NULL AND transfer_to_account_id IS NOT NULL)
  )
);

COMMENT ON COLUMN public.transactions.expense_category_id IS 'References expense_categories table';
COMMENT ON COLUMN public.transactions.transfer_to_account_id IS 'For transfers between accounts. Mutually exclusive with expense_category_id.';
COMMENT ON COLUMN public.transactions.reference_number IS 'Transaction reference number (e.g., check number, transaction ID)';
COMMENT ON COLUMN public.transactions.reference IS 'Additional reference information or memo';
COMMENT ON CONSTRAINT check_category_or_transfer ON public.transactions IS 'Ensures transaction is either categorized OR a transfer, not both.';

-- ======================
-- REMINDERS
-- ======================

CREATE TABLE public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_item_id UUID REFERENCES public.plan_items(id) ON DELETE CASCADE,
  due_date DATE NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_reminder_per_plan_item UNIQUE(plan_item_id)
);

COMMENT ON TABLE public.reminders IS 'Due date reminders for plan items';
COMMENT ON COLUMN public.reminders.plan_item_id IS 'References plan_items table';

-- ======================
-- INDEXES
-- ======================

-- Expense Groups & Categories
CREATE INDEX idx_expense_groups_user ON public.expense_groups(user_id);
CREATE INDEX idx_expense_categories_group ON public.expense_categories(expense_group_id);
CREATE INDEX idx_expense_categories_user ON public.expense_categories(user_id);

-- Accounts
CREATE INDEX idx_accounts_user ON public.accounts(user_id);

-- Monthly Plans
CREATE INDEX idx_monthly_plans_user ON public.monthly_plans(user_id);
CREATE INDEX idx_monthly_plans_date ON public.monthly_plans(year, month);

-- Plan Items
CREATE INDEX idx_plan_items_plan ON public.plan_items(plan_id);
CREATE INDEX idx_plan_items_expense_category ON public.plan_items(expense_category_id);

-- Transactions
CREATE INDEX idx_transactions_user ON public.transactions(user_id);
CREATE INDEX idx_transactions_account ON public.transactions(account_id);
CREATE INDEX idx_transactions_expense_category ON public.transactions(expense_category_id);
CREATE INDEX idx_transactions_date ON public.transactions(transaction_date);

-- Reminders
CREATE INDEX idx_reminders_user ON public.reminders(user_id);
CREATE INDEX idx_reminders_due_date ON public.reminders(due_date, is_completed);

-- ======================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ======================

-- Enable RLS on all tables
ALTER TABLE public.expense_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- Expense Groups policies
CREATE POLICY "Users can view their own expense_groups"
  ON public.expense_groups FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expense_groups"
  ON public.expense_groups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expense_groups"
  ON public.expense_groups FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom expense_groups"
  ON public.expense_groups FOR DELETE
  USING (auth.uid() = user_id AND is_system = false);

-- Expense Categories policies
CREATE POLICY "Users can view their own expense_categories"
  ON public.expense_categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expense_categories"
  ON public.expense_categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expense_categories"
  ON public.expense_categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom expense_categories"
  ON public.expense_categories FOR DELETE
  USING (auth.uid() = user_id AND is_custom = true);

-- Accounts policies
CREATE POLICY "Users can view their own accounts"
  ON public.accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own accounts"
  ON public.accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts"
  ON public.accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounts"
  ON public.accounts FOR DELETE
  USING (auth.uid() = user_id);

-- Monthly Plans policies
CREATE POLICY "Users can view their own plans"
  ON public.monthly_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own plans"
  ON public.monthly_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plans"
  ON public.monthly_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plans"
  ON public.monthly_plans FOR DELETE
  USING (auth.uid() = user_id);

-- Plan Items policies
CREATE POLICY "Users can view their own plan_items"
  ON public.plan_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.monthly_plans 
      WHERE monthly_plans.id = plan_items.plan_id 
      AND monthly_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own plan_items"
  ON public.plan_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.monthly_plans 
      WHERE monthly_plans.id = plan_id 
      AND monthly_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own plan_items"
  ON public.plan_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.monthly_plans 
      WHERE monthly_plans.id = plan_id 
      AND monthly_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own plan_items"
  ON public.plan_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.monthly_plans 
      WHERE monthly_plans.id = plan_id 
      AND monthly_plans.user_id = auth.uid()
    )
  );

-- Transactions policies
CREATE POLICY "Users can view their own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
  ON public.transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
  ON public.transactions FOR DELETE
  USING (auth.uid() = user_id);

-- Reminders policies
CREATE POLICY "Users can view their own reminders"
  ON public.reminders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reminders"
  ON public.reminders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders"
  ON public.reminders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders"
  ON public.reminders FOR DELETE
  USING (auth.uid() = user_id);

-- ======================
-- FUNCTIONS & TRIGGERS
-- ======================

-- Function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updating timestamps
CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_monthly_plans_updated_at
  BEFORE UPDATE ON public.monthly_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_plan_items_updated_at
  BEFORE UPDATE ON public.plan_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to copy plan from previous month
CREATE OR REPLACE FUNCTION public.copy_plan_from_previous_month(
  p_user_id UUID,
  p_month INTEGER,
  p_year INTEGER
)
RETURNS UUID AS $$
DECLARE
  v_previous_month INTEGER;
  v_previous_year INTEGER;
  v_previous_plan_id UUID;
  v_new_plan_id UUID;
BEGIN
  -- Calculate previous month
  IF p_month = 1 THEN
    v_previous_month := 12;
    v_previous_year := p_year - 1;
  ELSE
    v_previous_month := p_month - 1;
    v_previous_year := p_year;
  END IF;

  -- Find previous plan
  SELECT id INTO v_previous_plan_id
  FROM public.monthly_plans
  WHERE user_id = p_user_id
    AND month = v_previous_month
    AND year = v_previous_year;

  IF v_previous_plan_id IS NULL THEN
    RAISE EXCEPTION 'No plan found for previous month';
  END IF;

  -- Create new plan
  INSERT INTO public.monthly_plans (user_id, month, year)
  VALUES (p_user_id, p_month, p_year)
  RETURNING id INTO v_new_plan_id;

  -- Copy plan items
  INSERT INTO public.plan_items (plan_id, expense_category_id, planned_amount, notes)
  SELECT v_new_plan_id, expense_category_id, planned_amount, notes
  FROM public.plan_items
  WHERE plan_id = v_previous_plan_id;

  RETURN v_new_plan_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ======================
-- VIEWS
-- ======================

-- View for plan summary with actual spending
CREATE OR REPLACE VIEW public.plan_summary AS
SELECT
  pi.id AS plan_item_id,
  mp.id AS plan_id,
  mp.user_id,
  mp.month,
  mp.year,
  eg.id AS expense_group_id,
  eg.name AS expense_group_name,
  eg.color AS expense_group_color,
  ec.id AS expense_category_id,
  ec.name AS expense_category_name,
  pi.planned_amount,
  pi.due_date,
  COALESCE(
    (SELECT SUM(ABS(t.amount))
     FROM public.transactions t
     WHERE t.expense_category_id = ec.id
       AND t.user_id = mp.user_id
       AND EXTRACT(MONTH FROM t.transaction_date) = mp.month
       AND EXTRACT(YEAR FROM t.transaction_date) = mp.year
       AND t.amount < 0), -- negative amounts are expenses
    0
  ) AS actual_amount,
  pi.planned_amount - COALESCE(
    (SELECT SUM(ABS(t.amount))
     FROM public.transactions t
     WHERE t.expense_category_id = ec.id
       AND t.user_id = mp.user_id
       AND EXTRACT(MONTH FROM t.transaction_date) = mp.month
       AND EXTRACT(YEAR FROM t.transaction_date) = mp.year
       AND t.amount < 0),
    0
  ) AS remaining_amount
FROM public.plan_items pi
JOIN public.monthly_plans mp ON pi.plan_id = mp.id
JOIN public.expense_categories ec ON pi.expense_category_id = ec.id
JOIN public.expense_groups eg ON ec.expense_group_id = eg.id;

-- ======================
-- PERMISSIONS
-- ======================

-- Grant permissions to Supabase roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated;
