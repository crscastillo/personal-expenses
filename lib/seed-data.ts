import { createClient } from '@/lib/supabase/client'

export async function seedDefaultCategories(userId: string) {
  const supabase = createClient()

  // Fetch existing categories (they're shared system-wide)
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order')

  if (catError) {
    console.error('Error fetching categories:', catError)
    throw catError
  }

  // Create a map of category names to IDs
  const categoryMap = categories.reduce((acc, cat) => {
    acc[cat.name] = cat.id
    return acc
  }, {} as Record<string, string>)

  // Create user-specific subcategories
  const subcategories = [
    // Income subcategories
    { category_id: categoryMap['Income'], user_id: userId, name: 'Salary', description: 'Primary income', is_custom: false },
    { category_id: categoryMap['Income'], user_id: userId, name: 'Freelance', description: 'Side projects and consulting', is_custom: false },
    { category_id: categoryMap['Income'], user_id: userId, name: 'Bonuses/Gifts', description: 'One-time income', is_custom: false },
    { category_id: categoryMap['Income'], user_id: userId, name: 'Other Income', description: 'Additional income sources', is_custom: false },

    // Investments subcategories
    { category_id: categoryMap['Investments'], user_id: userId, name: '401k', description: 'Employer retirement account', is_custom: false },
    { category_id: categoryMap['Investments'], user_id: userId, name: 'Roth IRA', description: 'Individual retirement account', is_custom: false },
    { category_id: categoryMap['Investments'], user_id: userId, name: 'Index Funds', description: 'Low-cost index funds', is_custom: false },
    { category_id: categoryMap['Investments'], user_id: userId, name: 'Brokerage', description: 'Taxable investment account', is_custom: false },

    // Savings subcategories
    { category_id: categoryMap['Savings'], user_id: userId, name: 'Emergency Fund', description: '3-6 months expenses', is_custom: false },
    { category_id: categoryMap['Savings'], user_id: userId, name: 'Vacation', description: 'Travel savings', is_custom: false },
    { category_id: categoryMap['Savings'], user_id: userId, name: 'Home Down Payment', description: 'House savings', is_custom: false },
    { category_id: categoryMap['Savings'], user_id: userId, name: 'Car', description: 'Vehicle purchase', is_custom: false },

    // Fixed Costs subcategories
    { category_id: categoryMap['Fixed Costs'], user_id: userId, name: 'Rent/Mortgage', description: 'Housing payment', is_custom: false },
    { category_id: categoryMap['Fixed Costs'], user_id: userId, name: 'Utilities', description: 'Electric, water, gas', is_custom: false },
    { category_id: categoryMap['Fixed Costs'], user_id: userId, name: 'Internet/Phone', description: 'Communication bills', is_custom: false },
    { category_id: categoryMap['Fixed Costs'], user_id: userId, name: 'Insurance', description: 'Health, car, home insurance', is_custom: false },
    { category_id: categoryMap['Fixed Costs'], user_id: userId, name: 'Subscriptions', description: 'Streaming, software, etc', is_custom: false },
    { category_id: categoryMap['Fixed Costs'], user_id: userId, name: 'Transportation', description: 'Car payment, public transit', is_custom: false },
    { category_id: categoryMap['Fixed Costs'], user_id: userId, name: 'Groceries', description: 'Food and household items', is_custom: false },

    // Guilt-Free Spending subcategories
    { category_id: categoryMap['Guilt-Free Spending'], user_id: userId, name: 'Dining Out', description: 'Restaurants and cafes', is_custom: false },
    { category_id: categoryMap['Guilt-Free Spending'], user_id: userId, name: 'Entertainment', description: 'Movies, concerts, events', is_custom: false },
    { category_id: categoryMap['Guilt-Free Spending'], user_id: userId, name: 'Shopping', description: 'Clothes, gadgets, etc', is_custom: false },
    { category_id: categoryMap['Guilt-Free Spending'], user_id: userId, name: 'Hobbies', description: 'Personal interests', is_custom: false },
    { category_id: categoryMap['Guilt-Free Spending'], user_id: userId, name: 'Health & Fitness', description: 'Gym, sports, wellness', is_custom: false },

    // Misc subcategories
    { category_id: categoryMap['Misc'], user_id: userId, name: 'Untracked', description: 'Transactions without a category', is_custom: false },
  ]

  const { error: subError } = await supabase
    .from('subcategories')
    .insert(subcategories)

  if (subError) {
    console.error('Error creating subcategories:', subError)
    throw subError
  }

  return { categories, categoryMap }
}

