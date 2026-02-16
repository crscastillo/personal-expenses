import { SupabaseClient } from '@supabase/supabase-js'

export class AccountService {
  private supabase: SupabaseClient

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  async getAccounts(userId: string) {
    const { data: accounts, error } = await this.supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Load transactions for all accounts to calculate actual balances
    const { data: transactions, error: transError } = await this.supabase
      .from('transactions')
      .select('account_id, amount')
      .eq('user_id', userId)

    if (transError) {
      console.error('Error loading transactions:', transError)
    }

    // Calculate balance for each account based on transactions
    const accountsWithBalances = (accounts || []).map(account => {
      const accountTransactions = transactions?.filter(t => t.account_id === account.id) || []
      const calculatedBalance = accountTransactions.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0)
      return {
        ...account,
        balance: calculatedBalance
      }
    })

    return accountsWithBalances
  }

  async getAccountById(id: string, userId: string) {
    const { data, error } = await this.supabase
      .from('accounts')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) throw error
    return data
  }

  async createAccount(userId: string, account: {
    name: string
    type: string
    institution?: string
    account_number?: string
    balance: number
    color?: string
    is_active?: boolean
    include_in_plan?: boolean
  }) {
    const { data, error } = await this.supabase
      .from('accounts')
      .insert([{
        ...account,
        user_id: userId,
        is_active: account.is_active ?? true,
        include_in_plan: account.include_in_plan ?? true,
        color: account.color || '#3b82f6',
      }])
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateAccount(id: string, userId: string, updates: {
    name?: string
    type?: string
    institution?: string
    account_number?: string
    balance?: number
    color?: string
    is_active?: boolean
    include_in_plan?: boolean
  }) {
    const { data, error } = await this.supabase
      .from('accounts')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteAccount(id: string, userId: string) {
    const { error } = await this.supabase
      .from('accounts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error
    return { success: true }
  }

  async getAccountBalances(userId: string) {
    const { data: transactions, error } = await this.supabase
      .from('transactions')
      .select('account_id, amount')
      .eq('user_id', userId)

    if (error) throw error

    const balances: Record<string, number> = {}
    transactions?.forEach(t => {
      balances[t.account_id] = (balances[t.account_id] || 0) + t.amount
    })

    return balances
  }
}
