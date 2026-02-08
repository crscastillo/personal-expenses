'use client'

import { useState } from 'react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

// Sample data - will be replaced with real data from Supabase
const accounts = [
  {
    id: '1',
    name: 'Chase Checking',
    type: 'checking' as const,
    institution: 'Chase Bank',
    accountNumber: '****1234',
    balance: 5420.50,
    color: '#3b82f6',
    isActive: true,
  },
  {
    id: '2',
    name: 'Ally Savings',
    type: 'savings' as const,
    institution: 'Ally Bank',
    accountNumber: '****5678',
    balance: 15000.00,
    color: '#22c55e',
    isActive: true,
  },
  {
    id: '3',
    name: 'Chase Sapphire Reserve',
    type: 'credit_card' as const,
    institution: 'Chase',
    accountNumber: '****9012',
    balance: -1250.75,
    color: '#8b5cf6',
    isActive: true,
  },
  {
    id: '4',
    name: 'Cash',
    type: 'cash' as const,
    institution: null,
    accountNumber: null,
    balance: 200.00,
    color: '#f59e0b',
    isActive: true,
  },
  {
    id: '5',
    name: 'Vanguard Brokerage',
    type: 'investment' as const,
    institution: 'Vanguard',
    accountNumber: '****3456',
    balance: 45000.00,
    color: '#ec4899',
    isActive: true,
  },
]

const accountTypeIcons = {
  checking: Wallet,
  savings: DollarSign,
  credit_card: CreditCard,
  cash: DollarSign,
  investment: TrendingUp,
}

const accountTypeLabels = {
  checking: 'Checking',
  savings: 'Savings',
  credit_card: 'Credit Card',
  cash: 'Cash',
  investment: 'Investment',
}

export default function AccountsPage() {
  const router = useRouter()
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null)
  const [accountsList, setAccountsList] = useState(accounts)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  
  // Form state
  const [newAccountName, setNewAccountName] = useState('')
  const [newAccountType, setNewAccountType] = useState<'checking' | 'savings' | 'credit_card' | 'cash' | 'investment'>('checking')
  const [newInstitution, setNewInstitution] = useState('')
  const [newAccountNumber, setNewAccountNumber] = useState('')
  const [newBalance, setNewBalance] = useState('')
  const [newColor, setNewColor] = useState('#3b82f6')

  const totalAssets = accountsList
    .filter((a) => a.type !== 'credit_card' && a.balance > 0)
    .reduce((sum, a) => sum + a.balance, 0)

  const totalLiabilities = accountsList
    .filter((a) => a.type === 'credit_card')
    .reduce((sum, a) => sum + Math.abs(a.balance), 0)

  const netWorth = totalAssets - totalLiabilities

  const handleAddAccount = () => {
    if (!newAccountName.trim()) {
      alert('Account name is required')
      return
    }

    const balance = parseFloat(newBalance) || 0

    const newAccount = {
      id: `${Date.now()}`,
      name: newAccountName,
      type: newAccountType,
      institution: newInstitution || null,
      accountNumber: newAccountNumber || null,
      balance,
      color: newColor,
      isActive: true,
    }

    setAccountsList([...accountsList, newAccount])

    // TODO: Save to Supabase
    console.log('Adding account:', newAccount)

    // Reset form and close dialog
    setNewAccountName('')
    setNewAccountType('checking')
    setNewInstitution('')
    setNewAccountNumber('')
    setNewBalance('')
    setNewColor('#3b82f6')
    setIsAddDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accounts</h1>
          <p className="text-muted-foreground">
            Manage your bank accounts, credit cards, and cash
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
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
      </div>

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
                router.push(`/transactions?account=${encodeURIComponent(account.name)}`)
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
                          {account.accountNumber && ` • ${account.accountNumber}`}
                        </CardDescription>
                      )}
                      {!account.institution && account.accountNumber && (
                        <CardDescription className="text-xs">
                          {account.accountNumber}
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
    </div>
  )
}
