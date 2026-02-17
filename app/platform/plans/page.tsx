'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Calendar, Copy, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'
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
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Calculator } from '@/components/calculator'
import { Progress } from '@/components/ui/progress'

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
  const [editedIsCompleted, setEditedIsCompleted] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [newPlanItemAmount, setNewPlanItemAmount] = useState('')
  const [newPlanItemCategoryId, setNewPlanItemCategoryId] = useState('')
  const [newPlanItemDueDate, setNewPlanItemDueDate] = useState('')
  const [allExpenseCategories, setAllExpenseCategories] = useState<any[]>([])
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isLargeScreen, setIsLargeScreen] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024) // lg breakpoint
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

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
    setEditedIsCompleted(subcategory.isCompleted || false)
    setIsEditDialogOpen(true)
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
            is_completed: editedIsCompleted,
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
    setEditedIsCompleted(false)
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

      // Close dialog/drawer
      setIsAddDialogOpen(false)

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
        
        console.log('[Plans Page] Deleting plan item:', planItemId)
        
        if (planItemId) {
          const { error } = await supabase
            .from('plan_items')
            .delete()
            .eq('id', planItemId)

          if (error) {
            console.error('[Plans Page] Delete error:', error)
            throw error
          }
          
          console.log('[Plans Page] Successfully deleted plan item')
        } else {
          console.log('[Plans Page] No planItemId, skipping database delete')
        }

        // Update state directly instead of reloading to avoid page refresh
        console.log('[Plans Page] Updating state for category:', editingItem.categoryId, 'subcategory:', editingItem.subcategory.id)
        setCategories(prevCategories => 
          prevCategories.map(category => 
            category.id === editingItem.categoryId
              ? {
                  ...category,
                  subcategories: category.subcategories.map(sub =>
                    sub.id === editingItem.subcategory.id
                      ? {
                          ...sub,
                          plannedAmount: 0,
                          dueDate: undefined,
                          isCompleted: false,
                          planItemId: undefined,
                        }
                      : sub
                  )
                }
              : category
          )
        )
        
        console.log('[Plans Page] State updated, closing dialog')
        
        // Close dialog after deletion
        handleCancelEdit()
      } catch (error) {
        console.error('[Plans Page] Error deleting plan item:', error)
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
            Track your budget for {getMonthName(currentMonth)} {currentYear}
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
          
          {/* Large Screen: Dialog */}
          {isLargeScreen ? (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
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
                        inputMode="decimal"
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
          ) : (
            /* Small/Medium Screen: Drawer from bottom */
            <Drawer open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DrawerTrigger asChild>
                <Button className="gap-2" size="sm">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Plan Item</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </DrawerTrigger>
              <DrawerContent className="max-h-[70vh]">
                <div className="flex flex-col h-full">
                  <DrawerHeader className="flex-shrink-0">
                    <DrawerTitle>Add Plan Item</DrawerTitle>
                    <DrawerDescription>
                      Add a planned amount for an expense category
                    </DrawerDescription>
                  </DrawerHeader>
                  <div className="px-4 pb-4 space-y-4 overflow-y-auto flex-1 min-h-0">
                  <div className="space-y-2">
                    <Label htmlFor="expense-category-drawer">Expense Category</Label>
                    <select
                      id="expense-category-drawer"
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
                    <Label htmlFor="amount-drawer">Planned Amount</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="amount-drawer"
                        type="number"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={newPlanItemAmount}
                        onChange={(e) => setNewPlanItemAmount(e.target.value)}
                      />
                      <Calculator onCalculate={(value) => setNewPlanItemAmount(value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate-drawer">Due Date (Optional)</Label>
                    <Input 
                      id="dueDate-drawer" 
                      type="date" 
                      value={newPlanItemDueDate}
                      onChange={(e) => setNewPlanItemDueDate(e.target.value)}
                    />
                  </div>
                  </div>
                  <DrawerFooter className="flex-shrink-0">
                    <Button className="w-full" onClick={handleAddPlanItem}>Add Plan Item</Button>
                    <DrawerClose asChild>
                      <Button variant="outline" className="w-full">Cancel</Button>
                    </DrawerClose>
                  </DrawerFooter>
                </div>
              </DrawerContent>
            </Drawer>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          {(() => {
            const allExpenseItems = categories
              .filter(cat => cat.type === 'expense')
              .flatMap(cat => cat.subcategories)
            
            const totalPlanned = allExpenseItems.reduce((sum, item) => sum + (item.plannedAmount || 0), 0)
            const totalSpent = allExpenseItems.reduce((sum, item) => sum + item.actualAmount, 0)
            const remaining = totalPlanned - totalSpent
            const completedCount = allExpenseItems.filter(item => item.isCompleted || item.actualAmount >= (item.plannedAmount || 0)).length
            
            return (
              <>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Planned</CardDescription>
                    <CardTitle className="text-2xl">{formatCurrency(totalPlanned)}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Spent</CardDescription>
                    <CardTitle className="text-2xl" style={{ color: totalSpent > totalPlanned ? '#ef4444' : undefined }}>
                      {formatCurrency(totalSpent)}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Remaining</CardDescription>
                    <CardTitle className="text-2xl" style={{ color: remaining >= 0 ? '#22c55e' : '#ef4444' }}>
                      {formatCurrency(remaining)}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Completed Items</CardDescription>
                    <CardTitle className="text-2xl">
                      {completedCount} / {allExpenseItems.length}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </>
            )
          })()}
        </div>

        {/* Overall Budget Progress Bar */}
        {(() => {
          const allExpenseItems = categories
            .filter(cat => cat.type === 'expense')
            .flatMap(cat => cat.subcategories)
          
          const totalPlanned = allExpenseItems.reduce((sum, item) => sum + (item.plannedAmount || 0), 0)
          const totalSpent = allExpenseItems.reduce((sum, item) => sum + item.actualAmount, 0)
          const overallPercentage = totalPlanned > 0 ? (totalSpent / totalPlanned) * 100 : 0
          
          if (totalPlanned === 0) return null
          
          return (
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Monthly Budget Progress</CardTitle>
                  <div className="text-2xl font-bold" style={{ 
                    color: overallPercentage > 100 ? '#ef4444' : overallPercentage >= 90 ? '#f59e0b' : '#22c55e' 
                  }}>
                    {overallPercentage.toFixed(1)}%
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="relative">
                    <Progress 
                      value={Math.min(overallPercentage, 100)} 
                      className="h-6"
                      indicatorStyle={{
                        backgroundColor: overallPercentage > 100 ? '#ef4444' : overallPercentage >= 90 ? '#f59e0b' : '#3b82f6',
                      }}
                    />
                    {overallPercentage >= 15 && (
                      <div className="absolute inset-0 flex items-center justify-end pr-2">
                        <span className="text-xs font-bold text-white drop-shadow">
                          {formatCurrency(totalSpent)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Spent: {formatCurrency(totalSpent)}</span>
                    <span>Budget: {formatCurrency(totalPlanned)}</span>
                  </div>
                </div>
              </CardHeader>
            </Card>
          )
        })()}
      </div>

      {/* Pie Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Expense Groups Pie Chart */}
        {(() => {
          const expenseGroupsData = categories
            .filter(cat => cat.type === 'expense')
            .map(cat => ({
              name: cat.name,
              value: cat.subcategories.reduce((sum, sub) => sum + sub.actualAmount, 0),
              color: cat.color,
            }))
            .filter(item => item.value > 0)
            .sort((a, b) => b.value - a.value)

          const totalSpent = expenseGroupsData.reduce((sum, item) => sum + item.value, 0)

          return (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Spending by Category</CardTitle>
                <CardDescription>
                  {expenseGroupsData.length > 0 
                    ? `Total spent: ${formatCurrency(totalSpent)}`
                    : 'No expenses recorded this month'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {expenseGroupsData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={expenseGroupsData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => 
                            percent && percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {expenseGroupsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: any) => formatCurrency(value)}
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '1px solid #ccc',
                            borderRadius: '8px',
                            padding: '8px 12px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 space-y-2">
                      {expenseGroupsData.map((item) => (
                        <div key={item.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="font-medium">{item.name}</span>
                          </div>
                          <span className="font-semibold">{formatCurrency(item.value)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    <p>Record some transactions to see spending breakdown</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })()}

        {/* Budget Allocation by Group Pie Chart */}
        {(() => {
          const budgetByGroup = categories
            .filter(cat => cat.type === 'expense')
            .map(cat => ({
              name: cat.name,
              planned: cat.subcategories.reduce((sum, sub) => sum + (sub.plannedAmount || 0), 0),
              spent: cat.subcategories.reduce((sum, sub) => sum + sub.actualAmount, 0),
              color: cat.color,
            }))
            .filter(item => item.planned > 0)
            .sort((a, b) => b.planned - a.planned)

          const totalPlanned = budgetByGroup.reduce((sum, item) => sum + item.planned, 0)

          return (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Budget Allocation</CardTitle>
                <CardDescription>
                  {budgetByGroup.length > 0 
                    ? `Total budget: ${formatCurrency(totalPlanned)}`
                    : 'No budget items planned this month'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {budgetByGroup.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={budgetByGroup}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => 
                            percent && percent > 0.08 ? `${(percent * 100).toFixed(0)}%` : ''
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="planned"
                        >
                          {budgetByGroup.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: any) => formatCurrency(value)}
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '1px solid #ccc',
                            borderRadius: '8px',
                            padding: '8px 12px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 space-y-2">
                      {budgetByGroup.map((item) => (
                        <div key={item.name} className="flex items-center justify-between text-sm gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div
                              className="h-3 w-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="font-medium">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-muted-foreground">{formatCurrency(item.spent)}</span>
                            <span className="font-semibold">{formatCurrency(item.planned)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    <p>Add budget amounts to plan items to see allocation</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })()}
      </div>

      {/* Expense Groups */}
      <div className="space-y-4">
        {categories
          .filter(group => group.type === 'expense' && group.subcategories.length > 0)
          .map((group) => {
            const groupPlanned = group.subcategories.reduce((sum, sub) => sum + (sub.plannedAmount || 0), 0)
            const groupSpent = group.subcategories.reduce((sum, sub) => sum + sub.actualAmount, 0)
            const groupRemaining = groupPlanned - groupSpent
            const groupPercentage = groupPlanned > 0 ? (groupSpent / groupPlanned) * 100 : (groupSpent > 0 ? 100 : 0)
            
            return (
              <Card key={group.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: group.color }}
                      />
                      <CardTitle>{group.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-4">
                      {groupPlanned > 0 && (
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Planned</div>
                          <div className="font-semibold">{formatCurrency(groupPlanned)}</div>
                        </div>
                      )}
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">
                          {groupPlanned > 0 ? 'Spent' : 'Total'}
                        </div>
                        <div className="font-semibold" style={{ color: group.color }}>
                          {formatCurrency(groupSpent)}
                        </div>
                      </div>
                      {groupPlanned > 0 && (
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Remaining</div>
                          <div
                            className="font-semibold"
                            style={{
                              color: groupRemaining >= 0 ? '#22c55e' : '#ef4444',
                            }}
                          >
                            {formatCurrency(groupRemaining)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Overall Progress</span>
                      <span className="font-bold">{groupPercentage.toFixed(0)}%</span>
                    </div>
                    <Progress 
                      value={Math.min(groupPercentage, 100)} 
                      className="h-3"
                      indicatorStyle={{
                        backgroundColor: groupPercentage > 100 ? '#ef4444' : group.color,
                      }}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {group.subcategories
                      .map((item) => {
                        const completionPercentage = item.plannedAmount > 0 
                          ? (item.actualAmount / item.plannedAmount) * 100 
                          : (item.actualAmount > 0 ? 100 : 0)
                        const isOverBudget = item.actualAmount > (item.plannedAmount || 0)
                        const isComplete = item.isCompleted || completionPercentage >= 100
                        
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleEditItem(group.id, item)}
                            className={`rounded-lg border p-4 transition-all cursor-pointer active:scale-[0.98] ${
                              isComplete ? 'bg-muted/30 border-green-200 dark:border-green-900' : 'hover:shadow-md hover:border-primary/50'
                            }`}
                          >
                            <div className="space-y-3">
                              {/* Header with title and badges */}
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <div className="font-semibold text-base mb-1">{item.name}</div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {item.dueDate && (
                                      <Badge variant="outline" className="text-xs">
                                        Due: {new Date(item.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                      </Badge>
                                    )}
                                    {isComplete && (
                                      <Badge className="text-xs bg-green-600 hover:bg-green-700">
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        Complete
                                      </Badge>
                                    )}
                                    {isOverBudget && !isComplete && (
                                      <Badge variant="destructive" className="text-xs">
                                        Over Budget
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <div className="text-xs text-muted-foreground mb-1">Spent</div>
                                  <div className="text-2xl font-bold" style={{
                                    color: isOverBudget ? '#ef4444' : isComplete ? '#22c55e' : undefined
                                  }}>
                                    {formatCurrency(item.actualAmount)}
                                  </div>
                                </div>
                              </div>

                              {/* Budget info */}
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Budget</span>
                                <span className="font-semibold">{formatCurrency(item.plannedAmount || 0)}</span>
                              </div>
                              
                              {/* Progress bar */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-foreground">{completionPercentage.toFixed(0)}%</span>
                                    <span className="text-muted-foreground">complete</span>
                                  </div>
                                  <div>
                                    {item.plannedAmount > item.actualAmount && (
                                      <span className="font-medium text-green-600 dark:text-green-400">
                                        {formatCurrency(item.plannedAmount - item.actualAmount)} left
                                      </span>
                                    )}
                                    {isOverBudget && (
                                      <span className="font-medium text-red-600 dark:text-red-400">
                                        {formatCurrency(item.actualAmount - (item.plannedAmount || 0))} over
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <Progress 
                                  value={Math.min(completionPercentage, 100)} 
                                  className="h-4"
                                  indicatorStyle={{
                                    backgroundColor: isOverBudget ? '#ef4444' : (isComplete ? '#22c55e' : group.color),
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        {categories
          .filter(cat => cat.type === 'expense')
          .flatMap(cat => cat.subcategories).length === 0 && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <p>No expense categories found. Add some categories to start budgeting.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Plan Item Dialog/Drawer */}
      {isLargeScreen ? (
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
          if (!open) handleCancelEdit()
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Plan Item</DialogTitle>
              <DialogDescription>
                Update details for {editingItem?.subcategory?.name || 'this item'}
              </DialogDescription>
            </DialogHeader>
            {editingItem && (
              <div className="space-y-4">
                <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Spent This Month</span>
                    <span className="text-lg font-bold">{formatCurrency(editingItem.subcategory.actualAmount)}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-amount" className="text-base">Budget Amount</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="edit-amount"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      placeholder="0.00"
                      value={editedAmount}
                      onChange={(e) => setEditedAmount(e.target.value)}
                      className="text-lg h-12"
                    />
                    <Calculator onCalculate={(value) => setEditedAmount(value)} />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-dueDate" className="text-base">Due Date (Optional)</Label>
                  <Input
                    id="edit-dueDate"
                    type="date"
                    value={editedDueDate}
                    onChange={(e) => setEditedDueDate(e.target.value)}
                    className="h-12"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <div className="font-medium">Mark as Complete</div>
                    <div className="text-sm text-muted-foreground">Track completion status</div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={editedIsCompleted}
                    onClick={() => setEditedIsCompleted(!editedIsCompleted)}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                      editedIsCompleted ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                        editedIsCompleted ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Button className="w-full h-12 text-base" onClick={handleSaveEdit}>
                    Save Changes
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" className="h-12" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="h-12" 
                      onClick={handleDeleteItem}
                      disabled={editingItem?.subcategory?.name === 'Untracked'}
                      title={editingItem?.subcategory?.name === 'Untracked' ? 'System subcategory cannot be deleted' : 'Delete this plan item'}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={isEditDialogOpen} onOpenChange={(open) => {
          if (!open) handleCancelEdit()
        }}>
          <DrawerContent className="max-h-[70vh]">
            <div className="flex flex-col h-full">
              <DrawerHeader className="flex-shrink-0">
                <DrawerTitle>Edit Plan Item</DrawerTitle>
                <DrawerDescription>
                  Update details for {editingItem?.subcategory?.name || 'this item'}
                </DrawerDescription>
              </DrawerHeader>
              {editingItem && (
                <div className="px-4 pb-4 space-y-4 overflow-y-auto flex-1 min-h-0">
                <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Spent This Month</span>
                    <span className="text-lg font-bold">{formatCurrency(editingItem.subcategory.actualAmount)}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-amount-drawer" className="text-base">Budget Amount</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="edit-amount-drawer"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      placeholder="0.00"
                      value={editedAmount}
                      onChange={(e) => setEditedAmount(e.target.value)}
                      className="text-lg h-12"
                    />
                    <Calculator onCalculate={(value) => setEditedAmount(value)} />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-dueDate-drawer" className="text-base">Due Date (Optional)</Label>
                  <Input
                    id="edit-dueDate-drawer"
                    type="date"
                    value={editedDueDate}
                    onChange={(e) => setEditedDueDate(e.target.value)}
                    className="h-12"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <div className="font-medium">Mark as Complete</div>
                    <div className="text-sm text-muted-foreground">Track completion status</div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={editedIsCompleted}
                    onClick={() => setEditedIsCompleted(!editedIsCompleted)}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                      editedIsCompleted ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                        editedIsCompleted ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Button className="w-full h-12 text-base" onClick={handleSaveEdit}>
                    Save Changes
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" className="h-12" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="h-12" 
                      onClick={handleDeleteItem}
                      disabled={editingItem?.subcategory?.name === 'Untracked'}
                      title={editingItem?.subcategory?.name === 'Untracked' ? 'System subcategory cannot be deleted' : 'Delete this plan item'}
                    >
                      Delete
                    </Button>
                  </div>
                  </div>
                </div>
              )}
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  )
}