export async function seedTestData(userId: string, categoryMap: Record<string, string>) {
  const supabase = createClient()
  const now = new Date()

  // Get user's subcategories
  const { data: subcategories } = await supabase
    .from('subcategories')
    .select('*')
    .eq('user_id', userId)

  const subMap = subcategories?.reduce((acc, sub) => {
    acc[sub.name] = sub.id
    return acc
  }, {} as Record<string, string>) || {}

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
      include_in_budget: true,
    },
    {
      user_id: userId,
      name: 'Ally Savings',
      type: 'savings',
      institution: 'Ally Bank',
      account_number: '****5678',
      balance: 12500.00,
      color: '#22c55e',
      include_in_budget: false,
    },
    {
      user_id: userId,
      name: 'Amex Blue Cash',
      type: 'credit_card',
      institution: 'American Express',
      account_number: '****9012',
      balance: -845.32,
      color: '#8b5cf6',
      include_in_budget: true,
    },
    {
      user_id: userId,
      name: 'Vanguard 401k',
      type: 'investment',
      institution: 'Vanguard',
      account_number: '****3456',
      balance: 45680.00,
      color: '#f59e0b',
      include_in_budget: false,
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
    subcategory_id: subMap['Untracked'],
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
    { account_id: insertedAccounts[0].id, subcategory_id: subMap['Salary'], transaction_date: new Date(now.getFullYear(), now.getMonth(), 1), description: 'Paycheck - First Half', amount: 2250, reference_number: 'PAY-0001', reference: 'Direct deposit - First paycheck of month' },
    { account_id: insertedAccounts[0].id, subcategory_id: subMap['Salary'], transaction_date: new Date(now.getFullYear(), now.getMonth(), 15), description: 'Paycheck - Second Half', amount: 2250, reference_number: 'PAY-0002', reference: 'Direct deposit - Second paycheck of month' },
    { account_id: insertedAccounts[0].id, subcategory_id: subMap['Freelance'], transaction_date: new Date(now.getFullYear(), now.getMonth(), 10), description: 'Web Design Project', amount: 500, reference_number: 'INV-2024', reference: 'Client: Acme Corp' },
    
    // Fixed Costs
    { account_id: insertedAccounts[0].id, subcategory_id: subMap['Rent/Mortgage'], transaction_date: new Date(now.getFullYear(), now.getMonth(), 1), description: 'Rent Payment', amount: -1500, reference_number: 'CHK-1001', reference: 'Monthly rent - February 2026' },
    { account_id: insertedAccounts[2].id, subcategory_id: subMap['Utilities'], transaction_date: new Date(now.getFullYear(), now.getMonth(), 5), description: 'Electric Company', amount: -120.50, reference_number: 'UTIL-5523' },
    { account_id: insertedAccounts[2].id, subcategory_id: subMap['Internet/Phone'], transaction_date: new Date(now.getFullYear(), now.getMonth(), 3), description: 'Verizon Wireless', amount: -85 },
    { account_id: insertedAccounts[0].id, subcategory_id: subMap['Insurance'], transaction_date: new Date(now.getFullYear(), now.getMonth(), 1), description: 'Health Insurance', amount: -400, reference: 'Policy #12345678' },
    { account_id: insertedAccounts[2].id, subcategory_id: subMap['Subscriptions'], transaction_date: new Date(now.getFullYear(), now.getMonth(), 8), description: 'Netflix', amount: -15.99 },
    { account_id: insertedAccounts[2].id, subcategory_id: subMap['Subscriptions'], transaction_date: new Date(now.getFullYear(), now.getMonth(), 12), description: 'Spotify Premium', amount: -10.99 },
    { account_id: insertedAccounts[0].id, subcategory_id: subMap['Groceries'], transaction_date: new Date(now.getFullYear(), now.getMonth(), 4), description: 'Whole Foods', amount: -85.34 },
    { account_id: insertedAccounts[2].id, subcategory_id: subMap['Groceries'], transaction_date: new Date(now.getFullYear(), now.getMonth(), 11), description: 'Trader Joes', amount: -62.18 },
    
    // Investments
    { account_id: insertedAccounts[0].id, subcategory_id: subMap['401k'], transaction_date: new Date(now.getFullYear(), now.getMonth(), 1), description: '401k Contribution', amount: -300, reference: 'Automatic contribution' },
    { account_id: insertedAccounts[0].id, subcategory_id: subMap['Roth IRA'], transaction_date: new Date(now.getFullYear(), now.getMonth(), 1), description: 'Roth IRA Contribution', amount: -200, reference: 'Vanguard Target Retirement 2050' },
    
    // Savings
    { account_id: insertedAccounts[0].id, subcategory_id: subMap['Emergency Fund'], transaction_date: new Date(now.getFullYear(), now.getMonth(), 2), description: 'Emergency Fund Transfer', amount: -250 },
    { account_id: insertedAccounts[0].id, subcategory_id: subMap['Vacation'], transaction_date: new Date(now.getFullYear(), now.getMonth(), 2), description: 'Vacation Savings', amount: -150, reference: 'Summer vacation fund' },
    
    // Guilt-Free Spending
    { account_id: insertedAccounts[2].id, subcategory_id: subMap['Dining Out'], transaction_date: new Date(now.getFullYear(), now.getMonth(), 6), description: 'Italian Restaurant', amount: -65 },
    { account_id: insertedAccounts[2].id, subcategory_id: subMap['Dining Out'], transaction_date: new Date(now.getFullYear(), now.getMonth(), 13), description: 'Starbucks', amount: -12.50 },
    { account_id: insertedAccounts[2].id, subcategory_id: subMap['Entertainment'], transaction_date: new Date(now.getFullYear(), now.getMonth(), 7), description: 'Movie Tickets', amount: -30 },
    { account_id: insertedAccounts[2].id, subcategory_id: subMap['Shopping'], transaction_date: new Date(now.getFullYear(), now.getMonth(), 9), description: 'Amazon Order', amount: -78.43 },
    { account_id: insertedAccounts[2].id, subcategory_id: subMap['Health & Fitness'], transaction_date: new Date(now.getFullYear(), now.getMonth(), 1), description: 'Gym Membership', amount: -45 },
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
      subcategory_id: t.subcategory_id,
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
