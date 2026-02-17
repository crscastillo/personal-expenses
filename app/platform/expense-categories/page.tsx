'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Loader2, Trash2 } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLargeScreen, setIsLargeScreen] = useState(false)
  
  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [expenseGroupId, setExpenseGroupId] = useState('')

  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024) // lg breakpoint
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

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

  const handleDeleteCategory = async (id: string, isCustom: boolean, categoryName: string) => {
    if (!isCustom) {
      toast.error('Default categories cannot be deleted')
      return
    }
    
    if (!confirm(`Are you sure you want to delete "${categoryName}"? This may affect your transactions and plan data.`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('expense_categories')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Expense category deleted successfully')
      
      // Update state directly without reloading
      setCategories(prevCategories => prevCategories.filter(cat => cat.id !== id))
      
      // Close edit dialog if this was the category being edited
      if (editingCategory?.id === id) {
        handleCancelEdit()
      }
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

  // Group categories by expense group
  const groupedCategories = groups.map(group => ({
    group,
    categories: categories.filter(cat => cat.expense_group_id === group.id)
  })).filter(item => item.categories.length > 0)

  return isLoading ? (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  ) : (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Expense Categories</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Manage categories within your expense groups
          </p>
        </div>
        
        {/* Add Category Button with Dialog/Drawer */}
        {isLargeScreen ? (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Category</DialogTitle>
                <DialogDescription>
                  Create a new expense category within a group
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
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-description">Description (Optional)</Label>
                  <Input
                    id="add-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g., School tuition payments"
                    className="h-12"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
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
            </DialogContent>
          </Dialog>
        ) : (
          <Drawer open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DrawerTrigger asChild>
              <Button className="gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Add Category
              </Button>
            </DrawerTrigger>
            <DrawerContent className="max-h-[85vh]">
              <div className="flex flex-col h-full">
                <DrawerHeader className="flex-shrink-0">
                  <DrawerTitle>Add New Category</DrawerTitle>
                  <DrawerDescription>
                    Create a new expense category within a group
                  </DrawerDescription>
                </DrawerHeader>
                <div className="px-4 pb-4 space-y-4 overflow-y-auto flex-1 min-h-0">
                  <div className="space-y-2">
                    <Label htmlFor="add-group-drawer">Expense Group</Label>
                    <Select value={expenseGroupId} onValueChange={setExpenseGroupId}>
                      <SelectTrigger id="add-group-drawer">
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
                    <Label htmlFor="add-name-drawer">Category Name</Label>
                    <Input
                      id="add-name-drawer"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Tuition"
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-description-drawer">Description (Optional)</Label>
                    <Input
                      id="add-description-drawer"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g., School tuition payments"
                      className="h-12"
                    />
                  </div>
                </div>
                <DrawerFooter className="flex-shrink-0">
                  <Button 
                    className="w-full h-12" 
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
                  <DrawerClose asChild>
                    <Button variant="outline" className="w-full h-12" disabled={isSaving}>
                      Cancel
                    </Button>
                  </DrawerClose>
                </DrawerFooter>
              </div>
            </DrawerContent>
          </Drawer>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Categories</CardDescription>
            <CardTitle className="text-2xl">{categories.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Custom Categories</CardDescription>
            <CardTitle className="text-2xl">
              {categories.filter(cat => cat.is_custom).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Expense Groups</CardDescription>
            <CardTitle className="text-2xl">{groups.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Grouped Categories */}
      <div className="space-y-4">
        {groupedCategories.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <p>No expense categories yet.</p>
                <p className="text-sm mt-2">Add your first category to get started.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          groupedCategories.map(({ group, categories: groupCategories }) => (
            <Card key={group.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div
                    className="h-4 w-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: group.color }}
                  />
                  <div>
                    <CardTitle>{group.name}</CardTitle>
                    <CardDescription>
                      {groupCategories.length} {groupCategories.length === 1 ? 'category' : 'categories'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {groupCategories.map((category) => (
                    <div
                      key={category.id}
                      onClick={() => handleEditCategory(category)}
                      className="rounded-lg border p-4 transition-all cursor-pointer hover:shadow-md hover:border-primary/50 active:scale-[0.98]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base mb-1">{category.name}</h3>
                          {category.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {category.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Category Dialog/Drawer */}
      {isLargeScreen ? (
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
          if (!open) handleCancelEdit()
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
              <DialogDescription>
                Update details for {editingCategory?.name || 'this category'}
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
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description (Optional)</Label>
                  <Input
                    id="edit-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g., School tuition payments"
                    className="h-12"
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Button 
                    className="w-full h-12" 
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
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      className="h-12" 
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="h-12" 
                      onClick={() => handleDeleteCategory(editingCategory.id, editingCategory.is_custom, editingCategory.name)}
                      disabled={!editingCategory.is_custom || isSaving}
                      title={!editingCategory.is_custom ? 'Default category cannot be deleted' : 'Delete this category'}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
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
          <DrawerContent className="max-h-[85vh]">
            <div className="flex flex-col h-full">
              <DrawerHeader className="flex-shrink-0">
                <DrawerTitle>Edit Category</DrawerTitle>
                <DrawerDescription>
                  Update details for {editingCategory?.name || 'this category'}
                </DrawerDescription>
              </DrawerHeader>
              <div className="px-4 pb-4 space-y-4 overflow-y-auto flex-1 min-h-0">
                {editingCategory && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="edit-group-drawer">Expense Group</Label>
                      <Select value={expenseGroupId} onValueChange={setExpenseGroupId}>
                        <SelectTrigger id="edit-group-drawer">
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
                      <Label htmlFor="edit-name-drawer">Category Name</Label>
                      <Input
                        id="edit-name-drawer"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Tuition"
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-description-drawer">Description (Optional)</Label>
                      <Input
                        id="edit-description-drawer"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g., School tuition payments"
                        className="h-12"
                      />
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <Button 
                        className="w-full h-12" 
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
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          variant="outline" 
                          className="h-12" 
                          onClick={handleCancelEdit}
                          disabled={isSaving}
                        >
                          Cancel
                        </Button>
                        <Button 
                          variant="destructive" 
                          className="h-12" 
                          onClick={() => handleDeleteCategory(editingCategory.id, editingCategory.is_custom, editingCategory.name)}
                          disabled={!editingCategory.is_custom || isSaving}
                          title={!editingCategory.is_custom ? 'Default category cannot be deleted' : 'Delete this category'}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  )
}
