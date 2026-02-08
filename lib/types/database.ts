export type Category = {
  id: string
  name: string
  description: string | null
  type: 'income' | 'expense'
  color: string
  sort_order: number
  is_system: boolean
  created_at: string
}

export type Subcategory = {
  id: string
  category_id: string
  name: string
  description: string | null
  user_id: string | null
  is_custom: boolean
  created_at: string
}

export type Account = {
  id: string
  user_id: string
  name: string
  type: 'checking' | 'savings' | 'credit_card' | 'cash' | 'investment'
  institution: string | null
  account_number: string | null
  balance: number
  currency: string
  color: string
  is_active: boolean
  include_in_budget: boolean
  created_at: string
  updated_at: string
}

export type MonthlyBudget = {
  id: string
  user_id: string
  month: number
  year: number
  created_at: string
  updated_at: string
}

export type BudgetItem = {
  id: string
  budget_id: string
  subcategory_id: string
  planned_amount: number
  due_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type Transaction = {
  id: string
  user_id: string
  account_id: string
  subcategory_id: string | null
  amount: number
  description: string
  transaction_date: string
  is_pending: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export type Reminder = {
  id: string
  user_id: string
  budget_item_id: string
  due_date: string
  is_completed: boolean
  completed_at: string | null
  created_at: string
}

export type BudgetSummary = {
  budget_item_id: string
  budget_id: string
  user_id: string
  month: number
  year: number
  category_id: string
  category_name: string
  category_color: string
  subcategory_id: string
  subcategory_name: string
  planned_amount: number
  due_date: string | null
  actual_amount: number
  remaining_amount: number
}
