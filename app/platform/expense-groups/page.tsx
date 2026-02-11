'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
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
  created_at: string
}

export default function ExpenseGroupsPage() {
  const supabase = createClient()
  const [groups, setGroups] = useState<ExpenseGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<ExpenseGroup | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [color, setColor] = useState('#6366f1')

  useEffect(() => {
    loadGroups()
  }, [])

  const loadGroups = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please sign in to view expense groups')
        return
      }

      const { data, error } = await supabase
        .from('expense_groups')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true })

      if (error) throw error
      setGroups(data || [])
    } catch (error) {
      console.error('Error loading expense groups:', error)
      toast.error('Failed to load expense groups')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setName('')
    setDescription('')
    setType('expense')
    setColor('#6366f1')
  }

  const handleAddGroup = async () => {
    if (!name.trim()) {
      toast.error('Please enter a group name')
      return
    }

    setIsSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please sign in to add expense groups')
        return
      }

      const newGroup = {
        user_id: user.id,
        name: name.trim(),
        description: description.trim() || null,
        type,
        color,
        sort_order: groups.length + 1,
        is_system: false,
      }

      const { error } = await supabase
        .from('expense_groups')
        .insert([newGroup])

      if (error) throw error

      toast.success('Expense group added successfully')
      setIsAddDialogOpen(false)
      resetForm()
      loadGroups()
    } catch (error) {
      console.error('Error adding expense group:', error)
      toast.error('Failed to add expense group')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditGroup = (group: ExpenseGroup) => {
    setEditingGroup(group)
    setName(group.name)
    setDescription(group.description || '')
    setType(group.type)
    setColor(group.color)
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingGroup || !name.trim()) {
      toast.error('Please enter a group name')
      return
    }

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('expense_groups')
        .update({
          name: name.trim(),
          description: description.trim() || null,
          type,
          color,
        })
        .eq('id', editingGroup.id)

      if (error) throw error

      toast.success('Expense group updated successfully')
      setIsEditDialogOpen(false)
      setEditingGroup(null)
      resetForm()
      loadGroups()
    } catch (error) {
      console.error('Error updating expense group:', error)
      toast.error('Failed to update expense group')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteGroup = async (id: string, isSystem: boolean) => {
    if (isSystem) {
      toast.error('System groups cannot be deleted')
      return
    }
    
    if (!confirm('Are you sure you want to delete this expense group? This will also delete all associated expense categories and may affect your plan data.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('expense_groups')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Expense group deleted successfully')
      loadGroups()
    } catch (error) {
      console.error('Error deleting expense group:', error)
      toast.error('Failed to delete expense group')
    }
  }

  const handleCancelEdit = () => {
    setIsEditDialogOpen(false)
    setEditingGroup(null)
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
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Expense Groups</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Manage parent groups for organizing your expense categories
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Add Expense Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Expense Group</DialogTitle>
              <DialogDescription>
                Create a new parent group for organizing your expense categories
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="add-name">Group Name</Label>
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
                <Button 
                  className="flex-1" 
                  onClick={handleAddGroup}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Group'
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
          <CardTitle>Expense Groups</CardTitle>
          <CardDescription>
            {groups.length} {groups.length === 1 ? 'group' : 'groups'} configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
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
              {groups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No expense groups yet. Add your first group to get started.
                  </TableCell>
                </TableRow>
              ) : (
                groups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell>
                      <div
                        className="h-6 w-6 rounded-full"
                        style={{ backgroundColor: group.color }}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{group.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {group.description || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={group.type === 'income' ? 'default' : 'secondary'}>
                        {group.type === 'income' ? 'Income' : 'Expense'}
                      </Badge>
                    </TableCell>
                    <TableCell>{group.sort_order}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEditGroup(group)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDeleteGroup(group.id, group.is_system)}
                          disabled={group.is_system}
                          title={group.is_system ? 'System group cannot be deleted' : 'Delete group'}
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

      {/* Edit Group Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        if (!open) handleCancelEdit()
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Expense Group</DialogTitle>
            <DialogDescription>
              Update expense group details
            </DialogDescription>
          </DialogHeader>
          {editingGroup && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Group Name</Label>
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
