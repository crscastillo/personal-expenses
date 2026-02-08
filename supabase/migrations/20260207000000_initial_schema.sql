-- Create schema
CREATE SCHEMA IF NOT EXISTS pex;

-- Set search path
SET search_path TO pex, public;

-- Enable UUID extension

-- Categories table (predefined categories based on Ramit Sethi's approach)
CREATE TABLE pex.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  color TEXT DEFAULT '#6366f1',
  sort_order INTEGER NOT NULL,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON COLUMN pex.categories.is_system IS 'If true, this is a system category that cannot be deleted by users.';

-- Insert predefined categories
INSERT INTO pex.categories (name, description, type, color, sort_order, is_system) VALUES
  ('Income', 'All sources of income', 'income', '#22c55e', 1, true),
  ('Investments', 'Long-term wealth building (10%)', 'expense', '#8b5cf6', 2, true),
  ('Savings', 'Emergency fund and goals (5-10%)', 'expense', '#3b82f6', 3, true),
  ('Fixed Costs', 'Essential expenses (50-60%)', 'expense', '#ef4444', 4, true),
  ('Guilt-Free Spending', 'Enjoy life (20-35%)', 'expense', '#f59e0b', 5, true),
  ('Misc', 'Uncategorized and other expenses', 'expense', '#6b7280', 6, true);

-- Subcategories/Types table
CREATE TABLE pex.subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES pex.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_custom BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_subcategory_per_category UNIQUE(category_id, name, user_id)
);

-- Insert predefined subcategories based on Ramit Sethi's approach
-- Income subcategories
INSERT INTO pex.subcategories (category_id, name, description, is_custom) 
SELECT id, 'Salary', 'Primary job salary', false FROM pex.categories WHERE name = 'Income';
INSERT INTO pex.subcategories (category_id, name, description, is_custom) 
SELECT id, 'Freelance', 'Freelance income', false FROM pex.categories WHERE name = 'Income';
INSERT INTO pex.subcategories (category_id, name, description, is_custom) 
SELECT id, 'Side Hustle', 'Side business income', false FROM pex.categories WHERE name = 'Income';
INSERT INTO pex.subcategories (category_id, name, description, is_custom) 
SELECT id, 'Investments Returns', 'Dividends and interest', false FROM pex.categories WHERE name = 'Income';

-- Investment subcategories
INSERT INTO pex.subcategories (category_id, name, description, is_custom) 
SELECT id, '401(k)', 'Employer retirement account', false FROM pex.categories WHERE name = 'Investments';
INSERT INTO pex.subcategories (category_id, name, description, is_custom) 
SELECT id, 'Roth IRA', 'Individual retirement account', false FROM pex.categories WHERE name = 'Investments';
INSERT INTO pex.subcategories (category_id, name, description, is_custom) 
SELECT id, 'Index Funds', 'Low-cost index funds', false FROM pex.categories WHERE name = 'Investments';
INSERT INTO pex.subcategories (category_id, name, description, is_custom) 
SELECT id, 'Brokerage', 'Taxable investment account', false FROM pex.categories WHERE name = 'Investments';

-- Savings subcategories
INSERT INTO pex.subcategories (category_id, name, description, is_custom) 
SELECT id, 'Emergency Fund', '3-6 months expenses', false FROM pex.categories WHERE name = 'Savings';
INSERT INTO pex.subcategories (category_id, name, description, is_custom) 
SELECT id, 'Vacation', 'Travel savings', false FROM pex.categories WHERE name = 'Savings';
INSERT INTO pex.subcategories (category_id, name, description, is_custom) 
SELECT id, 'Home Down Payment', 'House savings', false FROM pex.categories WHERE name = 'Savings';
INSERT INTO pex.subcategories (category_id, name, description, is_custom) 
SELECT id, 'Car', 'Vehicle purchase', false FROM pex.categories WHERE name = 'Savings';

