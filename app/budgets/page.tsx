'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Calendar, Copy, ChevronLeft, ChevronRight, Pencil } from 'lucide-react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { getMonthName, getCurrentMonth, getCurrentYear, formatCurrency } from '@/lib/utils'
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

// Type definitions for sample data
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

// Sample data - will be replaced with real data from Supabase
const initialCategories: Category[] = [
  {
    id: '1',
    name: 'Income',
    type: 'income' as const,
    color: '#22c55e',
    subcategories: [
      { id: '1', name: 'Salary', plannedAmount: 5000, actualAmount: 5000 },
      { id: '2', name: 'Freelance', plannedAmount: 500, actualAmount: 300 },
    ],
  },
  {
    id: '2',
    name: 'Investments',
    type: 'expense' as const,
    color: '#8b5cf6',
    subcategories: [
      { id: '3', name: '401(k)', plannedAmount: 300, actualAmount: 300 },
      { id: '4', name: 'Roth IRA', plannedAmount: 200, actualAmount: 200 },
    ],
  },
  {
    id: '3',
    name: 'Savings',
    type: 'expense' as const,
    color: '#3b82f6',
    subcategories: [
      { id: '5', name: 'Emergency Fund', plannedAmount: 300, actualAmount: 300 },
      { id: '6', name: 'Vacation', plannedAmount: 100, actualAmount: 50 },
    ],
  },
  {
    id: '4',
    name: 'Fixed Costs',
    type: 'expense' as const,
    color: '#ef4444',
    subcategories: [
      { id: '7', name: 'Rent/Mortgage', plannedAmount: 1500, actualAmount: 1500, dueDate: '2026-02-01' },
      { id: '8', name: 'Utilities', plannedAmount: 150, actualAmount: 140 },
      { id: '9', name: 'Internet/Phone', plannedAmount: 100, actualAmount: 100 },
      { id: '10', name: 'Insurance', plannedAmount: 300, actualAmount: 300, dueDate: '2026-02-15' },
      { id: '11', name: 'Groceries', plannedAmount: 600, actualAmount: 450 },
    ],
  },
  {
    id: '5',
    name: 'Guilt-Free Spending',
    type: 'expense' as const,
    color: '#f59e0b',
    subcategories: [
      { id: '12', name: 'Dining Out', plannedAmount: 400, actualAmount: 350 },
      { id: '13', name: 'Entertainment', plannedAmount: 200, actualAmount: 150 },
      { id: '14', name: 'Shopping', plannedAmount: 300, actualAmount: 200 },
      { id: '15', name: 'Hobbies', plannedAmount: 200, actualAmount: 100 },
    ],
  },
  {
    id: '6',
    name: 'Misc',
    type: 'expense' as const,
    color: '#6b7280',
    subcategories: [
      { id: '16', name: 'Untracked', plannedAmount: 0, actualAmount: 0 },
    ],
  },
]

export default function BudgetsPage() {
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth())
  const [currentYear, setCurrentYear] = useState(getCurrentYear())
  
  // Store budget data per month/year
  const [budgetsByMonth, setBudgetsByMonth] = useState<Record<string, Category[]>>({
    [`${getCurrentYear()}-${getCurrentMonth()}`]: initialCategories,
  })
  
  const [editingItem, setEditingItem] = useState<any>(null)
  const [editedAmount, setEditedAmount] = useState('')
  const [editedDueDate, setEditedDueDate] = useState('')
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [newCategoryAmount, setNewCategoryAmount] = useState('')

  // Get current month key and categories
  const monthKey = `${currentYear}-${currentMonth}`
  const categories = budgetsByMonth[monthKey] || initialCategories

  // Function to update categories for current month
  const setCategories = (updater: Category[] | ((prev: Category[]) => Category[])) => {
    setBudgetsByMonth(prev => {
      const currentCategories = prev[monthKey] || initialCategories
      const newCategories = typeof updater === 'function' ? updater(currentCategories) : updater
      return {
        ...prev,
        [monthKey]: newCategories,
      }
    })
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

  // Calculate chart data
  const incomeChartData = categories
    .filter(cat => cat.type === 'income')
    .flatMap(cat => 
      cat.subcategories.map(sub => ({
        name: sub.name,
        value: sub.plannedAmount,
        color: cat.color,
      }))
    )

  const expenseChartData = categories
    .filter(cat => cat.type === 'expense' && cat.name !== 'Misc')
    .map(cat => ({
      name: cat.name,
      value: cat.subcategories.reduce((sum, sub) => sum + sub.plannedAmount, 0),
      color: cat.color,
    }))

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monthly Budget</h1>
          <p className="text-muted-foreground">
            Plan your conscious spending for {getMonthName(currentMonth)} {currentYear}
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
            <CardTitle>Income Allocation</CardTitle>
            <CardDescription>Planned income sources for this month</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
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
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expense Allocation</CardTitle>
            <CardDescription>Planned expenses by category for this month</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
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
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Budget Categories */}
      <div className="space-y-4">
        {categories.map((category) => {
          const totalPlanned = category.subcategories.reduce(
            (sum, sub) => sum + sub.plannedAmount,
            0
          )
          const totalActual = category.subcategories.reduce(
            (sum, sub) => sum + sub.actualAmount,
            0
          )
          const percentage = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0

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
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Planned</div>
                      <div className="font-semibold">{formatCurrency(totalPlanned)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Actual</div>
                      <div className="font-semibold" style={{ color: category.color }}>
                        {formatCurrency(totalActual)}
                      </div>
                    </div>
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
                  </div>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${Math.min(percentage, 100)}%`,
                      backgroundColor: category.color,
                    }}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {category.subcategories.map((sub) => (
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
                        <span className="text-muted-foreground">
                          {formatCurrency(sub.actualAmount)}
                        </span>
                        <span className="text-muted-foreground">/</span>
                        <span className="font-medium">{formatCurrency(sub.plannedAmount)}</span>
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
