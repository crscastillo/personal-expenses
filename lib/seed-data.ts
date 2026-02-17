import { createClient } from '@/lib/supabase/client'

export async function seedDefaultExpenseGroups(userId: string) {
  const supabase = createClient()

  // Create user-specific expense groups (formerly categories)
  const expenseGroups = [
    { user_id: userId, name: 'Income', description: 'All sources of income', type: 'income', color: '#22c55e', sort_order: 1, is_system: false },
    { user_id: userId, name: 'Investments', description: 'Long-term wealth building (10%)', type: 'expense', color: '#8b5cf6', sort_order: 2, is_system: false },
    { user_id: userId, name: 'Savings', description: 'Emergency fund and goals (5-10%)', type: 'expense', color: '#3b82f6', sort_order: 3, is_system: false },
    { user_id: userId, name: 'Fixed Costs', description: 'Essential expenses (50-60%)', type: 'expense', color: '#ef4444', sort_order: 4, is_system: false },
    { user_id: userId, name: 'Guilt-Free Spending', description: 'Enjoy life (20-35%)', type: 'expense', color: '#f59e0b', sort_order: 5, is_system: false },
    { user_id: userId, name: 'Misc', description: 'Uncategorized and other expenses', type: 'expense', color: '#6b7280', sort_order: 6, is_system: false },
  ]

  const { data: insertedGroups, error: groupError } = await supabase
    .from('expense_groups')
    .insert(expenseGroups)
    .select()

  if (groupError) {
    console.error('Error creating expense groups:', groupError)
    throw groupError
  }

  // Create a map of group names to IDs
  const groupMap = (insertedGroups || []).reduce((acc, group) => {
    acc[group.name] = group.id
    return acc
  }, {} as Record<string, string>)

  // Create user-specific expense categories based on Ramit Sethi's Conscious Spending Plan
  const expenseCategories = [
    // Income categories
    { expense_group_id: groupMap['Income'], user_id: userId, name: 'Salary/Wages', description: 'Primary income from employment', is_custom: true },
    { expense_group_id: groupMap['Income'], user_id: userId, name: 'Side Hustle', description: 'Freelance, consulting, gig work', is_custom: true },
    { expense_group_id: groupMap['Income'], user_id: userId, name: 'Bonuses', description: 'Work bonuses and commissions', is_custom: true },
    { expense_group_id: groupMap['Income'], user_id: userId, name: 'Gifts/Other', description: 'Gifts and miscellaneous income', is_custom: true },

    // Fixed Costs categories (50-60% of take-home pay)
    { expense_group_id: groupMap['Fixed Costs'], user_id: userId, name: 'Rent/Mortgage', description: 'Monthly housing payment', is_custom: true },
    { expense_group_id: groupMap['Fixed Costs'], user_id: userId, name: 'Utilities', description: 'Electric, gas, water, trash', is_custom: true },
    { expense_group_id: groupMap['Fixed Costs'], user_id: userId, name: 'Internet/Phone', description: 'Internet and cell phone', is_custom: true },
    { expense_group_id: groupMap['Fixed Costs'], user_id: userId, name: 'Groceries', description: 'Food and household essentials', is_custom: true },
    { expense_group_id: groupMap['Fixed Costs'], user_id: userId, name: 'Transportation', description: 'Car payment, gas, public transit', is_custom: true },
    { expense_group_id: groupMap['Fixed Costs'], user_id: userId, name: 'Insurance', description: 'Health, auto, life, renters/home', is_custom: true },
    { expense_group_id: groupMap['Fixed Costs'], user_id: userId, name: 'Debt Payments', description: 'Student loans, credit cards, other debt', is_custom: true },
    { expense_group_id: groupMap['Fixed Costs'], user_id: userId, name: 'Childcare', description: 'Daycare, nanny, after-school care', is_custom: true },
    { expense_group_id: groupMap['Fixed Costs'], user_id: userId, name: 'Subscriptions', description: 'Essential subscriptions (not entertainment)', is_custom: true },

    // Investments categories (10% of take-home pay)
    { expense_group_id: groupMap['Investments'], user_id: userId, name: '401(k)', description: 'Employer-sponsored 401k', is_custom: true },
    { expense_group_id: groupMap['Investments'], user_id: userId, name: 'Roth IRA', description: 'After-tax retirement account', is_custom: true },
    { expense_group_id: groupMap['Investments'], user_id: userId, name: 'Traditional IRA', description: 'Pre-tax retirement account', is_custom: true },
    { expense_group_id: groupMap['Investments'], user_id: userId, name: 'Taxable Brokerage', description: 'Non-retirement investment account', is_custom: true },
    { expense_group_id: groupMap['Investments'], user_id: userId, name: 'HSA', description: 'Health Savings Account', is_custom: true },
    { expense_group_id: groupMap['Investments'], user_id: userId, name: 'SEP IRA', description: 'Self-employed retirement', is_custom: true },

    // Savings categories (5-10% of take-home pay)
    { expense_group_id: groupMap['Savings'], user_id: userId, name: 'Emergency Fund', description: '3-6 months of expenses', is_custom: true },
    { expense_group_id: groupMap['Savings'], user_id: userId, name: 'Vacation Fund', description: 'Travel and trips', is_custom: true },
    { expense_group_id: groupMap['Savings'], user_id: userId, name: 'House Down Payment', description: 'Saving for home purchase', is_custom: true },
    { expense_group_id: groupMap['Savings'], user_id: userId, name: 'Car/Large Purchase', description: 'Vehicle or major purchase', is_custom: true },
    { expense_group_id: groupMap['Savings'], user_id: userId, name: 'Wedding', description: 'Wedding expenses', is_custom: true },
    { expense_group_id: groupMap['Savings'], user_id: userId, name: 'Education', description: 'Future education costs', is_custom: true },
    { expense_group_id: groupMap['Savings'], user_id: userId, name: 'Other Goals', description: 'Other specific savings goals', is_custom: true },

    // Guilt-Free Spending categories (20-35% of take-home pay)
    { expense_group_id: groupMap['Guilt-Free Spending'], user_id: userId, name: 'Dining Out', description: 'Restaurants, bars, coffee shops', is_custom: true },
    { expense_group_id: groupMap['Guilt-Free Spending'], user_id: userId, name: 'Entertainment', description: 'Movies, concerts, shows, events', is_custom: true },
    { expense_group_id: groupMap['Guilt-Free Spending'], user_id: userId, name: 'Shopping', description: 'Clothes, gadgets, home decor', is_custom: true },
    { expense_group_id: groupMap['Guilt-Free Spending'], user_id: userId, name: 'Hobbies', description: 'Sports, crafts, collections', is_custom: true },
    { expense_group_id: groupMap['Guilt-Free Spending'], user_id: userId, name: 'Gym/Fitness', description: 'Gym membership, classes, sports', is_custom: true },
    { expense_group_id: groupMap['Guilt-Free Spending'], user_id: userId, name: 'Personal Care', description: 'Haircuts, spa, beauty', is_custom: true },
    { expense_group_id: groupMap['Guilt-Free Spending'], user_id: userId, name: 'Subscriptions', description: 'Netflix, Spotify, fun subscriptions', is_custom: true },
    { expense_group_id: groupMap['Guilt-Free Spending'], user_id: userId, name: 'Fun Money', description: 'Whatever you want, no guilt!', is_custom: true },

    // Misc categories
    { expense_group_id: groupMap['Misc'], user_id: userId, name: 'Untracked', description: 'Uncategorized transactions', is_custom: true },
  ]

  const { data: insertedCategories, error: catError } = await supabase
    .from('expense_categories')
    .insert(expenseCategories)
    .select()

  if (catError) {
    console.error('Error creating expense categories:', catError)
    throw catError
  }

  // Create expense category map for easy lookup
  const categoryMap = (insertedCategories || []).reduce((acc, cat) => {
    acc[cat.name] = cat.id
    return acc
  }, {} as Record<string, string>)

  return { expenseGroups: insertedGroups, groupMap, categoryMap }
}