-- Fixed Costs subcategories
INSERT INTO pex.subcategories (category_id, name, description, is_custom) 
SELECT id, 'Rent/Mortgage', 'Housing payment', false FROM pex.categories WHERE name = 'Fixed Costs';
INSERT INTO pex.subcategories (category_id, name, description, is_custom) 
SELECT id, 'Utilities', 'Electric, water, gas', false FROM pex.categories WHERE name = 'Fixed Costs';
INSERT INTO pex.subcategories (category_id, name, description, is_custom) 
SELECT id, 'Internet/Phone', 'Communication bills', false FROM pex.categories WHERE name = 'Fixed Costs';
INSERT INTO pex.subcategories (category_id, name, description, is_custom) 
SELECT id, 'Insurance', 'Health, car, home insurance', false FROM pex.categories WHERE name = 'Fixed Costs';
INSERT INTO pex.subcategories (category_id, name, description, is_custom) 
SELECT id, 'Subscriptions', 'Streaming, software, etc', false FROM pex.categories WHERE name = 'Fixed Costs';
INSERT INTO pex.subcategories (category_id, name, description, is_custom) 
SELECT id, 'Transportation', 'Car payment, public transit', false FROM pex.categories WHERE name = 'Fixed Costs';
INSERT INTO pex.subcategories (category_id, name, description, is_custom) 
SELECT id, 'Groceries', 'Food and household items', false FROM pex.categories WHERE name = 'Fixed Costs';

-- Guilt-Free Spending subcategories
INSERT INTO pex.subcategories (category_id, name, description, is_custom) 
SELECT id, 'Dining Out', 'Restaurants and cafes', false FROM pex.categories WHERE name = 'Guilt-Free Spending';
INSERT INTO pex.subcategories (category_id, name, description, is_custom) 
SELECT id, 'Entertainment', 'Movies, concerts, events', false FROM pex.categories WHERE name = 'Guilt-Free Spending';
INSERT INTO pex.subcategories (category_id, name, description, is_custom) 
SELECT id, 'Shopping', 'Clothes, gadgets, etc', false FROM pex.categories WHERE name = 'Guilt-Free Spending';
INSERT INTO pex.subcategories (category_id, name, description, is_custom) 
SELECT id, 'Hobbies', 'Personal interests', false FROM pex.categories WHERE name = 'Guilt-Free Spending';
INSERT INTO pex.subcategories (category_id, name, description, is_custom) 
SELECT id, 'Health & Fitness', 'Gym, sports, wellness', false FROM pex.categories WHERE name = 'Guilt-Free Spending';

-- Misc subcategories
INSERT INTO pex.subcategories (category_id, name, description, is_custom) 
SELECT id, 'Untracked', 'Transactions without a category', false FROM pex.categories WHERE name = 'Misc';

-- Accounts table (bank, cash, credit cards)
CREATE TABLE pex.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('checking', 'savings', 'credit_card', 'cash', 'investment')),
  institution TEXT,  account_number TEXT,  balance DECIMAL(12, 2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  color TEXT DEFAULT '#6366f1',
  is_active BOOLEAN DEFAULT true,
  include_in_budget BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON COLUMN pex.accounts.include_in_budget IS 'If true, transactions from this account are included in budget calculations. Set to false for savings/investment accounts that receive transfers but should not be tracked in daily budget.';

-- Monthly budgets table
CREATE TABLE pex.monthly_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_budget_per_month UNIQUE(user_id, month, year)
);

-- Budget items table
CREATE TABLE pex.budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID REFERENCES pex.monthly_budgets(id) ON DELETE CASCADE,
  subcategory_id UUID REFERENCES pex.subcategories(id) ON DELETE CASCADE,
  planned_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  due_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_budget_item UNIQUE(budget_id, subcategory_id)
);

-- Transactions table
CREATE TABLE pex.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES pex.accounts(id) ON DELETE CASCADE,
  subcategory_id UUID REFERENCES pex.subcategories(id) ON DELETE SET NULL,
  transfer_to_account_id UUID REFERENCES pex.accounts(id) ON DELETE CASCADE,
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
    (subcategory_id IS NOT NULL AND transfer_to_account_id IS NULL) OR
    (subcategory_id IS NULL AND transfer_to_account_id IS NOT NULL)
  )
);

