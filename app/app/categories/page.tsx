'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Pencil, Trash2 } from 'lucide-react'
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

type Category = {
  id: string
  name: string
  description: string
  type: 'income' | 'expense'
  color: string
  sort_order: number
  is_system: boolean
}

const initialCategories: Category[] = [
  {
    id: '1',
    name: 'Income',
    description: 'All sources of income',
    type: 'income',
    color: '#22c55e',
    sort_order: 1,
    is_system: true,
  },
  {
    id: '2',
    name: 'Investments',
    description: 'Long-term wealth building (10%)',
    type: 'expense',
    color: '#8b5cf6',
    sort_order: 2,
    is_system: true,
  },
  {
    id: '3',
    name: 'Savings',
    description: 'Emergency fund and goals (5-10%)',
    type: 'expense',
    color: '#3b82f6',
    sort_order: 3,
    is_system: true,
  },
  {
    id: '4',
    name: 'Fixed Costs',
    description: 'Essential expenses (50-60%)',
    type: 'expense',
    color: '#ef4444',
    sort_order: 4,
    is_system: true,
  },
  {
    id: '5',
    name: 'Guilt-Free Spending',
    description: 'Enjoy life (20-35%)',
    type: 'expense',
    color: '#f59e0b',
    sort_order: 5,
    is_system: true,
  },
  {
    id: '6',
    name: 'Misc',
    description: 'Uncategorized and other expenses',
    type: 'expense',
    color: '#6b7280',
    sort_order: 6,
    is_system: true,
  },
]

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  
  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [color, setColor] = useState('#6366f1')

  const resetForm = () => {
    setName('')
    setDescription('')
    setType('expense')
    setColor('#6366f1')
  }

  const handleAddCategory = () => {
    const newCategory: Category = {
      id: Date.now().toString(),
      name,
      description,
      type,
      color,
      sort_order: categories.length + 1,
      is_system: false,
    }

    setCategories([...categories, newCategory])
    
    // TODO: Save to Supabase
    console.log('Adding category:', newCategory)
    
    setIsAddDialogOpen(false)
    resetForm()
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setName(category.name)
    setDescription(category.description)
    setType(category.type)
    setColor(category.color)
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = () => {
    if (!editingCategory) return

    setCategories(categories.map(cat => 
      cat.id === editingCategory.id
        ? { ...cat, name, description, type, color }
        : cat
    ))
    
    // TODO: Update in Supabase
    console.log('Updating category:', { ...editingCategory, name, description, type, color })
    
    setIsEditDialogOpen(false)
    setEditingCategory(null)
    resetForm()
  }

  const handleDeleteCategory = (id: string, isSystem: boolean) => {
    if (isSystem) {
      alert('System categories cannot be deleted. This category is protected.')
      return
    }
    
    if (confirm('Are you sure you want to delete this category? This will also delete all associated subcategories and may affect your budget data.')) {
      setCategories(categories.filter(cat => cat.id !== id))
      
      // TODO: Delete from Supabase
      console.log('Deleting category:', id)
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">
            Manage parent categories for your budget
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
              <DialogDescription>
                Create a new parent category for organizing your budget
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="add-name">Category Name</Label>
                <Input
                  id="add-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Education"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-description">Description</Label>
                <Input
                  id="add-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Learning and development expenses"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-type">Type</Label>
                <select
                  id="add-type"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                  value={type}
                  onChange={(e) => setType(e.target.value as 'income' | 'expense')}
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-color">Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="add-color"
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="#6366f1"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={handleAddCategory}>
                  Add Category
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleCancelAdd}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Parent Categories</CardTitle>
          <CardDescription>
            {categories.length} categories configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Order</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <div
                      className="h-6 w-6 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {category.description}
                  </TableCell>
                  <TableCell>
                    <Badge variant={category.type === 'income' ? 'default' : 'secondary'}>
                      {category.type === 'income' ? 'Income' : 'Expense'}
                    </Badge>
                  </TableCell>
                  <TableCell>{category.sort_order}</TableCell>
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
                        onClick={() => handleDeleteCategory(category.id, category.is_system)}
                        disabled={category.is_system}
                        title={category.is_system ? 'System category cannot be deleted' : 'Delete category'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        if (!open) handleCancelEdit()
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update category details
            </DialogDescription>
          </DialogHeader>
          {editingCategory && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Category Name</Label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Education"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Learning and development expenses"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-type">Type</Label>
                <select
                  id="edit-type"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                  value={type}
                  onChange={(e) => setType(e.target.value as 'income' | 'expense')}
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-color">Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="edit-color"
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="#6366f1"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={handleSaveEdit}>
                  Save Changes
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleCancelEdit}>
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
