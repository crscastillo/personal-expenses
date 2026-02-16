import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TransactionService } from '@/lib/services/TransactionService'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId') || undefined
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    const transactionService = new TransactionService(supabase)

    // If month and year are provided, get monthly transactions
    if (month && year) {
      const transactions = await transactionService.getMonthlyTransactions(
        user.id,
        parseInt(month),
        parseInt(year)
      )
      return NextResponse.json(transactions)
    }

    // Otherwise, get all transactions with optional filters
    const transactions = await transactionService.getTransactions(user.id, {
      accountId,
      startDate,
      endDate,
    })

    return NextResponse.json(transactions)
  } catch (error: any) {
    console.error('Error fetching transactions:', error)
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
    
    // Check if this is a bulk import
    if (Array.isArray(body)) {
      const transactionService = new TransactionService(supabase)
      const transactions = await transactionService.importTransactions(user.id, body)
      return NextResponse.json(transactions, { status: 201 })
    }

    // Single transaction creation
    const transactionService = new TransactionService(supabase)
    const transaction = await transactionService.createTransaction(user.id, body)

    return NextResponse.json(transaction, { status: 201 })
  } catch (error: any) {
    console.error('Error creating transaction:', error)
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
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 })
    }

    const transactionService = new TransactionService(supabase)
    const transaction = await transactionService.updateTransaction(id, user.id, updates)

    return NextResponse.json(transaction)
  } catch (error: any) {
    console.error('Error updating transaction:', error)
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
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 })
    }

    const transactionService = new TransactionService(supabase)
    await transactionService.deleteTransaction(id, user.id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting transaction:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
