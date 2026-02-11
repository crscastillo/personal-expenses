export type ExpenseGroup = {
  id: string
  user_id: string
  name: string
  description: string | null
  type: 'income' | 'expense'
  color: string
  sort_order: number
  is_system: boolean
  created_at: string
}

export type ExpenseCategory = {
  id: string
  expense_group_id: string
  user_id: string
  name: string
  description: string | null
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
  include_in_plan: boolean
  created_at: string
  updated_at: string
}

export type MonthlyPlan = {
  id: string
  user_id: string
  month: number
  year: number
  created_at: string
  updated_at: string
}

export type PlanItem = {
  id: string
  plan_id: string
  expense_category_id: string
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
  expense_category_id: string | null
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
  plan_item_id: string
  due_date: string
  is_completed: boolean
  completed_at: string | null
  created_at: string
}

export type PlanSummary = {
  plan_item_id: string
  plan_id: string
  user_id: string
  month: number
  year: number
  expense_group_id: string
  expense_group_name: string
  expense_group_color: string
  expense_category_id: string
  expense_category_name: string
  planned_amount: number
  due_date: string | null
  actual_amount: number
  remaining_amount: number
}
