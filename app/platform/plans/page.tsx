'use client'

import { useState, useEffect } from 'react'
import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Calendar, Copy, ChevronLeft, ChevronRight, CheckCircle2, ChevronDown, ChevronUp, List, LayoutGrid } from 'lucide-react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

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

// Helper function to parse date string in local timezone (avoids UTC conversion issues)
const parseLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
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
  
  // Quick category creation states
  const [showCreateCategory, setShowCreateCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryGroupId, setNewCategoryGroupId] = useState('')
  const [allExpenseGroups, setAllExpenseGroups] = useState<any[]>([])
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  
  // Collapsed groups state
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  
  // View mode state - default to table on large screens, list on small
  const [viewMode, setViewMode] = useState<'list' | 'table'>(
    typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'table' : 'list'
  )

  useEffect(() => {
    const checkScreenSize = () => {
      const isLarge = window.innerWidth >= 1024 // lg breakpoint
      setIsLargeScreen(isLarge)
      
      // Force list view on small screens
      if (!isLarge && viewMode === 'table') {
        setViewMode('list')
      }
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [viewMode])

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
      
      // Store all expense groups for category creation
      setAllExpenseGroups(expenseGroupsData || [])
      
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

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || !newCategoryGroupId) {
      alert('Please enter a category name and select an expense group')
      return
    }

    setIsCreatingCategory(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: newCategory, error } = await supabase
        .from('expense_categories')
        .insert({
          user_id: user.id,
          expense_group_id: newCategoryGroupId,
          name: newCategoryName.trim(),
          is_custom: true,
        })
        .select('*, expense_group:expense_groups(name)')
        .single()

      if (error) throw error

      // Add to categories list for dropdown
      setAllExpenseCategories([...allExpenseCategories, newCategory])
      
      // Add to categories state for the group display
      setCategories(prevCategories =>
        prevCategories.map(group => {
          if (group.id === newCategoryGroupId) {
            return {
              ...group,
              subcategories: [
                ...group.subcategories,
                {
                  id: newCategory.id,
                  name: newCategory.name,
                  plannedAmount: 0,
                  actualAmount: 0,
                  dueDate: undefined,
                  isCompleted: false,
                  planItemId: undefined,
                }
              ]
            }
          }
          return group
        })
      )
      
      // Auto-select the new category
      setNewPlanItemCategoryId(newCategory.id)
      
      // Reset and hide form
      setNewCategoryName('')
      setNewCategoryGroupId('')
      setShowCreateCategory(false)
      
    } catch (error: any) {
      console.error('Error creating category:', error)
      alert('Failed to create category. Please try again.')
    } finally {
      setIsCreatingCategory(false)
    }
  }

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(groupId)) {
        newSet.delete(groupId)
      } else {
        newSet.add(groupId)
      }
      return newSet
    })
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
        const { data: newPlanItem, error } = await supabase
          .from('plan_items')
          .insert({
            plan_id: currentPlanId,
            expense_category_id: editingItem.subcategory.id,
            planned_amount: newAmount,
            due_date: editedDueDate || null,
          })
          .select()
          .single()

        if (error) throw error
        
        // Update state with new plan item ID
        setCategories(prevCategories =>
          prevCategories.map(group => {
            if (group.id === editingItem.categoryId) {
              return {
                ...group,
                subcategories: group.subcategories.map(sub => {
                  if (sub.id === editingItem.subcategory.id) {
                    return {
                      ...sub,
                      plannedAmount: newAmount,
                      dueDate: editedDueDate || undefined,
                      isCompleted: editedIsCompleted,
                      planItemId: newPlanItem.id,
                    }
                  }
                  return sub
                })
              }
            }
            return group
          })
        )
      }

      // Update state optimistically for existing items
      if (planItem) {
        setCategories(prevCategories =>
          prevCategories.map(group => {
            if (group.id === editingItem.categoryId) {
              return {
                ...group,
                subcategories: group.subcategories.map(sub => {
                  if (sub.id === editingItem.subcategory.id) {
                    return {
                      ...sub,
                      plannedAmount: newAmount,
                      dueDate: editedDueDate || undefined,
                      isCompleted: editedIsCompleted,
                    }
                  }
                  return sub
                })
              }
            }
            return group
          })
        )
      }
      
      setIsEditDialogOpen(false)
      setEditingItem(null)
    } catch (error) {
      console.error('Error saving plan item:', error)
      alert('Failed to save plan item. Please try again.')
    }
  }

  const handleToggleComplete = async (groupId: string, item: Subcategory) => {
    if (!item.planItemId) return // Can't toggle if no plan item exists
    
    const newCompletedStatus = !item.isCompleted

    try {
      // Update in database
      const { error } = await supabase
        .from('plan_items')
        .update({
          is_completed: newCompletedStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.planItemId)

      if (error) throw error

      // Update state optimistically
      setCategories(prevCategories =>
        prevCategories.map(group => {
          if (group.id === groupId) {
            return {
              ...group,
              subcategories: group.subcategories.map(sub => {
                if (sub.id === item.id) {
                  return {
                    ...sub,
                    isCompleted: newCompletedStatus,
                  }
                }
                return sub
              })
            }
          }
          return group
        })
      )
    } catch (error) {
      console.error('Error toggling completion status:', error)
      alert('Failed to update status. Please try again.')
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
      const { data: newPlanItem, error } = await supabase
        .from('plan_items')
        .insert({
          plan_id: currentPlanId,
          expense_category_id: newPlanItemCategoryId,
          planned_amount: amount,
          due_date: newPlanItemDueDate || null,
        })
        .select()
        .single()

      if (error) throw error

      // Find the category and group for this plan item
      const category = allExpenseCategories.find(cat => cat.id === newPlanItemCategoryId)
      
      if (category) {
        // Update categories state optimistically
        setCategories(prevCategories => 
          prevCategories.map(group => {
            if (group.id === category.expense_group_id) {
              // Check if subcategory already exists
              const existingSubcategory = group.subcategories.find(sub => sub.id === newPlanItemCategoryId)
              
              if (existingSubcategory) {
                // Update existing subcategory
                return {
                  ...group,
                  subcategories: group.subcategories.map(sub => {
                    if (sub.id === newPlanItemCategoryId) {
                      return {
                        ...sub,
                        plannedAmount: amount,
                        dueDate: newPlanItemDueDate || undefined,
                        planItemId: newPlanItem.id,
                      }
                    }
                    return sub
                  })
                }
              } else {
                // Add new subcategory if it doesn't exist (newly created category)
                return {
                  ...group,
                  subcategories: [
                    ...group.subcategories,
                    {
                      id: category.id,
                      name: category.name,
                      plannedAmount: amount,
                      actualAmount: 0,
                      dueDate: newPlanItemDueDate || undefined,
                      isCompleted: false,
                      planItemId: newPlanItem.id,
                    }
                  ]
                }
              }
            }
            return group
          })
        )
      }

      // Reset form
      setNewPlanItemAmount('')
      setNewPlanItemCategoryId('')
      setNewPlanItemDueDate('')
      setShowCreateCategory(false)
      setNewCategoryName('')
      setNewCategoryGroupId('')

      // Close dialog/drawer
      setIsAddDialogOpen(false)
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
          {/* View mode toggle - hidden on small screens */}
          <div className="hidden lg:flex items-center gap-2 border rounded-lg p-1">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 px-3"
            >
              <List className="h-4 w-4 mr-1" />
              List
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="h-8 px-3"
            >
              <LayoutGrid className="h-4 w-4 mr-1" />
              Table
            </Button>
          </div>
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
                    <div className="flex items-center justify-between">
                      <Label htmlFor="expense-category">Expense Category</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowCreateCategory(!showCreateCategory)}
                        className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        {showCreateCategory ? (
                          <>
                            <ChevronUp className="h-3 w-3 mr-1" />
                            Hide
                          </>
                        ) : (
                          <>
                            <Plus className="h-3 w-3 mr-1" />
                            Create new
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {showCreateCategory && (
                      <div className="rounded-md border border-dashed border-muted-foreground/25 p-3 space-y-3 bg-muted/20">
                        <div className="space-y-2">
                          <Label htmlFor="new-category-group" className="text-xs">Group</Label>
                          <select
                            id="new-category-group"
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                            value={newCategoryGroupId}
                            onChange={(e) => setNewCategoryGroupId(e.target.value)}
                          >
                            <option value="">Select a group</option>
                            {allExpenseGroups
                              .sort((a, b) => {
                                // Sort income groups first, then expenses
                                if (a.type === 'income' && b.type !== 'income') return -1
                                if (a.type !== 'income' && b.type === 'income') return 1
                                return a.sort_order - b.sort_order
                              })
                              .map((group) => (
                                <option key={group.id} value={group.id}>
                                  {group.name}
                                </option>
                              ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new-category-name" className="text-xs">Category Name</Label>
                          <Input
                            id="new-category-name"
                            placeholder="e.g., Coffee, Books, Haircuts"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            className="h-9 text-sm"
                          />
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleCreateCategory}
                          disabled={isCreatingCategory || !newCategoryName.trim() || !newCategoryGroupId}
                          className="w-full h-8 text-xs"
                        >
                          {isCreatingCategory ? 'Creating...' : 'Create & Select'}
                        </Button>
                      </div>
                    )}
                    
                    <select
                      id="expense-category"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                      value={newPlanItemCategoryId}
                      onChange={(e) => setNewPlanItemCategoryId(e.target.value)}
                    >
                      <option value="">Select a category</option>
                      {allExpenseGroups
                        .sort((a, b) => {
                          // Sort income groups first, then expenses
                          if (a.type === 'income' && b.type !== 'income') return -1
                          if (a.type !== 'income' && b.type === 'income') return 1
                          return a.sort_order - b.sort_order
                        })
                        .map((group) => {
                          const groupCategories = allExpenseCategories.filter(
                            cat => cat.expense_group_id === group.id
                          )
                          if (groupCategories.length === 0) return null
                          return (
                            <optgroup key={group.id} label={group.name}>
                              {groupCategories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.name}
                                </option>
                              ))}
                            </optgroup>
                          )
                        })}
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
                    <div className="flex items-center justify-between">
                      <Label htmlFor="expense-category-drawer">Expense Category</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowCreateCategory(!showCreateCategory)}
                        className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        {showCreateCategory ? (
                          <>
                            <ChevronUp className="h-3 w-3 mr-1" />
                            Hide
                          </>
                        ) : (
                          <>
                            <Plus className="h-3 w-3 mr-1" />
                            Create new
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {showCreateCategory && (
                      <div className="rounded-md border border-dashed border-muted-foreground/25 p-3 space-y-3 bg-muted/20">
                        <div className="space-y-2">
                          <Label htmlFor="new-category-group-drawer" className="text-xs">Expense Group</Label>
                          <select
                            id="new-category-group-drawer"
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                            value={newCategoryGroupId}
                            onChange={(e) => setNewCategoryGroupId(e.target.value)}
                          >
                            <option value="">Select a group</option>
                            {allExpenseGroups
                              .filter(g => g.type === 'expense')
                              .map((group) => (
                                <option key={group.id} value={group.id}>
                                  {group.name}
                                </option>
                              ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new-category-name-drawer" className="text-xs">Category Name</Label>
                          <Input
                            id="new-category-name-drawer"
                            placeholder="e.g., Coffee, Books, Haircuts"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            className="h-9 text-sm"
                          />
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleCreateCategory}
                          disabled={isCreatingCategory || !newCategoryName.trim() || !newCategoryGroupId}
                          className="w-full h-8 text-xs"
                        >
                          {isCreatingCategory ? 'Creating...' : 'Create & Select'}
                        </Button>
                      </div>
                    )}
                    
                    <select
                      id="expense-category-drawer"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                      value={newPlanItemCategoryId}
                      onChange={(e) => setNewPlanItemCategoryId(e.target.value)}
                    >
                      <option value="">Select a category</option>
                      {allExpenseGroups
                        .sort((a, b) => {
                          // Sort income groups first, then expenses
                          if (a.type === 'income' && b.type !== 'income') return -1
                          if (a.type !== 'income' && b.type === 'income') return 1
                          return a.sort_order - b.sort_order
                        })
                        .map((group) => {
                          const groupCategories = allExpenseCategories.filter(
                            cat => cat.expense_group_id === group.id
                          )
                          if (groupCategories.length === 0) return null
                          return (
                            <optgroup key={group.id} label={group.name}>
                              {groupCategories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.name}
                                </option>
                              ))}
                            </optgroup>
                          )
                        })}
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

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Income vs Expenses Comparison */}
        {(() => {
          const incomeCategories = categories.filter(cat => cat.type === 'income')
          const expenseCategories = categories.filter(cat => cat.type === 'expense')
          
          const totalIncomePlanned = incomeCategories
            .flatMap(cat => cat.subcategories)
            .reduce((sum, sub) => sum + (sub.plannedAmount || 0), 0)
          
          const totalIncomeActual = incomeCategories
            .flatMap(cat => cat.subcategories)
            .reduce((sum, sub) => sum + sub.actualAmount, 0)
          
          const totalExpensePlanned = expenseCategories
            .flatMap(cat => cat.subcategories)
            .reduce((sum, sub) => sum + (sub.plannedAmount || 0), 0)
          
          const totalExpenseActual = expenseCategories
            .flatMap(cat => cat.subcategories)
            .reduce((sum, sub) => sum + sub.actualAmount, 0)

          const netPlanned = totalIncomePlanned - totalExpensePlanned
          const netActual = totalIncomeActual - totalExpenseActual
          
          // Waterfall chart data - shows flow from income to expenses to net
          const createWaterfallData = (income: number, expenses: number, net: number, label: string) => {
            return [
              {
                name: 'Income',
                value: income,
                fill: '#22c55e',
                start: 0,
                displayValue: income,
                category: label,
              },
              {
                name: 'Expenses',
                value: expenses,
                fill: '#ef4444',
                start: income - expenses,
                displayValue: expenses,
                category: label,
              },
              {
                name: 'Net',
                value: Math.abs(net),
                fill: net >= 0 ? '#3b82f6' : '#f59e0b',
                start: net >= 0 ? 0 : net,
                displayValue: net,
                category: label,
              },
            ]
          }

          const plannedWaterfall = createWaterfallData(totalIncomePlanned, totalExpensePlanned, netPlanned, 'Planned')
          const actualWaterfall = createWaterfallData(totalIncomeActual, totalExpenseActual, netActual, 'Actual')

          return (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Income vs Expenses</CardTitle>
                <CardDescription>
                  Budget flow from income to expenses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Planned Waterfall */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Planned</h4>
                    <ResponsiveContainer width="100%" height={120}>
                      <BarChart data={plannedWaterfall} layout="vertical" margin={{ left: 80, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis type="number" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                        <YAxis type="category" dataKey="name" />
                        <Tooltip
                          formatter={(value: any, name: any, props: any) => [
                            formatCurrency(props.payload.displayValue),
                            props.payload.name
                          ]}
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '1px solid #ccc',
                            borderRadius: '8px',
                            padding: '8px 12px',
                          }}
                        />
                        <Bar dataKey="value" stackId="a" radius={[0, 4, 4, 0]}>
                          {plannedWaterfall.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Actual Waterfall */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Actual</h4>
                    <ResponsiveContainer width="100%" height={120}>
                      <BarChart data={actualWaterfall} layout="vertical" margin={{ left: 80, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis type="number" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                        <YAxis type="category" dataKey="name" />
                        <Tooltip
                          formatter={(value: any, name: any, props: any) => [
                            formatCurrency(props.payload.displayValue),
                            props.payload.name
                          ]}
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '1px solid #ccc',
                            borderRadius: '8px',
                            padding: '8px 12px',
                          }}
                        />
                        <Bar dataKey="value" stackId="a" radius={[0, 4, 4, 0]}>
                          {actualWaterfall.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Net Planned</span>
                      <span className="font-semibold" style={{ color: netPlanned >= 0 ? '#22c55e' : '#ef4444' }}>
                        {formatCurrency(netPlanned)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Net Actual</span>
                      <span className="font-semibold" style={{ color: netActual >= 0 ? '#22c55e' : '#ef4444' }}>
                        {formatCurrency(netActual)}
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Difference</span>
                      <span className="font-bold" style={{ color: (netActual - netPlanned) >= 0 ? '#22c55e' : '#ef4444' }}>
                        {formatCurrency(netActual - netPlanned)}
                      </span>
                    </div>
                  </div>
                </div>
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

      {/* Planning Groups */}
      {viewMode === 'table' && isLargeScreen ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Category</TableHead>
                  <TableHead className="w-[120px]">Due Date</TableHead>
                  <TableHead className="text-right w-[120px]">Planned</TableHead>
                  <TableHead className="text-right w-[120px]">Spent</TableHead>
                  <TableHead className="text-right w-[120px]">Remaining</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[150px]">Progress</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories
                  .filter(group => group.subcategories.length > 0)
                  .sort((a, b) => {
                    if (a.type === 'income' && b.type !== 'income') return -1
                    if (a.type !== 'income' && b.type === 'income') return 1
                    return 0
                  })
                  .map((group) => {
                    const groupPlanned = group.subcategories.reduce((sum, sub) => sum + (sub.plannedAmount || 0), 0)
                    const groupSpent = group.subcategories.reduce((sum, sub) => sum + sub.actualAmount, 0)
                    const groupRemaining = groupPlanned - groupSpent
                    const isCollapsed = collapsedGroups.has(group.id)

                    return (
                      <React.Fragment key={group.id}>
                        {/* Group Header Row */}
                        <TableRow 
                          className="bg-muted/50 hover:bg-muted/70 cursor-pointer"
                          onClick={() => toggleGroupCollapse(group.id)}
                        >
                          <TableCell colSpan={7} className="font-semibold">
                            <div className="flex items-center justify-between py-1">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 hover:bg-transparent"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleGroupCollapse(group.id)
                                  }}
                                >
                                  {isCollapsed ? (
                                    <ChevronRight className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </Button>
                                <div
                                  className="h-3 w-3 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: group.color }}
                                />
                                <span>{group.name}</span>
                                {group.type === 'income' && (
                                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                    Income
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-6 text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">Planned:</span>
                                  <span>{formatCurrency(groupPlanned)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">Spent:</span>
                                  <span style={{ color: group.color }}>{formatCurrency(groupSpent)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">Remaining:</span>
                                  <span style={{ color: groupRemaining >= 0 ? '#22c55e' : '#ef4444' }}>
                                    {formatCurrency(groupRemaining)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                        
                        {/* Group Items */}
                        {!isCollapsed && group.subcategories
                          .sort((a, b) => {
                            const endOfMonth = new Date(currentYear, currentMonth, 0).getTime()
                            const dateA = a.dueDate ? parseLocalDate(a.dueDate).getTime() : endOfMonth
                            const dateB = b.dueDate ? parseLocalDate(b.dueDate).getTime() : endOfMonth
                            if (dateA !== dateB) return dateA - dateB
                            return a.name.localeCompare(b.name)
                          })
                          .map((item) => {
                            const completionPercentage = item.plannedAmount > 0 
                              ? (item.actualAmount / item.plannedAmount) * 100 
                              : (item.actualAmount > 0 ? 100 : 0)
                            const isOverBudget = item.actualAmount > (item.plannedAmount || 0)
                            const isComplete = item.isCompleted || completionPercentage >= 100
                            const remaining = (item.plannedAmount || 0) - item.actualAmount

                            return (
                              <TableRow 
                                key={item.id}
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => handleEditItem(group.id, item)}
                              >
                                <TableCell className="font-medium pl-8">{item.name}</TableCell>
                                <TableCell>
                                  {item.dueDate ? (
                                    <span className="text-sm">
                                      {parseLocalDate(item.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                  ) : (
                                    <span className="text-sm text-muted-foreground">—</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right font-semibold">
                                  {formatCurrency(item.plannedAmount || 0)}
                                </TableCell>
                                <TableCell className="text-right font-semibold" style={{
                                  color: isOverBudget ? '#ef4444' : isComplete ? '#22c55e' : undefined
                                }}>
                                  {formatCurrency(item.actualAmount)}
                                </TableCell>
                                <TableCell className="text-right font-semibold" style={{
                                  color: remaining >= 0 ? '#22c55e' : '#ef4444'
                                }}>
                                  {formatCurrency(remaining)}
                                </TableCell>
                                <TableCell>
                                  {isComplete ? (
                                    <Badge 
                                      className="bg-green-600 hover:bg-green-700 cursor-pointer transition-all"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleToggleComplete(group.id, item)
                                      }}
                                    >
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                      Complete
                                    </Badge>
                                  ) : isOverBudget ? (
                                    <Badge variant="destructive">
                                      Over Budget
                                    </Badge>
                                  ) : (
                                    <Badge 
                                      variant="outline"
                                      className="cursor-pointer hover:bg-muted transition-all"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleToggleComplete(group.id, item)
                                      }}
                                    >
                                      In Progress
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    <div className="text-xs font-medium">{completionPercentage.toFixed(0)}%</div>
                                    <Progress 
                                      value={Math.min(completionPercentage, 100)} 
                                      className="h-2"
                                      indicatorStyle={{
                                        backgroundColor: isOverBudget ? '#ef4444' : (isComplete ? '#22c55e' : group.color),
                                      }}
                                    />
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                      </React.Fragment>
                    )
                  })}
                {categories.flatMap(cat => cat.subcategories).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      No plan items found. Add some categories to start budgeting.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {categories
            .filter(group => group.subcategories.length > 0)
            .sort((a, b) => {
              // Sort income groups first, then expenses
              if (a.type === 'income' && b.type !== 'income') return -1
              if (a.type !== 'income' && b.type === 'income') return 1
              return 0
            })
            .map((group) => {
            const groupPlanned = group.subcategories.reduce((sum, sub) => sum + (sub.plannedAmount || 0), 0)
            const groupSpent = group.subcategories.reduce((sum, sub) => sum + sub.actualAmount, 0)
            const groupRemaining = groupPlanned - groupSpent
            const groupPercentage = groupPlanned > 0 ? (groupSpent / groupPlanned) * 100 : (groupSpent > 0 ? 100 : 0)
            const isCollapsed = collapsedGroups.has(group.id)
            
            return (
              <Card key={group.id}>
                <CardHeader className="cursor-pointer" onClick={() => toggleGroupCollapse(group.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-transparent"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleGroupCollapse(group.id)
                        }}
                      >
                        {isCollapsed ? (
                          <ChevronRight className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </Button>
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: group.color }}
                      />
                      <CardTitle className="flex items-center gap-2">
                        {group.name}
                        {group.type === 'income' && (
                          <Badge variant="outline" className="text-xs font-normal bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
                            Income
                          </Badge>
                        )}
                      </CardTitle>
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
                  {!isCollapsed && (
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
                  )}
                </CardHeader>
                {!isCollapsed && (
                  <CardContent>
                  <div className="space-y-3">
                    {group.subcategories
                      .sort((a, b) => {
                        // Get the end of the current month as default date for items without due date
                        const endOfMonth = new Date(currentYear, currentMonth, 0).getTime()
                        
                        // Convert due dates to timestamps, using end of month if null/undefined
                        const dateA = a.dueDate ? parseLocalDate(a.dueDate).getTime() : endOfMonth
                        const dateB = b.dueDate ? parseLocalDate(b.dueDate).getTime() : endOfMonth
                        
                        // Sort by date first
                        if (dateA !== dateB) {
                          return dateA - dateB
                        }
                        
                        // If dates are equal, sort by name alphabetically
                        return a.name.localeCompare(b.name)
                      })
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
                                        Due: {parseLocalDate(item.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
                )}
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
      )}

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
