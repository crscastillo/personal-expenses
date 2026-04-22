import { SupabaseClient } from '@supabase/supabase-js'

export class CreditService {
  private supabase: SupabaseClient

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  async getCredits(userId: string) {
    const { data: credits, error } = await this.supabase
      .from('credits')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return credits
  }

  async getCreditById(id: string, userId: string) {
    const { data, error } = await this.supabase
      .from('credits')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) throw error
    return data
  }

  async createCredit(userId: string, credit: {
    name: string
    type: string
    institution?: string
    account_number?: string
    original_amount: number
    current_balance: number
    interest_rate: number
    start_date?: string
    maturity_date?: string
    minimum_payment?: number
    payment_due_day?: number
    color?: string
    notes?: string
  }) {
    const { data, error } = await this.supabase
      .from('credits')
      .insert([{
        ...credit,
        user_id: userId,
        is_active: true,
        color: credit.color || '#ef4444',
      }])
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateCredit(id: string, userId: string, updates: {
    name?: string
    type?: string
    institution?: string
    account_number?: string
    original_amount?: number
    current_balance?: number
    interest_rate?: number
    start_date?: string
    maturity_date?: string
    minimum_payment?: number
    payment_due_day?: number
    color?: string
    is_active?: boolean
    notes?: string
  }) {
    const { data, error } = await this.supabase
      .from('credits')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteCredit(id: string, userId: string) {
    const { error } = await this.supabase
      .from('credits')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error
    return { success: true }
  }

  // Credit Statements Methods
  async getStatements(creditId: string, userId: string) {
    const { data, error } = await this.supabase
      .from('credit_statements')
      .select('*')
      .eq('credit_id', creditId)
      .eq('user_id', userId)
      .order('statement_date', { ascending: false })

    if (error) throw error
    return data
  }

  async getStatementById(id: string, userId: string) {
    const { data, error } = await this.supabase
      .from('credit_statements')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) throw error
    return data
  }

  async createStatement(userId: string, statement: {
    credit_id: string
    statement_date: string
    balance: number
    interest_rate?: number
    minimum_payment?: number
    payment_due_date?: string
    interest_charged?: number
    principal_paid?: number
    fees_charged?: number
    new_charges?: number
    payments_made?: number
    notes?: string
  }) {
    const { data, error } = await this.supabase
      .from('credit_statements')
      .insert([{
        ...statement,
        user_id: userId,
      }])
      .select()
      .single()

    if (error) throw error

    // Update credit's current balance
    await this.supabase
      .from('credits')
      .update({
        current_balance: statement.balance,
        interest_rate: statement.interest_rate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', statement.credit_id)
      .eq('user_id', userId)

    return data
  }

  async updateStatement(id: string, userId: string, updates: {
    statement_date?: string
    balance?: number
    interest_rate?: number
    minimum_payment?: number
    payment_due_date?: string
    interest_charged?: number
    principal_paid?: number
    fees_charged?: number
    new_charges?: number
    payments_made?: number
    notes?: string
  }) {
    const { data, error } = await this.supabase
      .from('credit_statements')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteStatement(id: string, userId: string) {
    const { error } = await this.supabase
      .from('credit_statements')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error
    return { success: true }
  }

  async importStatements(userId: string, creditId: string, statements: any[]) {
    const { data, error } = await this.supabase
      .from('credit_statements')
      .insert(statements.map(s => ({
        ...s,
        user_id: userId,
        credit_id: creditId,
      })))
      .select()

    if (error) throw error

    // Update credit with most recent statement balance
    if (statements.length > 0) {
      const mostRecent = statements.reduce((latest, current) => {
        return new Date(current.statement_date) > new Date(latest.statement_date) ? current : latest
      })

      await this.supabase
        .from('credits')
        .update({
          current_balance: mostRecent.balance,
          interest_rate: mostRecent.interest_rate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', creditId)
        .eq('user_id', userId)
    }

    return data
  }

  async getCreditSummary(userId: string) {
    const { data: credits, error } = await this.supabase
      .from('credits')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (error) throw error

    const totalDebt = credits?.reduce((sum, credit) => sum + parseFloat(credit.current_balance.toString()), 0) || 0
    const totalOriginal = credits?.reduce((sum, credit) => sum + parseFloat(credit.original_amount.toString()), 0) || 0
    const totalMonthlyPayments = credits?.reduce((sum, credit) => sum + parseFloat(credit.minimum_payment?.toString() || '0'), 0) || 0

    return {
      totalDebt,
      totalOriginal,
      totalMonthlyPayments,
      creditCount: credits?.length || 0,
      credits,
    }
  }
}
