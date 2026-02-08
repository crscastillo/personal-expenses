'use client'

import { useState, useEffect } from 'react'
import { StatCard } from '@/components/stat-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp, TrendingDown, Wallet, PiggyBank, DollarSign } from 'lucide-react'
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { getMonthName, getCurrentMonth, getCurrentYear } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

// Category colors
const categoryColors: Record<string, string> = {
  'Income': '#22c55e',
  'Investments': '#8b5cf6',
  'Savings': '#3b82f6',
  'Fixed Costs': '#ef4444',
  'Guilt-Free Spending': '#f59e0b',
  'Misc': '#6b7280',
}

// Get color based on percentage (red=0% -> yellow=50% -> green=100%)
const getProgressColor = (percentage: number): string => {
  if (percentage >= 100) return '#22c55e' // green-500
  if (percentage >= 90) return '#84cc16' // lime-500
  if (percentage >= 75) return '#eab308' // yellow-500
  if (percentage >= 50) return '#f97316' // orange-500
  if (percentage >= 25) return '#f59e0b' // amber-500
  return '#ef4444' // red-500
}

interface Transaction {
  amount: number
  category: string
  subcategory: string
  transaction_date: string
}

interface CategoryData {
  name: string
  value: number
  color: string
}

interface SubcategoryData {
  name: string
  actual: number
  planned: number
}