COMMENT ON COLUMN pex.transactions.transfer_to_account_id IS 'For transfers between accounts. Mutually exclusive with subcategory_id.';
COMMENT ON COLUMN pex.transactions.reference_number IS 'Transaction reference number (e.g., check number, transaction ID)';
COMMENT ON COLUMN pex.transactions.reference IS 'Additional reference information or memo';
COMMENT ON CONSTRAINT check_category_or_transfer ON pex.transactions IS 'Ensures transaction is either categorized OR a transfer, not both.';

-- Due date reminders table
CREATE TABLE pex.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  budget_item_id UUID REFERENCES pex.budget_items(id) ON DELETE CASCADE,
  due_date DATE NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_reminder_per_budget_item UNIQUE(budget_item_id)
);

-- Indexes for performance
CREATE INDEX idx_subcategories_category ON pex.subcategories(category_id);
CREATE INDEX idx_subcategories_user ON pex.subcategories(user_id);
CREATE INDEX idx_accounts_user ON pex.accounts(user_id);
CREATE INDEX idx_monthly_budgets_user ON pex.monthly_budgets(user_id);
CREATE INDEX idx_monthly_budgets_date ON pex.monthly_budgets(year, month);
CREATE INDEX idx_budget_items_budget ON pex.budget_items(budget_id);
CREATE INDEX idx_budget_items_subcategory ON pex.budget_items(subcategory_id);
CREATE INDEX idx_transactions_user ON pex.transactions(user_id);
CREATE INDEX idx_transactions_account ON pex.transactions(account_id);
CREATE INDEX idx_transactions_subcategory ON pex.transactions(subcategory_id);
CREATE INDEX idx_transactions_date ON pex.transactions(transaction_date);
CREATE INDEX idx_reminders_user ON pex.reminders(user_id);
CREATE INDEX idx_reminders_due_date ON pex.reminders(due_date, is_completed);

-- Row Level Security (RLS) Policies
ALTER TABLE pex.subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE pex.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pex.monthly_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE pex.budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pex.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pex.reminders ENABLE ROW LEVEL SECURITY;

-- Subcategories policies
CREATE POLICY "Users can view all subcategories including predefined ones"
  ON pex.subcategories FOR SELECT
  USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can create their own subcategories"
  ON pex.subcategories FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own subcategories"
  ON pex.subcategories FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own subcategories"
  ON pex.subcategories FOR DELETE
  USING (user_id = auth.uid());

-- Accounts policies
CREATE POLICY "Users can view their own accounts"
  ON pex.accounts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own accounts"
  ON pex.accounts FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own accounts"
  ON pex.accounts FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own accounts"
  ON pex.accounts FOR DELETE
  USING (user_id = auth.uid());

-- Monthly budgets policies
CREATE POLICY "Users can view their own budgets"
  ON pex.monthly_budgets FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own budgets"
  ON pex.monthly_budgets FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own budgets"
  ON pex.monthly_budgets FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own budgets"
  ON pex.monthly_budgets FOR DELETE
  USING (user_id = auth.uid());

-- Budget items policies
CREATE POLICY "Users can view their own budget items"
  ON pex.budget_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pex.monthly_budgets 
      WHERE monthly_budgets.id = budget_items.budget_id 
      AND monthly_budgets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create budget items for their budgets"
  ON pex.budget_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pex.monthly_budgets 
      WHERE monthly_budgets.id = budget_id 
      AND monthly_budgets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own budget items"
  ON pex.budget_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM pex.monthly_budgets 
      WHERE monthly_budgets.id = budget_items.budget_id 
      AND monthly_budgets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own budget items"
  ON pex.budget_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM pex.monthly_budgets 
      WHERE monthly_budgets.id = budget_items.budget_id 
      AND monthly_budgets.user_id = auth.uid()
    )
  );

-- Transactions policies
CREATE POLICY "Users can view their own transactions"
  ON pex.transactions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own transactions"
  ON pex.transactions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own transactions"
  ON pex.transactions FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own transactions"
  ON pex.transactions FOR DELETE
  USING (user_id = auth.uid());

