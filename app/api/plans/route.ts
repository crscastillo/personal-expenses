import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PlanService } from '@/lib/services/PlanService'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    if (!month || !year) {
      return NextResponse.json({ error: 'Month and year are required' }, { status: 400 })
    }

    const planService = new PlanService(supabase)
    const plan = await planService.getMonthlyPlan(user.id, parseInt(month), parseInt(year))

    return NextResponse.json(plan)
  } catch (error: any) {
    console.error('Error fetching plan:', error)
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
    const planService = new PlanService(supabase)
    const plan = await planService.createMonthlyPlan(user.id, body)

    return NextResponse.json(plan, { status: 201 })
  } catch (error: any) {
    console.error('Error creating plan:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
