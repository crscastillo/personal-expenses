'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Calendar, Copy, ChevronLeft, ChevronRight, Pencil } from 'lucide-react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { getMonthName, getCurrentMonth, getCurrentYear, formatCurrency } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Calculator } from '@/components/calculator'

// Type definitions
type Subcategory = {
  id: string
  name: string
  plannedAmount: number
  actualAmount: number
  dueDate?: string
}

type Category = {
  id: string
  name: string
  type: 'income' | 'expense'
  color: string
  subcategories: Subcategory[]
}

// Category colors
const categoryColors: Record<string, string> = {
  'Income': '#22c55e',
  'Investments': '#8b5cf6',
  'Savings': '#3b82f6',
  'Fixed Costs': '#ef4444',
  'Guilt-Free Spending': '#f59e0b',
  'Misc': '#6b7280',
}

export default function BudgetsPage() {
  const supabase = createClient()
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth())
  const [currentYear, setCurrentYear] = useState(getCurrentYear())
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [editingItem, setEditingItem] = useState<any>(null)
  const [editedAmount, setEditedAmount] = useState('')
  const [editedDueDate, setEditedDueDate] = useState('')
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [newCategoryAmount, setNewCategoryAmount] = useState('')

  useEffect(() => {
    loadBudgetData()
  }, [currentMonth, currentYear])
  
  const loadBudgetData = async () => {
    try {
      setIsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      // Calculate start and end dates for the selected month
      const startDate = new Date(currentYear, currentMonth - 1, 1)
      const endDate = new Date(currentYear, currentMonth, 0)
      
      // Load all categories with subcategories
      const { data: categoriesData, error: catError } = await supabase
        .from('categories')
        .select('*')
        .order('display_order')
      
      if (catError) throw catError
      
      // Load user's subcategories
      const { data: subcategoriesData, error: subError } = await supabase
        .from('subcategories')
        .select('*')
        .eq('user_id', user.id)
        .order('name')
      
      if (subError) throw subError
      
      // Load transactions for the selected month
      const { data: transactionsData, error: transError } = await supabase
        .from('transactions')
        .select('amount, subcategory_id, transfer_to_account_id')
        .eq('user_id', user.id)
        .gte('transaction_date', startDate.toISOString().split('T')[0])
        .lte('transaction_date', endDate.toISOString().split('T')[0])
      
      if (transError) throw transError
      
      // Calculate actual amounts per subcategory
      const actualAmounts: Record<string, number> = {}
      transactionsData?.forEach(t => {
        if (t.transfer_to_account_id) return // Skip transfers
        if (t.subcategory_id) {
          actualAmounts[t.subcategory_id] = (actualAmounts[t.subcategory_id] || 0) + Math.abs(parseFloat(t.amount.toString()))
        }
      })
      
      // Build categories with subcategories
      const builtCategories: Category[] = (categoriesData || []).map(cat => ({
        id: cat.id,
        name: cat.name,
        type: cat.type as 'income' | 'expense',
        color: categoryColors[cat.name] || '#6b7280',
        subcategories: (subcategoriesData || [])
          .filter(sub => sub.category_id === cat.id)
          .map(sub => ({
            id: sub.id,
            name: sub.name,
            plannedAmount: 0, // TODO: Load from budgets table when implemented
            actualAmount: actualAmounts[sub.id] || 0,
            dueDate: undefined, // TODO: Load from budgets table when implemented
          }))
      }))
      
      setCategories(builtCategories)
    } catch (error) {
      console.error('Error loading budget data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const nextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const previousMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const handleEditItem = (categoryId: string, subcategory: any) => {
    setEditingItem({ categoryId, subcategory })
    setEditedAmount(subcategory.plannedAmount.toString())
    setEditedDueDate(subcategory.dueDate || '')
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = () => {
    if (!editingItem) return
    
    const newAmount = parseFloat(editedAmount)
    if (isNaN(newAmount)) return

    // Update the categories state
    setCategories(prevCategories => 
      prevCategories.map(category => {
        if (category.id === editingItem.categoryId) {
          return {
            ...category,
            subcategories: category.subcategories.map(sub => {
              if (sub.id === editingItem.subcategory.id) {
                return {
                  ...sub,
                  plannedAmount: newAmount,
                  dueDate: editedDueDate || undefined,
                }
              }
              return sub
            }),
          }
        }
        return category
      })
    )
    
    // TODO: Update the budget item in Supabase
    console.log('Saving budget item:', {
      subcategoryId: editingItem.subcategory.id,
      plannedAmount: newAmount,
      dueDate: editedDueDate || null,
    })
    
    setIsEditDialogOpen(false)
    setEditingItem(null)
  }

  const handleCancelEdit = () => {
    setIsEditDialogOpen(false)
    setEditingItem(null)
    setEditedAmount('')
    setEditedDueDate('')
  }

  // Calculate chart data - use actual amounts since we don't have planned budgets yet
  const incomeChartData = categories
    .filter(cat => cat.type === 'income')
    .flatMap(cat => 
      cat.subcategories
        .filter(sub => sub.actualAmount > 0) // Only show subcategories with actual income
        .map(sub => ({
          name: sub.name,
          value: sub.actualAmount,
          color: cat.color,
        }))
    )

  const expenseChartData = categories
    .filter(cat => cat.type === 'expense' && cat.name !== 'Misc')
    .map(cat => ({
      name: cat.name,
      value: cat.subcategories.reduce((sum, sub) => sum + sub.actualAmount, 0),
      color: cat.color,
    }))
    .filter(cat => cat.value > 0) // Only show categories with actual spending

  const handleDeleteItem = () => {
    if (!editingItem) return

    // Prevent deletion of Untracked subcategory
    if (editingItem.subcategory.name === 'Untracked') {
      alert('The Untracked subcategory cannot be deleted. It is protected for uncategorized transactions.')
      return
    }

    if (confirm(`Are you sure you want to delete "${editingItem.subcategory.name}" from this month's budget?`)) {
      setCategories(prevCategories =>
        prevCategories.map(category => {
          if (category.id === editingItem.categoryId) {
            return {
              ...category,
              subcategories: category.subcategories.filter(sub => sub.id !== editingItem.subcategory.id),
            }
          }
          return category
        })
      )

      // TODO: Delete from Supabase
      console.log('Deleting budget item:', {
        categoryId: editingItem.categoryId,
        subcategoryId: editingItem.subcategory.id,
      })

      // Close dialog after deletion
      handleCancelEdit()
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Monthly Budget</h1>
            <p className="text-muted-foreground">Loading budget data...</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-muted rounded w-32"></div>
                <div className="h-4 bg-muted rounded w-48"></div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monthly Budget</h1>
          <p className="text-muted-foreground">
            Review your spending for {getMonthName(currentMonth)} {currentYear}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={previousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 rounded-lg border px-4 py-2">
            <Calendar className="h-4 w-4" />
            <span className="font-medium">
              {getMonthName(currentMonth)} {currentYear}
            </span>
          </div>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Copy className="h-4 w-4" />
                Copy from Previous
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Copy Budget</DialogTitle>
                <DialogDescription>
                  Copy budget from previous month to get started quickly
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <p>This will copy all budget items from the previous month.</p>
                <Button className="w-full">Copy Budget</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Custom Category</DialogTitle>
                <DialogDescription>
                  Create a custom subcategory for your budget
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option>Income</option>
                    <option>Investments</option>
                    <option>Savings</option>
                    <option>Fixed Costs</option>
                    <option>Guilt-Free Spending</option>
                    <option>Misc</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Subcategory Name</Label>
                  <Input id="name" placeholder="e.g., Side Project" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Planned Amount</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={newCategoryAmount}
                      onChange={(e) => setNewCategoryAmount(e.target.value)}
                    />
                    <Calculator onCalculate={(value) => setNewCategoryAmount(value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date (Optional)</Label>
                  <Input id="dueDate" type="date" />
                </div>
                <Button className="w-full">Add Subcategory</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Income by Source</CardTitle>
            <CardDescription>Actual income received this month</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {incomeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={incomeChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {incomeChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value) || 0)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No income received this month
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
            <CardDescription>Actual spending by category this month</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {expenseChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expenseChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value) || 0)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No expenses recorded this month
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Budget Categories */}
      <div className="space-y-4">
        {categories
          .filter(cat => cat.subcategories.some(sub => sub.actualAmount > 0 || sub.plannedAmount > 0))
          .map((category) => {
          const totalPlanned = category.subcategories.reduce(
            (sum, sub) => sum + sub.plannedAmount,
            0
          )
          const totalActual = category.subcategories.reduce(
            (sum, sub) => sum + sub.actualAmount,
            0
          )
          const percentage = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 100

          return (
            <Card key={category.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <CardTitle>{category.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-4">
                    {totalPlanned > 0 && (
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Planned</div>
                        <div className="font-semibold">{formatCurrency(totalPlanned)}</div>
                      </div>
                    )}
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        {totalPlanned > 0 ? 'Actual' : 'Total'}
                      </div>
                      <div className="font-semibold" style={{ color: category.color }}>
                        {formatCurrency(totalActual)}
                      </div>
                    </div>
                    {totalPlanned > 0 && (
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Remaining</div>
                        <div
                          className="font-semibold"
                          style={{
                            color: totalPlanned - totalActual >= 0 ? '#22c55e' : '#ef4444',
                          }}
                        >
                          {formatCurrency(totalPlanned - totalActual)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {totalPlanned > 0 && (
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${Math.min(percentage, 100)}%`,
                        backgroundColor: category.color,
                      }}
                    />
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {category.subcategories
                    .filter(sub => sub.actualAmount > 0 || sub.plannedAmount > 0)
                    .map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{sub.name}</span>
                        {sub.dueDate && (
                          <Badge variant="outline" className="text-xs">
                            Due: {new Date(sub.dueDate).toLocaleDateString()}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-medium">{formatCurrency(sub.actualAmount)}</span>
                        {sub.plannedAmount > 0 && (
                          <>
                            <span className="text-muted-foreground">/</span>
                            <span className="text-muted-foreground">{formatCurrency(sub.plannedAmount)}</span>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEditItem(category.id, sub)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
        {categories.filter(cat => cat.subcategories.some(sub => sub.actualAmount > 0 || sub.plannedAmount > 0)).length === 0 && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <p className="mb-2">No transactions for this month yet.</p>
                <p className="text-sm">Add transactions to see your spending breakdown.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Budget Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        if (!open) handleCancelEdit()
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Budget Item</DialogTitle>
            <DialogDescription>
              Update the planned amount for {editingItem?.subcategory?.name || 'this item'}
            </DialogDescription>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-amount">Planned Amount</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="edit-amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={editedAmount}
                    onChange={(e) => setEditedAmount(e.target.value)}
                  />
                  <Calculator onCalculate={(value) => setEditedAmount(value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-dueDate">Due Date (Optional)</Label>
                <Input
                  id="edit-dueDate"
                  type="date"
                  value={editedDueDate}
                  onChange={(e) => setEditedDueDate(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={handleSaveEdit}>
                  Save Changes
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  className="flex-1" 
                  onClick={handleDeleteItem}
                  disabled={editingItem.subcategory.name === 'Untracked'}
                  title={editingItem.subcategory.name === 'Untracked' ? 'System subcategory cannot be deleted' : 'Delete this budget item'}
                >
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