export default function DashboardPage() {
  const supabase = createClient()
  const currentMonth = getMonthName(getCurrentMonth())
  const currentYear = getCurrentYear()
  
  const [isLoading, setIsLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [totalSavings, setTotalSavings] = useState(0)
  const [incomeBySubcategory, setIncomeBySubcategory] = useState<CategoryData[]>([])
  const [expensesByCategory, setExpensesByCategory] = useState<CategoryData[]>([])
  const [categoryBreakdown, setCategoryBreakdown] = useState<Record<string, SubcategoryData[]>>({})
  const [monthlyTrend, setMonthlyTrend] = useState<Array<{ month: string; income: number; expenses: number }>>([])
  
  useEffect(() => {
    loadDashboardData()
  }, [])
  
  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      // Load transactions for current month and last 6 months
      const currentDate = new Date()
      const sixMonthsAgo = new Date(currentDate)
      sixMonthsAgo.setMonth(currentDate.getMonth() - 6)
      
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          amount,
          transaction_date,
          subcategory:subcategories(
            name,
            category:categories(name)
          ),
          transfer_account:accounts!transactions_transfer_to_account_id_fkey(name)
        `)
        .eq('user_id', user.id)
        .gte('transaction_date', sixMonthsAgo.toISOString().split('T')[0])
        .order('transaction_date', { ascending: false })
      
      if (error) throw error
      
      const transformedTransactions = (data || []).map((t: any) => ({
        amount: parseFloat(t.amount),
        category: t.transfer_account ? 'Transfer' : (t.subcategory?.category?.name || 'Misc'),
        subcategory: t.transfer_account ? t.transfer_account.name : (t.subcategory?.name || 'Untracked'),
        transaction_date: t.transaction_date,
      }))
      
      setTransactions(transformedTransactions)
      calculateDashboardMetrics(transformedTransactions)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const calculateDashboardMetrics = (transactions: Transaction[]) => {
    const currentDate = new Date()
    const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const currentMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    
    // Filter transactions for current month
    const currentMonthTransactions = transactions.filter(t => {
      const tDate = new Date(t.transaction_date)
      return tDate >= currentMonthStart && tDate <= currentMonthEnd
    })
    
    // Calculate current month totals
    let income = 0
    let expenses = 0
    let savings = 0
    const incomeBySub: Record<string, number> = {}
    const expensesByCat: Record<string, number> = {}
    const catBreakdown: Record<string, Record<string, number>> = {}
    
    currentMonthTransactions.forEach(t => {
      if (t.category === 'Transfer') return // Skip transfers
      
      if (t.amount > 0) {
        // Income
        income += t.amount
        incomeBySub[t.subcategory] = (incomeBySub[t.subcategory] || 0) + t.amount
      } else {
        // Expenses
        const absAmount = Math.abs(t.amount)
        expenses += absAmount
        expensesByCat[t.category] = (expensesByCat[t.category] || 0) + absAmount
        
        // Track by subcategory within category
        if (!catBreakdown[t.category]) catBreakdown[t.category] = {}
        catBreakdown[t.category][t.subcategory] = (catBreakdown[t.category][t.subcategory] || 0) + absAmount
        
        // Track savings specifically
        if (t.category === 'Savings') {
          savings += absAmount
        }
      }
    })
    
    setTotalIncome(income)
    setTotalExpenses(expenses)
    setTotalSavings(savings)
    
    // Convert to chart data
    const incomeColors = ['#22c55e', '#10b981', '#34d399', '#4ade80', '#86efac']
    const incomeData = Object.entries(incomeBySub).map(([name, value], idx) => ({
      name,
      value,
      color: incomeColors[idx % incomeColors.length]
    }))
    setIncomeBySubcategory(incomeData)
    
    const expensesData = Object.entries(expensesByCat).map(([name, value]) => ({
      name,
      value,
      color: categoryColors[name] || '#6b7280'
    }))
    setExpensesByCategory(expensesData)
    
    // Convert category breakdown to subcategory list
    const breakdown: Record<string, SubcategoryData[]> = {}
    Object.entries(catBreakdown).forEach(([category, subs]) => {
      breakdown[category] = Object.entries(subs).map(([name, actual]) => ({
        name,
        actual,
        planned: 0 // We don't have budget data yet, leaving as 0
      }))
    })
    setCategoryBreakdown(breakdown)
    
    // Calculate monthly trend (last 6 months)
    const monthlyData: Record<string, { income: number; expenses: number }> = {}
    const months = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate)
      date.setMonth(date.getMonth() - i)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthName = date.toLocaleString('default', { month: 'short' })
      months.push({ key: monthKey, name: monthName })
      monthlyData[monthKey] = { income: 0, expenses: 0 }
    }
    
    transactions.forEach(t => {
      const monthKey = t.transaction_date.substring(0, 7)
      if (monthlyData[monthKey]) {
        if (t.amount > 0) {
          monthlyData[monthKey].income += t.amount
        } else {
          monthlyData[monthKey].expenses += Math.abs(t.amount)
        }
      }
    })
    
    const trendData = months.map(({ key, name }) => ({
      month: name,
      income: Math.round(monthlyData[key].income),
      expenses: Math.round(monthlyData[key].expenses)
    }))
    setMonthlyTrend(trendData)
  }

  const renderProgressItems = (items: Array<{ name: string; actual: number; planned: number }>) => {
    if (items.length === 0) {
      return (
        <div className="text-center py-4 text-muted-foreground">
          No transactions in this category yet
        </div>
      )
    }
    
    return (
      <>
        {items.map((item) => {
          const percentage = item.planned > 0 ? (item.actual / item.planned) * 100 : 0
          const color = getProgressColor(percentage)
          
          return (
            <div key={item.name} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{item.name}</span>
                <span className="text-muted-foreground">
                  ${item.actual.toLocaleString()}
                  {item.planned > 0 && (
                    <>
                      {' / $'}{item.planned.toLocaleString()}
                      <span className="ml-2 text-xs">({percentage.toFixed(0)}%)</span>
                    </>
                  )}
                </span>
              </div>
              {item.planned > 0 && (
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${Math.min(percentage, 100)}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </>
    )
  }
  
  // Aggregate subcategories into parent categories
  const parentCategories = Object.entries(categoryBreakdown).map(([name, items]) => ({
    name,
    actual: items.reduce((sum, item) => sum + item.actual, 0),
    planned: items.reduce((sum, item) => sum + item.planned, 0),
  }))
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Loading your financial overview...</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-muted rounded w-24"></div>
                <div className="h-8 bg-muted rounded w-32"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Dashboard</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            {currentMonth} {currentYear} - Your conscious spending overview
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Income"
          value={totalIncome}
          icon={DollarSign}
          color="#22c55e"
        />
        <StatCard
          title="Total Expenses"
          value={totalExpenses}
          icon={TrendingDown}
          color="#ef4444"
        />
        <StatCard
          title="Savings"
          value={totalSavings}
          icon={PiggyBank}
          color="#3b82f6"
        />
        <StatCard
          title="Net Balance"
          value={totalIncome - totalExpenses}
          icon={Wallet}
          color="#8b5cf6"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Income by Source</CardTitle>
            <CardDescription>Your income sources this month</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {incomeBySubcategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={incomeBySubcategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {incomeBySubcategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No income transactions this month
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
            <CardDescription>Your spending allocation this month</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {expensesByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensesByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expensesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No expense transactions this month
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Income vs Expenses</CardTitle>
          <CardDescription>Last 6 months trend</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          {monthlyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrend}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="income" fill="#22c55e" name="Income" />
                <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No transaction history available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Budget Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Spending by Category</CardTitle>
          <CardDescription>Breakdown of your expenses by category and subcategory</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">All Categories</TabsTrigger>
              {Object.keys(categoryBreakdown).map((cat) => (
                <TabsTrigger key={cat} value={cat.toLowerCase().replace(/\s+/g, '-')}>
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="all" className="space-y-4">
              {parentCategories.length > 0 ? (
                renderProgressItems(parentCategories)
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No transactions yet. Add some transactions to see your spending breakdown.
                </div>
              )}
            </TabsContent>
            {Object.entries(categoryBreakdown).map(([category, items]) => (
              <TabsContent key={category} value={category.toLowerCase().replace(/\s+/g, '-')} className="space-y-4">
                {renderProgressItems(items)}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
