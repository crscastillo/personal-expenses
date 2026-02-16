'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Calendar, Copy, ChevronLeft, ChevronRight, Pencil, CheckCircle2, Circle } from 'lucide-react'
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
  isCompleted: boolean
  planItemId?: string
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

export default function PlansPage() {
  const supabase = createClient()
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth())
  const [currentYear, setCurrentYear] = useState(getCurrentYear())
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [editingItem, setEditingItem] = useState<any>(null)
  const [editedAmount, setEditedAmount] = useState('')
  const [editedDueDate, setEditedDueDate] = useState('')
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [newPlanItemAmount, setNewPlanItemAmount] = useState('')
  const [newPlanItemCategoryId, setNewPlanItemCategoryId] = useState('')
  const [newPlanItemDueDate, setNewPlanItemDueDate] = useState('')
  const [allExpenseCategories, setAllExpenseCategories] = useState<any[]>([])
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null)

  useEffect(() => {
    loadPlanData()
  }, [currentMonth, currentYear])
  
  const loadPlanData = async () => {
    try {
      setIsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      // Calculate start and end dates for the selected month
      const startDate = new Date(currentYear, currentMonth - 1, 1)
      const endDate = new Date(currentYear, currentMonth, 0)
      
      // Load user's expense groups
      const { data: expenseGroupsData, error: groupError } = await supabase
        .from('expense_groups')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order')
      
      if (groupError) throw groupError
      
      // Load user's expense categories with groups
      const { data: expenseCategoriesData, error: catError } = await supabase
        .from('expense_categories')
        .select('*, expense_group:expense_groups(name)')
        .eq('user_id', user.id)
        .order('name')
      
      if (catError) throw catError
      
      // Store all expense categories for dropdown
      setAllExpenseCategories(expenseCategoriesData || [])
      
      // Load or create monthly plan
      let planId: string | null = null
      const { data: existingPlan, error: planError } = await supabase
        .from('monthly_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .single()
      
      if (planError && planError.code !== 'PGRST116') throw planError
      
      if (existingPlan) {
        planId = existingPlan.id
      } else {
        // Create a new plan for this month
        const { data: newPlan, error: createError } = await supabase
          .from('monthly_plans')
          .insert({
            user_id: user.id,
            month: currentMonth,
            year: currentYear,
          })
          .select()
          .single()
        
        if (createError) throw createError
        planId = newPlan.id
      }
      
      setCurrentPlanId(planId)
      
      // Load plan items for this month
      const { data: planItemsData, error: planItemsError } = await supabase
        .from('plan_items')
        .select('*')
        .eq('plan_id', planId)
      
      if (planItemsError) throw planItemsError
      
      // Create a map of plan items by expense_category_id
      const planItemsMap: Record<string, any> = {}
      planItemsData?.forEach(item => {
        planItemsMap[item.expense_category_id] = item
      })
      
      // Load transactions for the selected month
      const { data: transactionsData, error: transError } = await supabase
        .from('transactions')
        .select('amount, expense_category_id, transfer_to_account_id')
        .eq('user_id', user.id)
        .gte('transaction_date', startDate.toISOString().split('T')[0])
        .lte('transaction_date', endDate.toISOString().split('T')[0])
      
      if (transError) throw transError
      
      // Calculate actual amounts per expense category
      const actualAmounts: Record<string, number> = {}
      transactionsData?.forEach(t => {
        if (t.transfer_to_account_id) return // Skip transfers
        if (t.expense_category_id) {
          actualAmounts[t.expense_category_id] = (actualAmounts[t.expense_category_id] || 0) + Math.abs(parseFloat(t.amount.toString()))
        }
      })
      
      // Build expense groups with expense categories
      const builtCategories: Category[] = (expenseGroupsData || []).map(group => ({
        id: group.id,
        name: group.name,
        type: group.type as 'income' | 'expense',
        color: categoryColors[group.name] || '#6b7280',
        subcategories: (expenseCategoriesData || [])
          .filter(cat => cat.expense_group_id === group.id)
          .map(cat => {
            const planItem = planItemsMap[cat.id]
            return {
              id: cat.id,
              name: cat.name,
              plannedAmount: planItem?.planned_amount || 0,
              actualAmount: actualAmounts[cat.id] || 0,
              dueDate: planItem?.due_date || undefined,
              isCompleted: planItem?.is_completed || false,
              planItemId: planItem?.id,
            }
          })
      }))
      
      setCategories(builtCategories)
    } catch (error) {
      console.error('Error loading plan data:', error)
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

  const handleToggleCompletion = async (subcategory: any) => {
    if (!subcategory.planItemId) return
    
    const newIsCompleted = !subcategory.isCompleted

    try {
      const { error } = await supabase
        .from('plan_items')
        .update({
          is_completed: newIsCompleted,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subcategory.planItemId)

      if (error) throw error

      // Update state directly instead of reloading all data
      setCategories(prevCategories => 
        prevCategories.map(category => ({
          ...category,
          subcategories: category.subcategories.map(sub =>
            sub.id === subcategory.id
              ? { ...sub, isCompleted: newIsCompleted }
              : sub
          )
        }))
      )
    } catch (error) {
      console.error('Error updating completion status:', error)
      alert('Failed to update completion status. Please try again.')
    }
  }

  const handleSaveEdit = async () => {
    if (!editingItem || !currentPlanId) return
    
    const newAmount = parseFloat(editedAmount)
    if (isNaN(newAmount)) return

    try {
      const planItem = editingItem.subcategory.planItemId

      if (planItem) {
        // Update existing plan item
        const { error } = await supabase
          .from('plan_items')
          .update({
            planned_amount: newAmount,
            due_date: editedDueDate || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', planItem)

        if (error) throw error
      } else {
        // Create new plan item
        const { error } = await supabase
          .from('plan_items')
          .insert({
            plan_id: currentPlanId,
            expense_category_id: editingItem.subcategory.id,
            planned_amount: newAmount,
            due_date: editedDueDate || null,
          })

        if (error) throw error
      }

      // Reload data to reflect changes
      await loadPlanData()
      
      setIsEditDialogOpen(false)
      setEditingItem(null)
    } catch (error) {
      console.error('Error saving plan item:', error)
      alert('Failed to save plan item. Please try again.')
    }
  }

  const handleCancelEdit = () => {
    setIsEditDialogOpen(false)
    setEditingItem(null)
    setEditedAmount('')
    setEditedDueDate('')
  }

  const handleAddPlanItem = async () => {
    if (!currentPlanId || !newPlanItemCategoryId || !newPlanItemAmount) {
      alert('Please fill in all required fields')
      return
    }

    const amount = parseFloat(newPlanItemAmount)
    if (isNaN(amount)) {
      alert('Please enter a valid amount')
      return
    }

    try {
      const { error } = await supabase
        .from('plan_items')
        .insert({
          plan_id: currentPlanId,
          expense_category_id: newPlanItemCategoryId,
          planned_amount: amount,
          due_date: newPlanItemDueDate || null,
        })

      if (error) throw error

      // Reset form
      setNewPlanItemAmount('')
      setNewPlanItemCategoryId('')
      setNewPlanItemDueDate('')

      // Reload data
      await loadPlanData()
    } catch (error: any) {
      console.error('Error adding plan item:', error)
      if (error.code === '23505') {
        alert('A plan item for this category already exists in this month')
      } else {
        alert('Failed to add plan item. Please try again.')
      }
    }
  }

  // Calculate chart data - use actual amounts since we don't have planned amounts yet
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

  const handleDeleteItem = async () => {
    if (!editingItem) return

    // Prevent deletion of Untracked subcategory
    if (editingItem.subcategory.name === 'Untracked') {
      alert('The Untracked subcategory cannot be deleted. It is protected for uncategorized transactions.')
      return
    }

    if (confirm(`Are you sure you want to delete "${editingItem.subcategory.name}" from this month's plan?`)) {
      try {
        const planItemId = editingItem.subcategory.planItemId
        
        if (planItemId) {
          const { error } = await supabase
            .from('plan_items')
            .delete()
            .eq('id', planItemId)

          if (error) throw error
        }

        // Reload data to reflect changes
        await loadPlanData()
        
        // Close dialog after deletion
        handleCancelEdit()
      } catch (error) {
        console.error('Error deleting plan item:', error)
        alert('Failed to delete plan item. Please try again.')
      }
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Monthly Plan</h1>
            <p className="text-muted-foreground">Loading plan data...</p>
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
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Monthly Plan</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Review your spending for {getMonthName(currentMonth)} {currentYear}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 rounded-lg border px-3 py-2 md:px-4">
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium md:text-base">
                {getMonthName(currentMonth)} {currentYear}
              </span>
            </div>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2" size="sm">
                <Copy className="h-4 w-4" />
                <span className="hidden sm:inline">Copy from Previous</span>
                <span className="sm:hidden">Copy</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Copy Plan</DialogTitle>
                <DialogDescription>
                  Copy plan from previous month to get started quickly
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <p>This will copy all plan items from the previous month.</p>
                <Button className="w-full">Copy Plan</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2" size="sm">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Plan Item</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Plan Item</DialogTitle>
                <DialogDescription>
                  Add a planned amount for an expense category
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="expense-category">Expense Category</Label>
                  <select
                    id="expense-category"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                    value={newPlanItemCategoryId}
                    onChange={(e) => setNewPlanItemCategoryId(e.target.value)}
                  >
                    <option value="">Select a category</option>
                    {allExpenseCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} {cat.expense_group?.name && `(${cat.expense_group.name})`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Planned Amount</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={newPlanItemAmount}
                      onChange={(e) => setNewPlanItemAmount(e.target.value)}
                    />
                    <Calculator onCalculate={(value) => setNewPlanItemAmount(value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date (Optional)</Label>
                  <Input 
                    id="dueDate" 
                    type="date" 
                    value={newPlanItemDueDate}
                    onChange={(e) => setNewPlanItemDueDate(e.target.value)}
                  />
                </div>
                <Button className="w-full" onClick={handleAddPlanItem}>Add Plan Item</Button>
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

      {/* Plan Categories */}
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
                    .map((sub) => {
                      const displayAmount = sub.actualAmount
                      const completionPercentage = sub.plannedAmount > 0 
                        ? (displayAmount / sub.plannedAmount) * 100 
                        : 0
                      const isCompletedByTransactions = displayAmount >= sub.plannedAmount
                      const showCompletionToggle = sub.plannedAmount > 0 && !isCompletedByTransactions
                      
                      return (
                        <div
                          key={sub.id}
                          className="rounded-lg border p-3 space-y-2"
                        >
                          {/* Header row */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="font-medium">{sub.name}</span>
                              {sub.dueDate && (
                                <Badge variant="outline" className="text-xs">
                                  Due: {new Date(sub.dueDate).toLocaleDateString()}
                                </Badge>
                              )}
                              {sub.isCompleted && (
                                <Badge variant="secondary" className="text-xs">
                                  ✓ Complete
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-medium">{formatCurrency(displayAmount)}</span>
                              {sub.plannedAmount > 0 && (
                                <>
                                  <span className="text-muted-foreground">/</span>
                                  <span className="text-muted-foreground">{formatCurrency(sub.plannedAmount)}</span>
                                </>
                              )}
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleToggleCompletion(sub)}
                                  title={sub.isCompleted ? "Mark as incomplete" : "Mark as complete"}
                                >
                                  {sub.isCompleted ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <Circle className="h-4 w-4" />
                                  )}
                                </Button>
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
                          </div>
                          
                          {/* Progress bar */}
                          {sub.plannedAmount > 0 && (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden border border-gray-300 dark:border-gray-600">
                                <div
                                  className="h-full transition-all duration-300"
                                  style={{
                                    width: `${Math.min(completionPercentage, 100)}%`,
                                    backgroundColor: completionPercentage >= 100 ? '#22c55e' : category.color,
                                  }}
                                />
                              </div>
                              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 min-w-[3rem] text-right">
                                {completionPercentage.toFixed(0)}%
                              </span>
                            </div>
                          )}
                        </div>
                      )
                    })}
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

      {/* Edit Plan Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        if (!open) handleCancelEdit()
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Plan Item</DialogTitle>
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
                  title={editingItem.subcategory.name === 'Untracked' ? 'System subcategory cannot be deleted' : 'Delete this plan item'}
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
