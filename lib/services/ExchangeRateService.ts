import { SupabaseClient } from '@supabase/supabase-js'

export class ExchangeRateService {
  private supabase: SupabaseClient
  private apiUrl = 'https://api.exchangerate-api.com/v4/latest'

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  /**
   * Get exchange rate for a specific date
   * If not in cache, fetches from API and stores it
   */
  async getRate(fromCurrency: string, toCurrency: string, date: string): Promise<number> {
    // If same currency, rate is 1
    if (fromCurrency === toCurrency) {
      return 1
    }

    // Try to get from cache first
    const cachedRate = await this.getCachedRate(fromCurrency, toCurrency, date)
    if (cachedRate !== null) {
      return cachedRate
    }

    // Fetch from API
    const rate = await this.fetchRateFromAPI(fromCurrency, toCurrency)
    
    // Store in cache
    await this.cacheRate(fromCurrency, toCurrency, date, rate)
    
    return rate
  }

  /**
   * Get current exchange rate (today)
   */
  async getCurrentRate(fromCurrency: string, toCurrency: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0]
    return this.getRate(fromCurrency, toCurrency, today)
  }

  /**
   * Convert amount from one currency to another
   */
  async convertAmount(amount: number, fromCurrency: string, toCurrency: string, date?: string): Promise<number> {
    const dateStr = date || new Date().toISOString().split('T')[0]
    const rate = await this.getRate(fromCurrency, toCurrency, dateStr)
    return amount * rate
  }

  /**
   * Get cached rate from database
   */
  private async getCachedRate(fromCurrency: string, toCurrency: string, date: string): Promise<number | null> {
    const { data, error } = await this.supabase
      .from('exchange_rates')
      .select('rate')
      .eq('from_currency', fromCurrency)
      .eq('to_currency', toCurrency)
      .eq('date', date)
      .single()

    if (error || !data) {
      return null
    }

    return parseFloat(data.rate.toString())
  }

  /**
   * Fetch exchange rate from API
   */
  private async fetchRateFromAPI(fromCurrency: string, toCurrency: string): Promise<number> {
    try {
      const response = await fetch(`${this.apiUrl}/${fromCurrency}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch exchange rate: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.rates || !data.rates[toCurrency]) {
        throw new Error(`Exchange rate not available for ${fromCurrency} to ${toCurrency}`)
      }

      return data.rates[toCurrency]
    } catch (error) {
      console.error('Error fetching exchange rate:', error)
      // Fallback: if we can't get the rate, return 1 (no conversion)
      // In production, you might want to handle this differently
      return 1
    }
  }

  /**
   * Cache exchange rate in database
   */
  private async cacheRate(fromCurrency: string, toCurrency: string, date: string, rate: number): Promise<void> {
    try {
      await this.supabase
        .from('exchange_rates')
        .upsert({
          from_currency: fromCurrency,
          to_currency: toCurrency,
          date,
          rate,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'from_currency,to_currency,date'
        })
    } catch (error) {
      console.error('Error caching exchange rate:', error)
      // Non-critical error, continue execution
    }
  }

  /**
   * Get all supported currencies
   */
  getSupportedCurrencies(): { code: string; name: string; symbol: string }[] {
    return [
      { code: 'USD', name: 'US Dollar', symbol: '$' },
      { code: 'CRC', name: 'Costa Rican Colón', symbol: '₡' },
    ]
  }

  /**
   * Format amount with currency symbol
   */
  formatAmount(amount: number, currency: string): string {
    const currencies = this.getSupportedCurrencies()
    const currencyInfo = currencies.find(c => c.code === currency)
    const symbol = currencyInfo?.symbol || currency
    
    return `${symbol}${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  /**
   * Refresh exchange rates for today
   */
  async refreshTodayRates(): Promise<void> {
    const today = new Date().toISOString().split('T')[0]
    const currencies = this.getSupportedCurrencies()

    for (const from of currencies) {
      for (const to of currencies) {
        if (from.code !== to.code) {
          try {
            const rate = await this.fetchRateFromAPI(from.code, to.code)
            await this.cacheRate(from.code, to.code, today, rate)
          } catch (error) {
            console.error(`Error refreshing rate ${from.code} to ${to.code}:`, error)
          }
        }
      }
    }
  }
}
