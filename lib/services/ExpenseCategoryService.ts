import { SupabaseClient } from '@supabase/supabase-js'

export class ExpenseCategoryService {
  private supabase: SupabaseClient

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  async getExpenseCategories(userId: string) {
    const { data, error } = await this.supabase
      .from('expense_categories')
      .select('*, expense_group:expense_groups(name, color)')
      .eq('user_id', userId)
      .order('name')

    if (error) throw error
    return data
  }

  async getExpenseCategoryById(id: string, userId: string) {
    const { data, error } = await this.supabase
      .from('expense_categories')
      .select('*, expense_group:expense_groups(name, color)')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) throw error
    return data
  }

  async createExpenseCategory(userId: string, category: {
    name: string
    expense_group_id: string
    description?: string
  }) {
    const { data, error } = await this.supabase
      .from('expense_categories')
      .insert([{
        ...category,
        user_id: userId,
      }])
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateExpenseCategory(id: string, userId: string, updates: {
    name?: string
    expense_group_id?: string
    description?: string
  }) {
    const { data, error } = await this.supabase
      .from('expense_categories')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteExpenseCategory(id: string, userId: string) {
    const { error } = await this.supabase
      .from('expense_categories')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error
    return { success: true }
  }
}
