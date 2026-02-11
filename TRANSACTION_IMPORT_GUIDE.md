# Transaction Import Guide

## Category Types: Income vs Expense

The system now distinguishes between **income** and **expense** categories using a `type` field in the database.

## Account Tracking for Planning

Accounts have an `include_in_plan` flag to distinguish between:
- **Plan-tracked accounts** (`include_in_plan = true`): Checking, credit cards, cash - used for daily spending
- **Savings/Investment accounts** (`include_in_plan = false`): Excluded from plan calculations

### Why This Matters

When you transfer $500 to your savings account:
- It's tracked as an "expense" in your Savings subcategory
- Money leaves your checking account (plan-tracked)
- Money enters your savings account (NOT plan-tracked)
- Your net worth stays the same
- Your available funds for planning decreases (which is correct!)

This prevents double-counting and accurately reflects that you've allocated money away from your spending plan.

### Database Schema

The `categories` table now includes a `type` field:

```sql
CREATE TABLE public.categories (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  color TEXT,
  sort_order INTEGER,
  created_at TIMESTAMP
);
```

### Predefined Categories

| Category | Type | Description |
|----------|------|-------------|
| Income | `income` | All sources of money coming in (salary, freelance, etc.) |
| Investments | `expense` | Money allocated for wealth building |
| Savings | `expense` | Money set aside for goals and emergencies |
| Fixed Costs | `expense` | Essential recurring expenses |
| Guilt-Free Spending | `expense` | Discretionary spending |

## How to Use for Transaction Imports

### 1. **Importing Bank Transactions**

When importing transactions from a CSV file or bank API:

```typescript
// Example transaction import logic
function categorizeTransaction(transaction: BankTransaction) {
  const amount = transaction.amount
  
  // Positive amounts = money coming in
  if (amount > 0) {
    // Look for matching Income subcategories
    // e.g., "Salary", "Freelance", "Side Hustle"
    return findBestMatchingSubcategory(transaction.description, 'income')
  }
  
  // Negative amounts = money going out
  if (amount < 0) {
    // Look for matching Expense subcategories
    // e.g., "Rent/Mortgage", "Groceries", "Dining Out"
    return findBestMatchingSubcategory(transaction.description, 'expense')
  }
}
```

### 2. **Transaction Amount Handling**

```typescript
// Store transaction amounts as follows:
interface Transaction {
  amount: number // Always store absolute value
  subcategory_id: string
  // ... other fields
}

// When displaying or calculating:
const category = await getCategory(transaction.subcategory_id)

const effectiveAmount = category.type === 'income' 
  ? transaction.amount  // Positive for income
  : -transaction.amount // Negative for expenses
```

### 3. **Plan Calculations**

```typescript
// Calculate net cash flow
function calculateCashFlow(transactions: Transaction[]) {
  let income = 0
  let expenses = 0
  
  for (const transaction of transactions) {
    const category = getCategory(transaction.subcategory_id)
    
    if (category.type === 'income') {
      income += transaction.amount
    } else {
      expenses += transaction.amount
    }
  }
  
  return {
    income,
    expenses,
    net: income - expenses
  }
}
```

### 4. **Matching Transactions to Subcategories**

Use keyword matching or machine learning to auto-categorize:

```typescript
const categoryKeywords = {
  'Salary': ['payroll', 'salary', 'wages'],
  'Dining Out': ['restaurant', 'cafe', 'food', 'uber eats', 'doordash'],
  'Groceries': ['grocery', 'supermarket', 'whole foods', 'trader joe'],
  'Rent/Mortgage': ['rent', 'mortgage', 'housing'],
  // ... etc
}

function findBestMatchingSubcategory(
  description: string, 
  categoryType: 'income' | 'expense'
) {
  const lowerDesc = description.toLowerCase()
  
  // Get all subcategories of the matching type
  const subcategories = getSubcategoriesByType(categoryType)
  
  // Find best keyword match
  for (const sub of subcategories) {
    const keywords = categoryKeywords[sub.name] || []
    if (keywords.some(keyword => lowerDesc.includes(keyword))) {
      return sub.id
    }
  }
  
  // Return null if no match found (user will categorize manually)
  return null
}
```

## Example CSV Import Flow

