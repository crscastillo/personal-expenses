import { SupabaseClient } from '@supabase/supabase-js'

export class TransactionService {
  private supabase: SupabaseClient

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  async getTransactions(userId: string, filters?: {
    accountId?: string
    startDate?: string
    endDate?: string
  }) {
    let query = this.supabase
      .from('transactions')
      .select(`
        *,
        account:accounts(name, color),
        expense_category:expense_categories(name, expense_group:expense_groups(name)),
        transfer_to:accounts!transactions_transfer_to_account_id_fkey(name)
      `)
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (filters?.accountId) {
      query = query.eq('account_id', filters.accountId)
    }

    if (filters?.startDate) {
      query = query.gte('date', filters.startDate)
    }

    if (filters?.endDate) {
      query = query.lte('date', filters.endDate)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  }

  async getTransactionById(id: string, userId: string) {
    const { data, error } = await this.supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) throw error
    return data
  }

  async createTransaction(userId: string, transaction: {
    description: string
    amount: number
    account_id: string
    expense_category_id?: string | null
    transfer_to_account_id?: string | null
    date: string
    notes?: string
    reference_number?: string
    reference?: string
  }) {
    const { data, error } = await this.supabase
      .from('transactions')
      .insert([{
        ...transaction,
        user_id: userId,
      }])
      .select()
      .single()

    if (error) throw error

    // If this is a transfer, create the corresponding transaction
    if (transaction.transfer_to_account_id) {
      await this.supabase
        .from('transactions')
        .insert([{
          user_id: userId,
          description: `Transfer from account`,
          amount: Math.abs(transaction.amount),
          account_id: transaction.transfer_to_account_id,
          date: transaction.date,
          notes: transaction.notes,
          reference: transaction.reference,
        }])
    }

    return data
  }

  async updateTransaction(id: string, userId: string, updates: {
    description?: string
    amount?: number
    account_id?: string
    expense_category_id?: string | null
    date?: string
    notes?: string
    reference_number?: string
    reference?: string
  }) {
    const { data, error } = await this.supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteTransaction(id: string, userId: string) {
    const { error } = await this.supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error
    return { success: true }
  }

  async importTransactions(userId: string, transactions: any[]) {
    const { data, error } = await this.supabase
      .from('transactions')
      .insert(transactions.map(t => ({
        ...t,
        user_id: userId,
      })))
      .select()

    if (error) throw error
    return data
  }

  async getMonthlyTransactions(userId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]

    const { data, error } = await this.supabase
      .from('transactions')
      .select('amount, expense_category_id, transfer_to_account_id')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)

    if (error) throw error
    return data
  }
}
