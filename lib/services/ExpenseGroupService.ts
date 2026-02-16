import { SupabaseClient } from '@supabase/supabase-js'

export class ExpenseGroupService {
  private supabase: SupabaseClient

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  async getExpenseGroups(userId: string) {
    const { data, error } = await this.supabase
      .from('expense_groups')
      .select('*')
      .eq('user_id', userId)
      .order('name')

    if (error) throw error
    return data
  }

  async getExpenseGroupById(id: string, userId: string) {
    const { data, error } = await this.supabase
      .from('expense_groups')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) throw error
    return data
  }

  async createExpenseGroup(userId: string, group: {
    name: string
    description?: string
    color?: string
  }) {
    const { data, error } = await this.supabase
      .from('expense_groups')
      .insert([{
        ...group,
        user_id: userId,
        color: group.color || '#3b82f6',
      }])
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateExpenseGroup(id: string, userId: string, updates: {
    name?: string
    description?: string
    color?: string
  }) {
    const { data, error } = await this.supabase
      .from('expense_groups')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteExpenseGroup(id: string, userId: string) {
    const { error } = await this.supabase
      .from('expense_groups')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error
    return { success: true }
  }
}
