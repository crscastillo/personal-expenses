'use client'

import { useState } from 'react'
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
import { AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsPage() {
  const router = useRouter()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  
  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      toast.error('Please type DELETE to confirm')
      return
    }

    setIsDeleting(true)
    
    try {
      console.log('[Settings] Initiating account deletion...')
      const response = await fetch('/api/delete-account', {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('[Settings] Delete account error:', data)
        toast.error(data.error || 'Failed to delete account')
        setIsDeleting(false)
        return
      }

      console.log('[Settings] Account deleted successfully')
      toast.success('Account deleted successfully')
      
      // Redirect to home page after a brief delay
      setTimeout(() => {
        router.push('/')
      }, 1000)
    } catch (error: any) {
      console.error('[Settings] Error deleting account:', error)
      toast.error(`Failed to delete account: ${error.message}`)
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

      {/* Danger Zone */}
      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
          </div>
          <CardDescription>
            Irreversible actions that permanently affect your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 p-4">
            <div className="space-y-3">
              <div>
                <Label className="text-red-900 dark:text-red-200 font-semibold">Delete Account</Label>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  Once you delete your account, there is no going back. This will permanently delete:
                </p>
                <ul className="text-sm text-red-700 dark:text-red-300 mt-2 space-y-1 list-disc list-inside">
                  <li>All your accounts and transactions</li>
                  <li>All your monthly plans and plan items</li>
                  <li>All your expense categories and groups</li>
                  <li>All your reminders and settings</li>
                  <li>Your user account and authentication data</li>
                </ul>
              </div>
              <Button 
                variant="destructive" 
                onClick={() => setIsDeleteDialogOpen(true)}
                className="w-full sm:w-auto"
              >
                Delete My Account
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Delete Account - Are You Sure?
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-2">
              <p>
                This action <strong>cannot be undone</strong>. This will permanently delete your account 
                and remove all your data from our servers.
              </p>
              <p>
                All your accounts, transactions, plans, categories, and settings will be lost forever.
              </p>
              <div className="pt-2">
                <Label htmlFor="delete-confirm">
                  Type <span className="font-bold">DELETE</span> to confirm:
                </Label>
                <Input
                  id="delete-confirm"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="DELETE"
                  className="mt-2"
                  disabled={isDeleting}
                />
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setDeleteConfirmation('')
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting || deleteConfirmation !== 'DELETE'}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete My Account'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
    </div>
  )
}
