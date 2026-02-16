import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ExpenseCategoryService } from '@/lib/services/ExpenseCategoryService'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const expenseCategoryService = new ExpenseCategoryService(supabase)
    const categories = await expenseCategoryService.getExpenseCategories(user.id)

    return NextResponse.json(categories)
  } catch (error: any) {
    console.error('Error fetching expense categories:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const expenseCategoryService = new ExpenseCategoryService(supabase)
    const category = await expenseCategoryService.createExpenseCategory(user.id, body)

    return NextResponse.json(category, { status: 201 })
  } catch (error: any) {
    console.error('Error creating expense category:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Expense category ID is required' }, { status: 400 })
    }

    const expenseCategoryService = new ExpenseCategoryService(supabase)
    const category = await expenseCategoryService.updateExpenseCategory(id, user.id, updates)

    return NextResponse.json(category)
  } catch (error: any) {
    console.error('Error updating expense category:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Expense category ID is required' }, { status: 400 })
    }

    const expenseCategoryService = new ExpenseCategoryService(supabase)
    await expenseCategoryService.deleteExpenseCategory(id, user.id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting expense category:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
