'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Pencil, Trash2, Loader2, Filter } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type ExpenseGroup = {
  id: string
  user_id: string
  name: string
  description: string | null
  type: 'income' | 'expense'
  color: string
  sort_order: number
  is_system: boolean
}

type ExpenseCategory = {
  id: string
  expense_group_id: string
  user_id: string
  name: string
  description: string | null
  is_custom: boolean
  created_at: string
  group?: ExpenseGroup
}

export default function ExpenseCategoriesPage() {
  const supabase = createClient()
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [groups, setGroups] = useState<ExpenseGroup[]>([])
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [expenseGroupId, setExpenseGroupId] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please sign in to view expense categories')
        return
      }

      // Load expense groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('expense_groups')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true })

      if (groupsError) throw groupsError
      setGroups(groupsData || [])

      // Load expense categories with their groups
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('expense_categories')
        .select(`
          *,
          group:expense_groups(*)
        `)
        .eq('user_id', user.id)
        .order('name', { ascending: true })

      if (categoriesError) throw categoriesError
      setCategories(categoriesData || [])
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load expense categories')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredCategories = selectedGroupFilter === 'all' 
    ? categories 
    : categories.filter(cat => cat.expense_group_id === selectedGroupFilter)

  const resetForm = () => {
    setName('')
    setDescription('')
    setExpenseGroupId('')
  }

  const handleAddCategory = async () => {
    if (!name.trim()) {
      toast.error('Please enter a category name')
      return
    }

    if (!expenseGroupId) {
      toast.error('Please select an expense group')
      return
    }

    setIsSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please sign in to add expense categories')
        return
      }

      const newCategory = {
        user_id: user.id,
        expense_group_id: expenseGroupId,
        name: name.trim(),
        description: description.trim() || null,
        is_custom: true,
      }

      const { error } = await supabase
        .from('expense_categories')
        .insert([newCategory])

      if (error) throw error

      toast.success('Expense category added successfully')
      setIsAddDialogOpen(false)
      resetForm()
      loadData()
    } catch (error) {
      console.error('Error adding expense category:', error)
      toast.error('Failed to add expense category')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditCategory = (category: ExpenseCategory) => {
    setEditingCategory(category)
    setName(category.name)
    setDescription(category.description || '')
    setExpenseGroupId(category.expense_group_id)
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingCategory || !name.trim()) {
      toast.error('Please enter a category name')
      return
    }

    if (!expenseGroupId) {
      toast.error('Please select an expense group')
      return
    }

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('expense_categories')
        .update({
          name: name.trim(),
          description: description.trim() || null,
          expense_group_id: expenseGroupId,
        })
        .eq('id', editingCategory.id)

      if (error) throw error

      toast.success('Expense category updated successfully')
      setIsEditDialogOpen(false)
      setEditingCategory(null)
      resetForm()
      loadData()
    } catch (error) {
      console.error('Error updating expense category:', error)
      toast.error('Failed to update expense category')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteCategory = async (id: string, isCustom: boolean) => {
    if (!isCustom) {
      toast.error('Default categories cannot be deleted')
      return
    }
    
    if (!confirm('Are you sure you want to delete this expense category? This may affect your transactions and plan data.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('expense_categories')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Expense category deleted successfully')
      loadData()
    } catch (error) {
      console.error('Error deleting expense category:', error)
      toast.error('Failed to delete expense category')
    }
  }

  const handleCancelEdit = () => {
    setIsEditDialogOpen(false)
    setEditingCategory(null)
    resetForm()
  }

  const handleCancelAdd = () => {
    setIsAddDialogOpen(false)
    resetForm()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Expense Categories</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Manage individual expense categories within your expense groups
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Expense Category</DialogTitle>
              <DialogDescription>
                Create a new expense category within an expense group
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="add-group">Expense Group</Label>
                <Select value={expenseGroupId} onValueChange={setExpenseGroupId}>
                  <SelectTrigger id="add-group">
                    <SelectValue placeholder="Select an expense group" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: group.color }}
                          />
                          {group.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-name">Category Name</Label>
                <Input
                  id="add-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Tuition"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-description">Description</Label>
                <Input
                  id="add-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., School tuition payments"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  className="flex-1" 
                  onClick={handleAddCategory}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Category'
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={handleCancelAdd}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Expense Categories</CardTitle>
              <CardDescription>
                {filteredCategories.length} {filteredCategories.length === 1 ? 'category' : 'categories'} 
                {selectedGroupFilter !== 'all' ? ' in selected group' : ' total'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedGroupFilter} onValueChange={setSelectedGroupFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: group.color }}
                        />
                        {group.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Expense Group</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    {selectedGroupFilter === 'all' 
                      ? 'No expense categories yet. Add your first category to get started.' 
                      : 'No categories in this group.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div
                        className="h-6 w-6 rounded-full"
                        style={{ backgroundColor: category.group?.color || '#6b7280' }}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {category.description || '-'}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{category.group?.name || 'Unknown'}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={category.is_custom ? 'secondary' : 'outline'}>
                        {category.is_custom ? 'Custom' : 'Default'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEditCategory(category)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDeleteCategory(category.id, category.is_custom)}
                          disabled={!category.is_custom}
                          title={!category.is_custom ? 'Default category cannot be deleted' : 'Delete category'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        if (!open) handleCancelEdit()
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Expense Category</DialogTitle>
            <DialogDescription>
              Update expense category details
            </DialogDescription>
          </DialogHeader>
          {editingCategory && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-group">Expense Group</Label>
                <Select value={expenseGroupId} onValueChange={setExpenseGroupId}>
                  <SelectTrigger id="edit-group">
                    <SelectValue placeholder="Select an expense group" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: group.color }}
                          />
                          {group.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-name">Category Name</Label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Tuition"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., School tuition payments"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  className="flex-1" 
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
