import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ExpenseGroupService } from '@/lib/services/ExpenseGroupService'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const expenseGroupService = new ExpenseGroupService(supabase)
    const groups = await expenseGroupService.getExpenseGroups(user.id)

    return NextResponse.json(groups)
  } catch (error: any) {
    console.error('Error fetching expense groups:', error)
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
    const expenseGroupService = new ExpenseGroupService(supabase)
    const group = await expenseGroupService.createExpenseGroup(user.id, body)

    return NextResponse.json(group, { status: 201 })
  } catch (error: any) {
    console.error('Error creating expense group:', error)
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
      return NextResponse.json({ error: 'Expense group ID is required' }, { status: 400 })
    }

    const expenseGroupService = new ExpenseGroupService(supabase)
    const group = await expenseGroupService.updateExpenseGroup(id, user.id, updates)

    return NextResponse.json(group)
  } catch (error: any) {
    console.error('Error updating expense group:', error)
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
      return NextResponse.json({ error: 'Expense group ID is required' }, { status: 400 })
    }

    const expenseGroupService = new ExpenseGroupService(supabase)
    await expenseGroupService.deleteExpenseGroup(id, user.id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting expense group:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
