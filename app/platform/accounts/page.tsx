'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Wallet, CreditCard, DollarSign, TrendingUp, Pencil } from 'lucide-react'
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
  currency: string
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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isLargeScreen, setIsLargeScreen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  
  // Exchange rates for USD conversion
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({})
  
  // Form state
  const [newAccountName, setNewAccountName] = useState('')
  const [newAccountType, setNewAccountType] = useState<AccountType>('checking')
  const [newInstitution, setNewInstitution] = useState('')
  const [newAccountNumber, setNewAccountNumber] = useState('')
  const [newBalance, setNewBalance] = useState('')
  const [newCurrency, setNewCurrency] = useState('USD')
  const [newColor, setNewColor] = useState('#3b82f6')

  // Edit form state
  const [editAccountName, setEditAccountName] = useState('')
  const [editAccountType, setEditAccountType] = useState<AccountType>('checking')
  const [editInstitution, setEditInstitution] = useState('')
  const [editAccountNumber, setEditAccountNumber] = useState('')
  const [editBalance, setEditBalance] = useState('')
  const [editCurrency, setEditCurrency] = useState('USD')
  const [editColor, setEditColor] = useState('#3b82f6')

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

  // Load exchange rates when accounts change
  useEffect(() => {
    loadExchangeRates()
  }, [accountsList])

  const loadExchangeRates = async () => {
    try {
      // Get unique currencies from accounts
      const currencies = Array.from(new Set(accountsList.map(a => a.currency).filter(c => c && c !== 'USD')))
      
      if (currencies.length === 0) {
        setExchangeRates({})
        return
      }

      const rates: Record<string, number> = { 'USD': 1 }
      
      // Fetch exchange rate for each currency
      for (const currency of currencies) {
        try {
          const response = await fetch(`/api/exchange-rates?from=${currency}&to=USD`)
          if (response.ok) {
            const data = await response.json()
            rates[currency] = data.rate
          } else {
            rates[currency] = 1 // Fallback
          }
        } catch (error) {
          console.error(`Error fetching rate for ${currency}:`, error)
          rates[currency] = 1 // Fallback
        }
      }
      
      setExchangeRates(rates)
    } catch (error) {
      console.error('Error loading exchange rates:', error)
    }
  }

  const convertToUSD = (amount: number, currency: string): number => {
    if (currency === 'USD' || !currency) return amount
    const rate = exchangeRates[currency] || 1
    return amount * rate
  }


  // USD converted totals
  const totalAssetsUSD = accountsList
    .filter((a) => a.type !== 'credit_card' && a.balance > 0)
    .reduce((sum, a) => sum + convertToUSD(a.balance, a.currency), 0)

  const totalLiabilitiesUSD = accountsList
    .filter((a) => a.type === 'credit_card')
    .reduce((sum, a) => sum + convertToUSD(Math.abs(a.balance), a.currency), 0)

  const netWorthUSD = totalAssetsUSD - totalLiabilitiesUSD

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
          currency: newCurrency,
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
      setNewCurrency('USD')
      setNewColor('#3b82f6')
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error('Error adding account:', error)
      alert('Error adding account. Please try again.')
    }
  }

  const openEditDialog = (account: Account) => {
    setEditingAccount(account)
    setEditAccountName(account.name)
    setEditAccountType(account.type)
    setEditInstitution(account.institution || '')
    setEditAccountNumber(account.account_number || '')
    setEditBalance(account.balance.toString())
    setEditCurrency(account.currency || 'USD')
    setEditColor(account.color)
    setIsEditDialogOpen(true)
  }

  const handleEditAccount = async () => {
    if (!editingAccount) return

    if (!editAccountName.trim()) {
      alert('Account name is required')
      return
    }

    const balance = parseFloat(editBalance) || 0

    try {
      const response = await fetch('/api/accounts', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingAccount.id,
          name: editAccountName,
          type: editAccountType,
          institution: editInstitution || null,
          account_number: editAccountNumber || null,
          balance,
          currency: editCurrency,
          color: editColor,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to update account: ${response.statusText}`)
      }

      // Reload accounts from API
      await loadAccounts()

      // Reset form and close dialog
      setEditingAccount(null)
      setEditAccountName('')
      setEditAccountType('checking')
      setEditInstitution('')
      setEditAccountNumber('')
      setEditBalance('')
      setEditCurrency('USD')
      setEditColor('#3b82f6')
      setIsEditDialogOpen(false)
    } catch (error) {
      console.error('Error updating account:', error)
      alert('Error updating account. Please try again.')
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
                  <Label htmlFor="currency">Currency</Label>
                  <select
                    id="currency"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                    value={newCurrency}
                    onChange={(e) => setNewCurrency(e.target.value)}
                  >
                    <option value="USD">USD - US Dollar ($)</option>
                    <option value="CRC">CRC - Costa Rican Colón (₡)</option>
                  </select>
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
                  <Label htmlFor="currency-drawer">Currency</Label>
                  <select
                    id="currency-drawer"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                    value={newCurrency}
                    onChange={(e) => setNewCurrency(e.target.value)}
                  >
                    <option value="USD">USD - US Dollar ($)</option>
                    <option value="CRC">CRC - Costa Rican Colón (₡)</option>
                  </select>
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
              {formatCurrency(totalAssetsUSD, 'USD')}
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
              {formatCurrency(totalLiabilitiesUSD, 'USD')}
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
              {formatCurrency(netWorthUSD, 'USD')}
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
          const isDebt = account.type === 'credit_card'

          return (
            <Card
              key={account.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => {
                // Navigate to transactions filtered by this account
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
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {accountTypeLabels[account.type]}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation()
                        openEditDialog(account)
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-muted-foreground">Current Balance</span>
                    <div className="text-right">
                      {account.currency !== 'USD' && (
                        <div className="text-xs text-muted-foreground mb-0.5">
                          {formatCurrency(Math.abs(account.balance), account.currency)}
                        </div>
                      )}
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
                        {formatCurrency(convertToUSD(Math.abs(account.balance), account.currency), 'USD')}
                      </span>
                    </div>
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

      {/* Edit Account Dialog */}
      {isLargeScreen ? (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Account</DialogTitle>
              <DialogDescription>
                Update account details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-accountName">Account Name</Label>
                <Input 
                  id="edit-accountName" 
                  placeholder="e.g., Chase Checking" 
                  value={editAccountName}
                  onChange={(e) => setEditAccountName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-accountType">Account Type</Label>
                <select
                  id="edit-accountType"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                  value={editAccountType}
                  onChange={(e) => setEditAccountType(e.target.value as any)}
                >
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="cash">Cash</option>
                  <option value="investment">Investment</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-institution">Institution (Optional)</Label>
                <Input 
                  id="edit-institution" 
                  placeholder="e.g., Chase Bank" 
                  value={editInstitution}
                  onChange={(e) => setEditInstitution(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-accountNumber">Account Number (Optional)</Label>
                <Input 
                  id="edit-accountNumber" 
                  placeholder="e.g., ****1234" 
                  value={editAccountNumber}
                  onChange={(e) => setEditAccountNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-balance">Current Balance</Label>
                <Input 
                  id="edit-balance" 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00" 
                  value={editBalance}
                  onChange={(e) => setEditBalance(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-currency">Currency</Label>
                <select
                  id="edit-currency"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                  value={editCurrency}
                  onChange={(e) => setEditCurrency(e.target.value)}
                >
                  <option value="USD">USD - US Dollar ($)</option>
                  <option value="CRC">CRC - Costa Rican Colón (₡)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-color">Color</Label>
                <Input 
                  id="edit-color" 
                  type="color" 
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                />
              </div>
              <Button className="w-full" onClick={handleEditAccount}>Save Changes</Button>
            </div>
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Edit Account</DrawerTitle>
              <DrawerDescription>
                Update account details
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-4 space-y-4 overflow-y-auto">
              <div className="space-y-2">
                <Label htmlFor="edit-accountName-drawer">Account Name</Label>
                <Input 
                  id="edit-accountName-drawer" 
                  placeholder="e.g., Chase Checking" 
                  value={editAccountName}
                  onChange={(e) => setEditAccountName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-accountType-drawer">Account Type</Label>
                <select
                  id="edit-accountType-drawer"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                  value={editAccountType}
                  onChange={(e) => setEditAccountType(e.target.value as any)}
                >
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="cash">Cash</option>
                  <option value="investment">Investment</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-institution-drawer">Institution (Optional)</Label>
                <Input 
                  id="edit-institution-drawer" 
                  placeholder="e.g., Chase Bank" 
                  value={editInstitution}
                  onChange={(e) => setEditInstitution(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-accountNumber-drawer">Account Number (Optional)</Label>
                <Input 
                  id="edit-accountNumber-drawer" 
                  placeholder="e.g., ****1234" 
                  value={editAccountNumber}
                  onChange={(e) => setEditAccountNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-balance-drawer">Current Balance</Label>
                <Input 
                  id="edit-balance-drawer" 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00" 
                  value={editBalance}
                  onChange={(e) => setEditBalance(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-currency-drawer">Currency</Label>
                <select
                  id="edit-currency-drawer"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                  value={editCurrency}
                  onChange={(e) => setEditCurrency(e.target.value)}
                >
                  <option value="USD">USD - US Dollar ($)</option>
                  <option value="CRC">CRC - Costa Rican Colón (₡)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-color-drawer">Color</Label>
                <Input 
                  id="edit-color-drawer" 
                  type="color" 
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                />
              </div>
            </div>
            <DrawerFooter>
              <Button className="w-full" onClick={handleEditAccount}>Save Changes</Button>
              <DrawerClose asChild>
                <Button variant="outline" className="w-full">Cancel</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  )
}
