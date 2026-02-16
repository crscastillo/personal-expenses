import { SupabaseClient } from '@supabase/supabase-js'

export class PlanService {
  private supabase: SupabaseClient

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  async getMonthlyPlan(userId: string, month: number, year: number) {
    const { data, error } = await this.supabase
      .from('monthly_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('month', month)
      .eq('year', year)
      .maybeSingle()

    if (error) throw error
    return data
  }

  async createMonthlyPlan(userId: string, plan: {
    month: number
    year: number
    name?: string
  }) {
    const { data, error } = await this.supabase
      .from('monthly_plans')
      .insert({
        user_id: userId,
        month: plan.month,
        year: plan.year,
        name: plan.name || `${plan.month}/${plan.year} Plan`,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getPlanItems(userId: string, planId: string) {
    const { data, error } = await this.supabase
      .from('plan_items')
      .select('*')
      .eq('user_id', userId)
      .eq('monthly_plan_id', planId)
      .order('expense_category_id')

    if (error) throw error
    return data
  }

  async createPlanItem(userId: string, item: {
    monthly_plan_id: string
    expense_category_id: string
    planned_amount?: number
    due_date?: string
    notes?: string
    is_completed?: boolean
  }) {
    const { data, error } = await this.supabase
      .from('plan_items')
      .insert({
        ...item,
        user_id: userId,
        is_completed: item.is_completed ?? false,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updatePlanItem(id: string, userId: string, updates: {
    planned_amount?: number
    due_date?: string
    notes?: string
    is_completed?: boolean
  }) {
    const { data, error } = await this.supabase
      .from('plan_items')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deletePlanItem(id: string, userId: string) {
    const { error } = await this.supabase
      .from('plan_items')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error
    return { success: true }
  }

  async togglePlanItemCompletion(id: string, userId: string, isCompleted: boolean) {
    return this.updatePlanItem(id, userId, { is_completed: isCompleted })
  }
}
