'use client'

import { StatCard } from '@/components/stat-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp, TrendingDown, Wallet, PiggyBank, DollarSign } from 'lucide-react'
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { getMonthName, getCurrentMonth, getCurrentYear } from '@/lib/utils'

// Sample data - will be replaced with real data from Supabase
const incomeData = [
  { name: 'Salary', value: 4500, color: '#22c55e' },
  { name: 'Freelance', value: 300, color: '#10b981' },
  { name: 'Other Income', value: 200, color: '#34d399' },
]

const expenseData = [
  { name: 'Fixed Costs', value: 2800, color: '#ef4444' },
  { name: 'Guilt-Free Spending', value: 1300, color: '#f59e0b' },
  { name: 'Investments', value: 500, color: '#8b5cf6' },
  { name: 'Savings', value: 400, color: '#3b82f6' },
]

const budgetProgressData = {
  income: [
    { name: 'Salary', actual: 4500, planned: 4500 },
    { name: 'Freelance', actual: 250, planned: 300 },
    { name: 'Other Income', actual: 200, planned: 200 },
  ],
  investments: [
    { name: 'Stocks', actual: 200, planned: 300 },
    { name: 'Crypto', actual: 100, planned: 200 },
  ],
  savings: [
    { name: 'Emergency Fund', actual: 100, planned: 250 },
    { name: 'Vacation Fund', actual: 50, planned: 150 },
  ],
  fixed: [
    { name: 'Rent', actual: 1500, planned: 1500 },
    { name: 'Utilities', actual: 200, planned: 250 },
    { name: 'Insurance', actual: 400, planned: 400 },
    { name: 'Internet', actual: 80, planned: 80 },
    { name: 'Phone', actual: 60, planned: 70 },
    { name: 'Subscriptions', actual: 410, planned: 500 },
  ],
  'guilt-free': [
    { name: 'Dining Out', actual: 400, planned: 500 },
    { name: 'Entertainment', actual: 200, planned: 300 },
    { name: 'Shopping', actual: 280, planned: 400 },
    { name: 'Hobbies', actual: 100, planned: 100 },
  ],
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

// Aggregate subcategories into parent categories
const parentCategories = [
  {
    name: 'Income',
    actual: budgetProgressData.income.reduce((sum, item) => sum + item.actual, 0),
    planned: budgetProgressData.income.reduce((sum, item) => sum + item.planned, 0),
  },
  {
    name: 'Investments',
    actual: budgetProgressData.investments.reduce((sum, item) => sum + item.actual, 0),
    planned: budgetProgressData.investments.reduce((sum, item) => sum + item.planned, 0),
  },
  {
    name: 'Savings',
    actual: budgetProgressData.savings.reduce((sum, item) => sum + item.actual, 0),
    planned: budgetProgressData.savings.reduce((sum, item) => sum + item.planned, 0),
  },
  {
    name: 'Fixed Costs',
    actual: budgetProgressData.fixed.reduce((sum, item) => sum + item.actual, 0),
    planned: budgetProgressData.fixed.reduce((sum, item) => sum + item.planned, 0),
  },
  {
    name: 'Guilt-Free Spending',
    actual: budgetProgressData['guilt-free'].reduce((sum, item) => sum + item.actual, 0),
    planned: budgetProgressData['guilt-free'].reduce((sum, item) => sum + item.planned, 0),
  },
]

const monthlyTrend = [
  { month: 'Jan', income: 5000, expenses: 4500 },
  { month: 'Feb', income: 5200, expenses: 4600 },
  { month: 'Mar', income: 5100, expenses: 4400 },
  { month: 'Apr', income: 5300, expenses: 4700 },
  { month: 'May', income: 5000, expenses: 4500 },
  { month: 'Jun', income: 5400, expenses: 4800 },
]

export default function DashboardPage() {
  const currentMonth = getMonthName(getCurrentMonth())
  const currentYear = getCurrentYear()

  const renderProgressItems = (items: typeof allBudgetItems) => (
    <>
      {items.map((item) => {
        const percentage = item.planned > 0 ? (item.actual / item.planned) * 100 : 0
        const color = getProgressColor(percentage)
        
        return (
          <div key={item.name} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{item.name}</span>
              <span className="text-muted-foreground">
                ${item.actual.toLocaleString()} / ${item.planned.toLocaleString()}
                <span className="ml-2 text-xs">({percentage.toFixed(0)}%)</span>
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full transition-all"
                style={{
                  width: `${Math.min(percentage, 100)}%`,
                  backgroundColor: color,
                }}
              />
            </div>
          </div>
        )
      })}
    </>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            {currentMonth} {currentYear} - Your conscious spending overview
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Income"
          value={5000}
          icon={DollarSign}
          color="#22c55e"
          trend={{ value: 2.5, label: 'from last month' }}
        />
        <StatCard
          title="Total Expenses"
          value={4500}
          icon={TrendingDown}
          color="#ef4444"
          trend={{ value: -1.2, label: 'from last month' }}
        />
        <StatCard
          title="Savings"
          value={400}
          icon={PiggyBank}
          color="#3b82f6"
          trend={{ value: 8.1, label: 'from last month' }}
        />
        <StatCard
          title="Net Balance"
          value={500}
          icon={Wallet}
          color="#8b5cf6"
          trend={{ value: 12.3, label: 'from last month' }}
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
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={incomeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {incomeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
            <CardDescription>Your spending allocation this month</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
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
        </CardContent>
      </Card>

      {/* Budget Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Progress</CardTitle>
          <CardDescription>How you're tracking against your plan</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">All Categories</TabsTrigger>
              <TabsTrigger value="income">Income</TabsTrigger>
              <TabsTrigger value="investments">Investments</TabsTrigger>
              <TabsTrigger value="savings">Savings</TabsTrigger>
              <TabsTrigger value="fixed">Fixed Costs</TabsTrigger>
              <TabsTrigger value="guilt-free">Guilt-Free</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="space-y-4">
              {renderProgressItems(parentCategories)}
            </TabsContent>
            <TabsContent value="income" className="space-y-4">
              {renderProgressItems(budgetProgressData.income)}
            </TabsContent>
            <TabsContent value="investments" className="space-y-4">
              {renderProgressItems(budgetProgressData.investments)}
            </TabsContent>
            <TabsContent value="savings" className="space-y-4">
              {renderProgressItems(budgetProgressData.savings)}
            </TabsContent>
            <TabsContent value="fixed" className="space-y-4">
              {renderProgressItems(budgetProgressData.fixed)}
            </TabsContent>
            <TabsContent value="guilt-free" className="space-y-4">
              {renderProgressItems(budgetProgressData['guilt-free'])}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