export async function seedDefaultPlanItems(userId: string, categoryMap?: Record<string, string>) {
  const supabase = createClient()
  
  // Get current month and year
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  
  // Create or get the current month's plan
  const { data: existingPlan } = await supabase
    .from('monthly_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('month', currentMonth)
    .eq('year', currentYear)
    .single()
  
  let planId: string
  
  if (existingPlan) {
    planId = existingPlan.id
  } else {
    const { data: newPlan, error: planError } = await supabase
      .from('monthly_plans')
      .insert({
        user_id: userId,
        month: currentMonth,
        year: currentYear,
      })
      .select()
      .single()
    
    if (planError) {
      console.error('Error creating monthly plan:', planError)
      throw planError
    }
    
    planId = newPlan.id
  }
  
  // Use provided categoryMap or fetch expense categories
  let categoryIds: string[]
  
  if (categoryMap) {
    // Use the provided map
    categoryIds = Object.values(categoryMap)
  } else {
    // Fetch expense categories if not provided
    const { data: expenseCategories, error: catError } = await supabase
      .from('expense_categories')
      .select('id')
      .eq('user_id', userId)
    
    if (catError) {
      console.error('Error fetching expense categories:', catError)
      throw catError
    }
    
    categoryIds = (expenseCategories || []).map(cat => cat.id)
  }
  
  // Create plan items for each expense category with planned_amount of 0
  const planItems = categoryIds.map(categoryId => ({
    plan_id: planId,
    expense_category_id: categoryId,
    planned_amount: 0,
  }))
  
  const { error: planItemsError } = await supabase
    .from('plan_items')
    .insert(planItems)
  
  if (planItemsError) {
    console.error('Error creating plan items:', planItemsError)
    throw planItemsError
  }
  
  return { planId, planItemsCount: planItems.length }
}

export async function seedTestData(userId: string, categoryMap: Record<string, string>) {
  const supabase = createClient()
  const now = new Date()

  // Use the provided categoryMap instead of fetching
  const catMap = categoryMap

  // Create test accounts
  const accounts = [
    {
      user_id: userId,
      name: 'Chase Checking',
      type: 'checking',
      institution: 'Chase Bank',
      account_number: '****1234',
      balance: 5420.50,
      color: '#3b82f6',
      include_in_plan: true,
    },
    {
      user_id: userId,
      name: 'Ally Savings',
      type: 'savings',
      institution: 'Ally Bank',
      account_number: '****5678',
      balance: 12500.00,
      color: '#22c55e',
      include_in_plan: false,
    },
    {
      user_id: userId,
      name: 'Amex Blue Cash',
      type: 'credit_card',
      institution: 'American Express',
      account_number: '****9012',
      balance: -845.32,
      color: '#8b5cf6',
      include_in_plan: true,
    },
    {
      user_id: userId,
      name: 'Vanguard 401k',
      type: 'investment',
      institution: 'Vanguard',
      account_number: '****3456',
      balance: 45680.00,
      color: '#f59e0b',
      include_in_plan: false,
    },
  ]

  const { data: insertedAccounts, error: accError } = await supabase
    .from('accounts')
    .insert(accounts)
    .select()

  if (accError) {
    console.error('Error creating accounts:', accError)
    throw accError
  }

  // Create initial balance transactions for each account
  const initialBalanceTransactions = insertedAccounts.map(account => ({
    user_id: userId,
    account_id: account.id,
    expense_category_id: catMap['Untracked'],
    transaction_date: new Date(now.getFullYear(), now.getMonth(), 1),
    description: 'Initial Balance',
    amount: account.balance,
    notes: 'Opening balance',
  }))

  const { error: initialBalanceError } = await supabase
    .from('transactions')
    .insert(initialBalanceTransactions)

  if (initialBalanceError) {
    console.error('Error creating initial balance transactions:', initialBalanceError)
    throw initialBalanceError
  }

  // Create test transactions for the current month
  const transactions = [
    // Income
    { account_id: insertedAccounts[0].id, expense_category_id: catMap['Salary/Wages'], transaction_date: new Date(now.getFullYear(), now.getMonth(), 1), description: 'Paycheck - First Half', amount: 2250, reference_number: 'PAY-0001', reference: 'Direct deposit - First paycheck of month' },
    { account_id: insertedAccounts[0].id, expense_category_id: catMap['Salary/Wages'], transaction_date: new Date(now.getFullYear(), now.getMonth(), 15), description: 'Paycheck - Second Half', amount: 2250, reference_number: 'PAY-0002', reference: 'Direct deposit - Second paycheck of month' },
    { account_id: insertedAccounts[0].id, expense_category_id: catMap['Side Hustle'], transaction_date: new Date(now.getFullYear(), now.getMonth(), 10), description: 'Web Design Project', amount: 500, reference_number: 'INV-2024', reference: 'Client: Acme Corp' },
    
    // Fixed Costs
    { account_id: insertedAccounts[0].id, expense_category_id: catMap['Rent/Mortgage'], transaction_date: new Date(now.getFullYear(), now.getMonth(), 1), description: 'Rent Payment', amount: -1500, reference_number: 'CHK-1001', reference: 'Monthly rent - February 2026' },
    { account_id: insertedAccounts[2].id, expense_category_id: catMap['Utilities'], transaction_date: new Date(now.getFullYear(), now.getMonth(), 5), description: 'Electric Company', amount: -120.50, reference_number: 'UTIL-5523' },
    { account_id: insertedAccounts[2].id, expense_category_id: catMap['Internet/Phone'], transaction_date: new Date(now.getFullYear(), now.getMonth(), 3), description: 'Verizon Wireless', amount: -85 },
    { account_id: insertedAccounts[0].id, expense_category_id: catMap['Insurance'], transaction_date: new Date(now.getFullYear(), now.getMonth(), 1), description: 'Health Insurance', amount: -400, reference: 'Policy #12345678' },
    { account_id: insertedAccounts[2].id, expense_category_id: catMap['Subscriptions'], transaction_date: new Date(now.getFullYear(), now.getMonth(), 8), description: 'Netflix', amount: -15.99 },
    { account_id: insertedAccounts[2].id, expense_category_id: catMap['Subscriptions'], transaction_date: new Date(now.getFullYear(), now.getMonth(), 12), description: 'Spotify Premium', amount: -10.99 },
    { account_id: insertedAccounts[0].id, expense_category_id: catMap['Groceries'], transaction_date: new Date(now.getFullYear(), now.getMonth(), 4), description: 'Whole Foods', amount: -85.34 },
    { account_id: insertedAccounts[2].id, expense_category_id: catMap['Groceries'], transaction_date: new Date(now.getFullYear(), now.getMonth(), 11), description: 'Trader Joes', amount: -62.18 },
    
    // Investments
    { account_id: insertedAccounts[0].id, expense_category_id: catMap['401(k)'], transaction_date: new Date(now.getFullYear(), now.getMonth(), 1), description: '401k Contribution', amount: -300, reference: 'Automatic contribution' },
    { account_id: insertedAccounts[0].id, expense_category_id: catMap['Roth IRA'], transaction_date: new Date(now.getFullYear(), now.getMonth(), 1), description: 'Roth IRA Contribution', amount: -200, reference: 'Vanguard Target Retirement 2050' },
    
    // Savings
    { account_id: insertedAccounts[0].id, expense_category_id: catMap['Emergency Fund'], transaction_date: new Date(now.getFullYear(), now.getMonth(), 2), description: 'Emergency Fund Transfer', amount: -250 },
    { account_id: insertedAccounts[0].id, expense_category_id: catMap['Vacation Fund'], transaction_date: new Date(now.getFullYear(), now.getMonth(), 2), description: 'Vacation Savings', amount: -150, reference: 'Summer vacation fund' },
    
    // Guilt-Free Spending
    { account_id: insertedAccounts[2].id, expense_category_id: catMap['Dining Out'], transaction_date: new Date(now.getFullYear(), now.getMonth(), 6), description: 'Italian Restaurant', amount: -65 },
    { account_id: insertedAccounts[2].id, expense_category_id: catMap['Dining Out'], transaction_date: new Date(now.getFullYear(), now.getMonth(), 13), description: 'Starbucks', amount: -12.50 },
    { account_id: insertedAccounts[2].id, expense_category_id: catMap['Entertainment'], transaction_date: new Date(now.getFullYear(), now.getMonth(), 7), description: 'Movie Tickets', amount: -30 },
    { account_id: insertedAccounts[2].id, expense_category_id: catMap['Shopping'], transaction_date: new Date(now.getFullYear(), now.getMonth(), 9), description: 'Amazon Order', amount: -78.43 },
    { account_id: insertedAccounts[2].id, expense_category_id: catMap['Gym/Fitness'], transaction_date: new Date(now.getFullYear(), now.getMonth(), 1), description: 'Gym Membership', amount: -45 },
  ]

  // Transfers between accounts
  const transfers = [
    // Transfer from Checking to Savings: $500
    { account_id: insertedAccounts[0].id, transfer_to_account_id: insertedAccounts[1].id, transaction_date: new Date(now.getFullYear(), now.getMonth(), 3), description: 'Transfer to Savings', amount: -500 },
    { account_id: insertedAccounts[1].id, transfer_to_account_id: insertedAccounts[0].id, transaction_date: new Date(now.getFullYear(), now.getMonth(), 3), description: 'Transfer from Checking', amount: 500 },
    // Transfer from Savings to Investment: $1000
    { account_id: insertedAccounts[1].id, transfer_to_account_id: insertedAccounts[3].id, transaction_date: new Date(now.getFullYear(), now.getMonth(), 14), description: 'Transfer to Investment', amount: -1000 },
    { account_id: insertedAccounts[3].id, transfer_to_account_id: insertedAccounts[1].id, transaction_date: new Date(now.getFullYear(), now.getMonth(), 14), description: 'Transfer from Savings', amount: 1000 },
  ]

  // Insert categorized transactions
  const { error: transError } = await supabase
    .from('transactions')
    .insert(transactions.map(t => ({
      user_id: userId,
      account_id: t.account_id,
      expense_category_id: t.expense_category_id,
      transaction_date: t.transaction_date,
      description: t.description,
      amount: t.amount,
      reference_number: t.reference_number || null,
      reference: t.reference || null,
    })))

  if (transError) {
    console.error('Error creating transactions:', transError)
    throw transError
  }

  // Insert transfer transactions
  const { error: transferError } = await supabase
    .from('transactions')
    .insert(transfers.map(t => ({
      user_id: userId,
      account_id: t.account_id,
      transfer_to_account_id: t.transfer_to_account_id,
      transaction_date: t.transaction_date,
      description: t.description,
      amount: t.amount,
    })))

  if (transferError) {
    console.error('Error creating transfers:', transferError)
    throw transferError
  }

  return { 
    accounts: insertedAccounts, 
    transactionCount: initialBalanceTransactions.length + transactions.length + transfers.length 
  }
}
