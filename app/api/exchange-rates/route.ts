import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ExchangeRateService } from '@/lib/services/ExchangeRateService'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const fromCurrency = searchParams.get('from')
    const toCurrency = searchParams.get('to')
    const date = searchParams.get('date')
    const action = searchParams.get('action')

    const exchangeRateService = new ExchangeRateService(supabase)

    // Refresh today's rates
    if (action === 'refresh') {
      await exchangeRateService.refreshTodayRates()
      return NextResponse.json({ success: true, message: 'Exchange rates refreshed' })
    }

    // Get supported currencies
    if (action === 'currencies') {
      const currencies = exchangeRateService.getSupportedCurrencies()
      return NextResponse.json(currencies)
    }

    // Get specific exchange rate
    if (fromCurrency && toCurrency) {
      const rate = date
        ? await exchangeRateService.getRate(fromCurrency, toCurrency, date)
        : await exchangeRateService.getCurrentRate(fromCurrency, toCurrency)
      
      return NextResponse.json({ 
        from: fromCurrency, 
        to: toCurrency, 
        rate,
        date: date || new Date().toISOString().split('T')[0]
      })
    }

    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
  } catch (error) {
    console.error('Error fetching exchange rate:', error)
    return NextResponse.json({ error: 'Failed to fetch exchange rate' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { amount, fromCurrency, toCurrency, date } = body

    if (!amount || !fromCurrency || !toCurrency) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const exchangeRateService = new ExchangeRateService(supabase)
    const convertedAmount = await exchangeRateService.convertAmount(
      amount, 
      fromCurrency, 
      toCurrency, 
      date
    )

    return NextResponse.json({ 
      originalAmount: amount,
      convertedAmount,
      fromCurrency,
      toCurrency,
      date: date || new Date().toISOString().split('T')[0]
    })
  } catch (error) {
    console.error('Error converting amount:', error)
    return NextResponse.json({ error: 'Failed to convert amount' }, { status: 500 })
  }
}
