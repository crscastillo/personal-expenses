'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Wallet, CreditCard, DollarSign, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
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

type AccountType = 'checking' | 'savings' | 'credit_card' | 'cash' | 'investment'

interface Account {
  id: string
  name: string
  type: AccountType
  institution: string | null
  account_number: string | null
  balance: number
  color: string
  is_active: boolean
  include_in_plan: boolean
}

const accountTypeIcons: Record<AccountType, any> = {
  checking: Wallet,
  savings: DollarSign,
  credit_card: CreditCard,
  cash: DollarSign,
  investment: TrendingUp,
}

const accountTypeLabels: Record<AccountType, string> = {
  checking: 'Checking',
  savings: 'Savings',
  credit_card: 'Credit Card',
  cash: 'Cash',
  investment: 'Investment',
}

export default function AccountsPage() {
  const router = useRouter()
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null)
  const [accountsList, setAccountsList] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isLargeScreen, setIsLargeScreen] = useState(false)
  
  // Form state
  const [newAccountName, setNewAccountName] = useState('')
  const [newAccountType, setNewAccountType] = useState<AccountType>('checking')
  const [newInstitution, setNewInstitution] = useState('')
  const [newAccountNumber, setNewAccountNumber] = useState('')
  const [newBalance, setNewBalance] = useState('')
  const [newColor, setNewColor] = useState('#3b82f6')

  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024) // lg breakpoint
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Load accounts from API
  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    try {
      setIsLoading(true)
      
      console.log('[Accounts Page] Fetching accounts from API...')
      const response = await fetch('/api/accounts')
      
      console.log('[Accounts Page] API response status:', response.status)
      
      if (!response.ok) {
        if (response.status === 401) {
          console.log('[Accounts Page] Unauthorized - user not authenticated')
          setAccountsList([])
          setIsLoading(false)
          return
        }
        const errorData = await response.json()
        console.error('[Accounts Page] API error:', errorData)
        throw new Error(errorData.details || errorData.error || `Failed to load accounts: ${response.statusText}`)
      }

      const accounts = await response.json()
      console.log('[Accounts Page] Successfully loaded', accounts.length, 'accounts')
      setAccountsList(accounts)
    } catch (error: any) {
      console.error('[Accounts Page] Error loading accounts:', error)
      alert(`Failed to load accounts: ${error.message}`)
      setAccountsList([])
    } finally {
      setIsLoading(false)
    }
  }

  const totalAssets = accountsList
    .filter((a) => a.type !== 'credit_card' && a.balance > 0)
    .reduce((sum, a) => sum + a.balance, 0)

  const totalLiabilities = accountsList
    .filter((a) => a.type === 'credit_card')
    .reduce((sum, a) => sum + Math.abs(a.balance), 0)

  const netWorth = totalAssets - totalLiabilities

  const handleAddAccount = async () => {
    if (!newAccountName.trim()) {
      alert('Account name is required')
      return
    }

    const balance = parseFloat(newBalance) || 0

    try {
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newAccountName,
          type: newAccountType,
          institution: newInstitution || null,
          account_number: newAccountNumber || null,
          balance,
          color: newColor,
          is_active: true,
          include_in_plan: true,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to add account: ${response.statusText}`)
      }

      const accountData = await response.json()
      console.log('Account added successfully:', accountData)

      // If there's an initial balance, create an initial transaction
      if (balance !== 0) {
        // Get "Untracked" expense category for initial balance
        const categoriesResponse = await fetch('/api/expense-categories')
        if (categoriesResponse.ok) {
          const categories = await categoriesResponse.json()
          const untrackedCategory = categories.find((c: any) => c.name === 'Untracked')

          if (untrackedCategory) {
            await fetch('/api/transactions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                account_id: accountData.id,
                expense_category_id: untrackedCategory.id,
                amount: balance,
                description: 'Initial Balance',
                date: new Date().toISOString().split('T')[0],
                notes: 'Opening balance for account',
              }),
            })
          }
        }
      }

      // Reload accounts from API
      await loadAccounts()

      // Reset form and close dialog
      setNewAccountName('')
      setNewAccountType('checking')
      setNewInstitution('')
      setNewAccountNumber('')
      setNewBalance('')
      setNewColor('#3b82f6')
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error('Error adding account:', error)
      alert('Error adding account. Please try again.')
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Accounts</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Manage your bank accounts, credit cards, and cash
          </p>
        </div>
        
        {/* Large Screen: Dialog */}
        {isLargeScreen ? (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Account</DialogTitle>
                <DialogDescription>
                  Add a bank account, credit card, or cash to track
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="accountName">Account Name</Label>
                  <Input 
                    id="accountName" 
                    placeholder="e.g., Chase Checking" 
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountType">Account Type</Label>
                  <select
                    id="accountType"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                    value={newAccountType}
                    onChange={(e) => setNewAccountType(e.target.value as any)}
                  >
                    <option value="checking">Checking</option>
                    <option value="savings">Savings</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="cash">Cash</option>
                    <option value="investment">Investment</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="institution">Institution (Optional)</Label>
                  <Input 
                    id="institution" 
                    placeholder="e.g., Chase Bank" 
                    value={newInstitution}
                    onChange={(e) => setNewInstitution(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number (Optional)</Label>
                  <Input 
                    id="accountNumber" 
                    placeholder="e.g., ****1234" 
                    value={newAccountNumber}
                    onChange={(e) => setNewAccountNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="balance">Current Balance</Label>
                  <Input 
                    id="balance" 
                    type="number" 
                    step="0.01" 
                    placeholder="0.00" 
                    value={newBalance}
                    onChange={(e) => setNewBalance(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input 
                    id="color" 
                    type="color" 
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                  />
                </div>
                <Button className="w-full" onClick={handleAddAccount}>Add Account</Button>
              </div>
            </DialogContent>
          </Dialog>
        ) : (
          /* Small/Medium Screen: Drawer from bottom */
          <Drawer open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DrawerTrigger asChild>
              <Button className="gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Add Account
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Add New Account</DrawerTitle>
                <DrawerDescription>
                  Add a bank account, credit card, or cash to track
                </DrawerDescription>
              </DrawerHeader>
              <div className="px-4 pb-4 space-y-4 overflow-y-auto flex-1">
                <div className="space-y-2">
                  <Label htmlFor="accountName-drawer">Account Name</Label>
                  <Input 
                    id="accountName-drawer" 
                    placeholder="e.g., Chase Checking" 
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountType-drawer">Account Type</Label>
                  <select
                    id="accountType-drawer"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                    value={newAccountType}
                    onChange={(e) => setNewAccountType(e.target.value as any)}
                  >
                    <option value="checking">Checking</option>
                    <option value="savings">Savings</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="cash">Cash</option>
                    <option value="investment">Investment</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="institution-drawer">Institution (Optional)</Label>
                  <Input 
                    id="institution-drawer" 
                    placeholder="e.g., Chase Bank" 
                    value={newInstitution}
                    onChange={(e) => setNewInstitution(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber-drawer">Account Number (Optional)</Label>
                  <Input 
                    id="accountNumber-drawer" 
                    placeholder="e.g., ****1234" 
                    value={newAccountNumber}
                    onChange={(e) => setNewAccountNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="balance-drawer">Current Balance</Label>
                  <Input 
                    id="balance-drawer" 
                    type="number" 
                    step="0.01" 
                    placeholder="0.00" 
                    value={newBalance}
                    onChange={(e) => setNewBalance(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color-drawer">Color</Label>
                  <Input 
                    id="color-drawer" 
                    type="color" 
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                  />
                </div>
              </div>
              <DrawerFooter>
                <Button className="w-full" onClick={handleAddAccount}>Add Account</Button>
                <DrawerClose asChild>
                  <Button variant="outline" className="w-full">Cancel</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading accounts...</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalAssets)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {accountsList.filter((a) => a.type !== 'credit_card').length} accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Liabilities</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalLiabilities)}
            </div>
            <p className="text-xs text-muted-foreground">
              Credit card balances
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(netWorth)}
            </div>
            <p className="text-xs text-muted-foreground">
              Assets minus liabilities
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Accounts List */}
      <div className="grid gap-4 md:grid-cols-2">
        {accountsList.map((account) => {
          const Icon = accountTypeIcons[account.type]
          const isDebt = account.balance < 0

          return (
            <Card
              key={account.id}
              className="cursor-pointer transition-all hover:shadow-md"
              onClick={() => {
                router.push(`/platform/transactions?account=${encodeURIComponent(account.name)}`)
              }}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${account.color}20` }}
                    >
                      <Icon className="h-5 w-5" style={{ color: account.color }} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{account.name}</CardTitle>
                      {account.institution && (
                        <CardDescription className="text-xs">
                          {account.institution}
                          {account.account_number && ` • ${account.account_number}`}
                        </CardDescription>
                      )}
                      {!account.institution && account.account_number && (
                        <CardDescription className="text-xs">
                          {account.account_number}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline">
                    {accountTypeLabels[account.type]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-muted-foreground">Current Balance</span>
                    <span
                      className="text-2xl font-bold"
                      style={{
                        color: isDebt
                          ? '#ef4444'
                          : account.type === 'investment'
                          ? '#8b5cf6'
                          : '#22c55e',
                      }}
                    >
                      {formatCurrency(Math.abs(account.balance))}
                    </span>
                  </div>
                  {isDebt && (
                    <p className="text-xs text-red-600">Outstanding balance</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
        </>
      )}
    </div>
  )
}