1. **Parse CSV file** with columns: `date`, `description`, `amount`
2. **Determine type** based on amount sign (+ = income, - = expense)
3. **Auto-categorize** using keyword matching
4. **Store transaction** with absolute amount value
5. **Flag unmatched** transactions for manual categorization
### 6. **Calculate Plan** using category types

## Query Examples

### Get All Income
```sql
SELECT t.*, s.name as subcategory, c.name as category
FROM public.transactions t
JOIN public.subcategories s ON t.subcategory_id = s.id
JOIN public.categories c ON s.category_id = c.id
WHERE c.type = 'income'
AND t.transaction_date >= '2026-02-01'
AND t.transaction_date < '2026-03-01';
```

### Get All Expenses
```sql
SELECT t.*, s.name as subcategory, c.name as category
FROM public.transactions t
JOIN public.subcategories s ON t.subcategory_id = s.id
JOIN public.categories c ON s.category_id = c.id
WHERE c.type = 'expense'
AND t.transaction_date >= '2026-02-01'
AND t.transaction_date < '2026-03-01';
```

### Calculate Monthly Cash Flow
```sql
SELECT 
  c.type,
  SUM(t.amount) as total
FROM public.transactions t
JOIN public.subcategories s ON t.subcategory_id = s.id
JOIN public.categories c ON s.category_id = c.id
WHERE t.transaction_date >= '2026-02-01'
AND t.transaction_date < '2026-03-01'
GROUP BY c.type;
```

## Benefits

✅ **Automatic categorization** - System knows if money is coming in or going out  
✅ **Accurate planning** - Income adds, expenses subtract  
✅ **Clear reporting** - Easy to calculate net cash flow  
✅ **Import friendly** - Works seamlessly with bank CSV imports  
✅ **Flexible matching** - Can use keywords, ML, or user rules to categorize

---

## Account Setup & Transfer Handling

### Account Types and Planning Inclusion

The `accounts` table includes an `include_in_plan` field:

```sql
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY,
  user_id UUID,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('checking', 'savings', 'credit_card', 'cash', 'investment')),
  balance DECIMAL(12, 2),
  include_in_plan BOOLEAN DEFAULT true,
  -- ... other fields
);
```

### Recommended Account Setup

| Account Type | `include_in_plan` | Purpose | Example |
|-------------|-------------------|---------|---------|
| Checking | `true` | Daily spending, bills | Chase Checking |
| Credit Card | `true` | Purchases tracked in plan | Amex Gold |
| Cash | `true` | Cash transactions | Wallet |
| Savings | `false` | Emergency fund, goals | Ally Savings |
| Investment | `false` | 401(k), IRA, Brokerage | Vanguard 401(k) |

### How Transfers Work

When you move money from checking → savings:

```typescript
// Transaction 1: Money leaves checking account
{
  account_id: 'checking_account_id',
  subcategory_id: 'emergency_fund_subcategory_id', // Under "Savings" category
  amount: 500.00,
  description: 'Transfer to savings',
  transaction_date: '2026-02-08'
}

// Transaction 2: Money enters savings account (optional to track)
{
  account_id: 'savings_account_id',
  subcategory_id: null, // or a special "Transfer In" subcategory
  amount: 500.00,
  description: 'Transfer from checking',
  transaction_date: '2026-02-08'
}
```

### Plan Calculations

Only transactions from accounts with `include_in_plan = true` are counted:

```sql
-- Get plan vs actual for a month
SELECT 
  c.name as category,
  s.name as subcategory,
  pi.planned_amount,
  COALESCE(SUM(t.amount), 0) as actual_amount
FROM public.plan_items pi
JOIN public.subcategories s ON pi.subcategory_id = s.id
JOIN public.categories c ON s.category_id = c.id
LEFT JOIN public.transactions t ON t.subcategory_id = s.id 
  AND DATE_TRUNC('month', t.transaction_date) = '2026-02-01'
  AND t.account_id IN (
    SELECT id FROM public.accounts 
    WHERE user_id = $1 
    AND include_in_plan = true
  )
WHERE pi.plan_id = $2
GROUP BY c.name, s.name, pi.planned_amount;
```

### Dashboard Calculations

