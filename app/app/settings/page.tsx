'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Trash2, AlertTriangle } from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [userEmail, setUserEmail] = useState('')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [confirmEmail, setConfirmEmail] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const loadUserEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        setUserEmail(user.email)
      }
    }
    loadUserEmail()
  }, [supabase])

  const handleDeleteAccount = async () => {
    if (confirmEmail !== userEmail) {
      toast.error('Email does not match. Please enter your email correctly.')
      return
    }

    setIsDeleting(true)

    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error('No user found')
        setIsDeleting(false)
        return
      }

      // Delete all user data in order (to handle foreign key constraints)
      // 1. Delete reminders
      await supabase.from('reminders').delete().eq('user_id', user.id)
      
      // 2. Delete transactions
      await supabase.from('transactions').delete().eq('user_id', user.id)
      
      // 3. Delete plan items (via monthly plans cascade)
      await supabase.from('monthly_plans').delete().eq('user_id', user.id)
      
      // 4. Delete accounts
      await supabase.from('accounts').delete().eq('user_id', user.id)
      
      // 5. Delete subcategories
      await supabase.from('expense_categories').delete().eq('user_id', user.id)

      toast.success('All your data has been deleted successfully')
      
      // Sign out and redirect to home
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Error deleting account data:', error)
      toast.error('Failed to delete account. Please try again or contact support.')
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Settings</h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Manage your app preferences and configuration
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Supabase Configuration</CardTitle>
          <CardDescription>
            Configure your Supabase connection for data storage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="supabaseUrl">Supabase URL</Label>
            <Input
              id="supabaseUrl"
              placeholder="https://your-project.supabase.co"
            />
            <p className="text-xs text-muted-foreground">
              Find this in your Supabase project settings
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="supabaseKey">Supabase Anon Key</Label>
            <Input
              id="supabaseKey"
              type="password"
              placeholder="your-anon-key"
            />
            <p className="text-xs text-muted-foreground">
              Your public anon key (safe to use in browser)
            </p>
          </div>
          <Button>Save Configuration</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Currency Settings</CardTitle>
          <CardDescription>
            Set your preferred currency and locale
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <select
              id="currency"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="CAD">CAD - Canadian Dollar</option>
              <option value="AUD">AUD - Australian Dollar</option>
            </select>
          </div>
          <Button>Save Preferences</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>
            Configure reminders for due dates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Due Date Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when bills are due
              </p>
            </div>
            <Button variant="outline">Enable</Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>Plan Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Alert when approaching plan limits
              </p>
            </div>
            <Button variant="outline">Enable</Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>Monthly Summary</Label>
              <p className="text-sm text-muted-foreground">
                Receive end-of-month spending report
              </p>
            </div>
            <Button variant="outline">Enable</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>
            Manage your data and exports
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Export Data</Label>
              <p className="text-sm text-muted-foreground">
                Download all your data as CSV
              </p>
            </div>
            <Button variant="outline">Export</Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>Database Setup</Label>
              <p className="text-sm text-muted-foreground">
                Run the database schema on your Supabase instance
              </p>
            </div>
            <Button variant="outline">View Schema</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions that will permanently affect your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-destructive">Delete Account</Label>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Button 
              variant="destructive" 
              onClick={() => setIsDeleteDialogOpen(true)}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="confirm-email">
                To confirm, please enter your email address: <span className="font-semibold">{userEmail}</span>
              </Label>
              <Input
                id="confirm-email"
                type="email"
                placeholder="Enter your email"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                disabled={isDeleting}
              />
            </div>
            <div className="rounded-md bg-destructive/10 p-3 text-sm">
              <p className="font-semibold text-destructive mb-1">All of the following will be permanently deleted:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>All accounts and balances</li>
                <li>All transactions and history</li>
                <li>All plans and categories</li>
                <li>All settings and preferences</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setConfirmEmail('')
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={confirmEmail !== userEmail || isDeleting}
              className="gap-2"
            >
              {isDeleting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete My Account
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
