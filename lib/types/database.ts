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
  tracking_mode: 'automatic' | 'manual'
  completed_amount: number
  is_completed: boolean
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

export type Credit = {
  id: string
  user_id: string
  name: string
  type: 'mortgage' | 'personal_loan' | 'auto_loan' | 'student_loan' | 'credit_card' | 'line_of_credit' | 'other'
  institution: string | null
  account_number: string | null
  original_amount: number
  current_balance: number
  interest_rate: number
  currency: string
  start_date: string | null
  maturity_date: string | null
  minimum_payment: number | null
  payment_due_day: number | null
  color: string
  is_active: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export type CreditStatement = {
  id: string
  credit_id: string
  user_id: string
  statement_date: string
  balance: number
  interest_rate: number | null
  minimum_payment: number | null
  payment_due_date: string | null
  interest_charged: number | null
  principal_paid: number | null
  fees_charged: number | null
  new_charges: number | null
  payments_made: number | null
  notes: string | null
  created_at: string
  updated_at: string
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

export type ExchangeRate = {
  id: string
  from_currency: string
  to_currency: string
  rate: number
  date: string
  source: string | null
  created_at: string
  updated_at: string
}