#### Plan Tracking (Checking + Credit Cards + Cash)
```sql
-- Only accounts with include_in_plan = true
SELECT 
  SUM(CASE WHEN c.type = 'income' THEN t.amount ELSE 0 END) as total_income,
  SUM(CASE WHEN c.type = 'expense' THEN t.amount ELSE 0 END) as total_expenses
FROM public.transactions t
JOIN public.accounts a ON t.account_id = a.id
JOIN public.subcategories s ON t.subcategory_id = s.id
JOIN public.categories c ON s.category_id = c.id
WHERE a.user_id = $1
  AND a.include_in_plan = true
  AND t.transaction_date >= '2026-02-01'
  AND t.transaction_date < '2026-03-01';
```

#### Net Worth (All Accounts)
```sql
-- Include all accounts regardless of include_in_plan
SELECT SUM(balance) as net_worth
FROM public.accounts
WHERE user_id = $1 AND is_active = true;
```

### Example Scenario

**Accounts:**
- Chase Checking: $3,000 (`include_in_plan = true`)
- Ally Savings: $10,000 (`include_in_plan = false`)
- Vanguard 401(k): $50,000 (`include_in_plan = false`)

**February Plan:**
- Income: Salary = $5,000 (planned)
- Expenses:
  - Emergency Fund = $500 (planned)
  - Rent = $1,500 (planned)
  - Groceries = $600 (planned)
  - etc.

**Import Transactions:**
```csv
date,description,amount,account
2026-02-01,Payroll Deposit,5000.00,Chase Checking
2026-02-01,Rent Payment,-1500.00,Chase Checking
2026-02-05,Transfer to Savings,-500.00,Chase Checking
2026-02-10,Grocery Store,-125.50,Chase Checking
```

**After Import:**
1. Payroll → Categorized as "Salary" (Income)
2. Rent → Categorized as "Rent/Mortgage" (Fixed Costs)
3. Transfer → Categorized as "Emergency Fund" (Savings) ← This is the key!
4. Groceries → Categorized as "Groceries" (Fixed Costs)

**Plan Dashboard Shows:**
- Available to plan: $5,000 (income)
- Allocated: $2,125.50 (rent + transfer + groceries)
- Remaining: $2,874.50

**Accounts Page Shows:**
- Chase Checking: $2,874.50 (included in planning)
- Ally Savings: $10,500.00 (excluded from planning, but shown for net worth)
- Total Net Worth: $63,374.50

### Integration Tips

#### 1. **When Creating Accounts**
```typescript
async function createAccount(data: AccountInput) {
  // Auto-set include_in_plan based on account type
  const includeInPlan = data.type === 'checking' || 
                       data.type === 'credit_card' || 
                       data.type === 'cash'
  
  await supabase.from('accounts').insert({
    ...data,
    include_in_plan: includeInPlan
  })
}
```

#### 2. **When Importing Transactions**
```typescript
// Check if the account is plan-tracked
const account = await getAccount(transaction.account_id)

if (account.include_in_plan) {
  // This transaction affects the plan
  await matchToSubcategory(transaction)
} else {
  // This is a savings/investment account
  // Optionally track for net worth, but don't affect plan
  transaction.subcategory_id = null // or a special "Transfer In" category
}
```

#### 3. **Transfer Detection**
```typescript
function detectTransfer(transaction: Transaction): boolean {
  const keywords = ['transfer', 'xfer', 'move money', 'internal transfer']
  return keywords.some(k => 
    transaction.description.toLowerCase().includes(k)
  )
}

async function handleTransfer(transaction: Transaction) {
  // Find matching Savings or Investment subcategory
  const category = amount > 0 ? 'income' : 'expense'
  
  if (detectTransfer(transaction)) {
    // It's a transfer to savings/investment
    return findSubcategoryByName('Emergency Fund') // or prompt user
  }
  
  // Regular transaction
  return autoCateg
orize(transaction)
}
```

## Summary

✅ **Tracked accounts** (checking, credit card, cash) → `include_in_plan = true`  
✅ **Savings/Investment accounts** → `include_in_plan = false`  
✅ **Transfers** are categorized as expenses under Savings/Investments categories  
✅ **Dashboard** only shows tracked account transactions  
✅ **Net worth** includes all accounts  
✅ **No double-counting** of transfers