-- Reminders policies
CREATE POLICY "Users can view their own reminders"
  ON pex.reminders FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own reminders"
  ON pex.reminders FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own reminders"
  ON pex.reminders FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own reminders"
  ON pex.reminders FOR DELETE
  USING (user_id = auth.uid());

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION pex.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updating timestamps
CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON pex.accounts
  FOR EACH ROW
  EXECUTE FUNCTION pex.update_updated_at_column();

CREATE TRIGGER update_monthly_budgets_updated_at
  BEFORE UPDATE ON pex.monthly_budgets
  FOR EACH ROW
  EXECUTE FUNCTION pex.update_updated_at_column();

CREATE TRIGGER update_budget_items_updated_at
  BEFORE UPDATE ON pex.budget_items
  FOR EACH ROW
  EXECUTE FUNCTION pex.update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON pex.transactions
  FOR EACH ROW
  EXECUTE FUNCTION pex.update_updated_at_column();

-- Function to copy budget from previous month
CREATE OR REPLACE FUNCTION pex.copy_budget_from_previous_month(
  p_user_id UUID,
  p_month INTEGER,
  p_year INTEGER
)
RETURNS UUID AS $$
DECLARE
  v_previous_month INTEGER;
  v_previous_year INTEGER;
  v_previous_budget_id UUID;
  v_new_budget_id UUID;
BEGIN
  -- Calculate previous month
  IF p_month = 1 THEN
    v_previous_month := 12;
    v_previous_year := p_year - 1;
  ELSE
    v_previous_month := p_month - 1;
    v_previous_year := p_year;
  END IF;

  -- Find previous budget
  SELECT id INTO v_previous_budget_id
  FROM pex.monthly_budgets
  WHERE user_id = p_user_id
    AND month = v_previous_month
    AND year = v_previous_year;

  IF v_previous_budget_id IS NULL THEN
    RAISE EXCEPTION 'No budget found for previous month';
  END IF;

  -- Create new budget
  INSERT INTO pex.monthly_budgets (user_id, month, year)
  VALUES (p_user_id, p_month, p_year)
  RETURNING id INTO v_new_budget_id;

  -- Copy budget items
  INSERT INTO pex.budget_items (budget_id, subcategory_id, planned_amount, notes)
  SELECT v_new_budget_id, subcategory_id, planned_amount, notes
  FROM pex.budget_items
  WHERE budget_id = v_previous_budget_id;

  RETURN v_new_budget_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View for budget summary with actual spending
CREATE OR REPLACE VIEW pex.budget_summary AS
SELECT
  bi.id AS budget_item_id,
  mb.id AS budget_id,
  mb.user_id,
  mb.month,
  mb.year,
  c.id AS category_id,
  c.name AS category_name,
  c.color AS category_color,
  sc.id AS subcategory_id,
  sc.name AS subcategory_name,
  bi.planned_amount,
  bi.due_date,
  COALESCE(
    (SELECT SUM(ABS(t.amount))
     FROM pex.transactions t
     WHERE t.subcategory_id = sc.id
       AND t.user_id = mb.user_id
       AND EXTRACT(MONTH FROM t.transaction_date) = mb.month
       AND EXTRACT(YEAR FROM t.transaction_date) = mb.year
       AND t.amount < 0), -- negative amounts are expenses
    0
  ) AS actual_amount,
  bi.planned_amount - COALESCE(
    (SELECT SUM(ABS(t.amount))
     FROM pex.transactions t
     WHERE t.subcategory_id = sc.id
       AND t.user_id = mb.user_id
       AND EXTRACT(MONTH FROM t.transaction_date) = mb.month
       AND EXTRACT(YEAR FROM t.transaction_date) = mb.year
       AND t.amount < 0),
    0
  ) AS remaining_amount
FROM pex.budget_items bi
JOIN pex.monthly_budgets mb ON bi.budget_id = mb.id
JOIN pex.subcategories sc ON bi.subcategory_id = sc.id
JOIN pex.categories c ON sc.category_id = c.id;

-- Grant permissions to Supabase roles
GRANT USAGE ON SCHEMA pex TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA pex TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA pex TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA pex TO anon, authenticated;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA pex GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA pex GRANT ALL ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA pex GRANT ALL ON FUNCTIONS TO anon, authenticated;
