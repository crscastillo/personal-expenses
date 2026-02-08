'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Search, Filter, Download, Pencil, ArrowUpDown, ArrowUp, ArrowDown, Upload, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Calculator } from '@/components/calculator'
import { formatCurrency, formatDate } from '@/lib/utils'
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

// Sample data - will be replaced with real data from Supabase
const initialTransactions = [
  {
    id: '1',
    date: '2026-02-07',
    description: 'Grocery Store',
    amount: -85.43,
    category: 'Fixed Costs',
    subcategory: 'Groceries',
    account: 'Chase Checking',
    isPending: false,
  },
  {
    id: '2',
    date: '2026-02-06',
    description: 'Monthly Salary',
    amount: 5000.00,
    category: 'Income',
    subcategory: 'Salary',
    account: 'Chase Checking',
    isPending: false,
  },
  {
    id: '3',
    date: '2026-02-05',
    description: 'Restaurant',
    amount: -42.50,
    category: 'Guilt-Free Spending',
    subcategory: 'Dining Out',
    account: 'Chase Sapphire',
    isPending: false,
  },
  {
    id: '4',
    date: '2026-02-04',
    description: 'Electric Bill',
    amount: -140.00,
    category: 'Fixed Costs',
    subcategory: 'Utilities',
    account: 'Chase Checking',
    isPending: false,
  },
  {
    id: '5',
    date: '2026-02-03',
    description: 'Netflix Subscription',
    amount: -15.99,
    category: 'Fixed Costs',
    subcategory: 'Subscriptions',
    account: 'Chase Sapphire',
    isPending: true,
  },
  {
    id: '6',
    date: '2026-02-02',
    description: 'Coffee Shop',
    amount: -5.75,
    category: 'Guilt-Free Spending',
    subcategory: 'Dining Out',
    account: 'Cash',
    isPending: false,
  },
  {
    id: '7',
    date: '2026-02-01',
    description: 'Rent Payment',
    amount: -1500.00,
    category: 'Fixed Costs',
    subcategory: 'Rent/Mortgage',
    account: 'Chase Checking',
    isPending: false,
  },
  {
    id: '8',
    date: '2026-02-01',
    description: 'Transfer to Savings',
    amount: -300.00,
    category: 'Savings',
    subcategory: 'Emergency Fund',
    account: 'Chase Checking',
    isPending: false,
  },
  {
    id: '9',
    date: '2026-01-31',
    description: 'Unknown Transaction',
    amount: -25.00,
    category: 'Misc',
    subcategory: 'Untracked',
    account: 'Chase Checking',
    isPending: false,
  },
]

export default function TransactionsPage() {
  const searchParams = useSearchParams()
  const accountFilter = searchParams.get('account')
  
  const [transactions, setTransactions] = useState(initialTransactions)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAccount, setSelectedAccount] = useState(accountFilter || 'all')
  const [sortColumn, setSortColumn] = useState<'date' | 'description' | 'category' | 'account' | 'amount'>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [editingTransaction, setEditingTransaction] = useState<any>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editedDescription, setEditedDescription] = useState('')
  const [editedAmount, setEditedAmount] = useState('')
  const [editedDate, setEditedDate] = useState('')
  const [editedAccount, setEditedAccount] = useState('')
  const [editedCategory, setEditedCategory] = useState('')
  const [editedSubcategory, setEditedSubcategory] = useState('')
  const [editedNotes, setEditedNotes] = useState('')
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [importSummary, setImportSummary] = useState<{
    imported: number
    duplicates: number
    total: number
    transactions: any[]
  } | null>(null)
  const [isProcessingImport, setIsProcessingImport] = useState(false)
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
  const [previewTransactions, setPreviewTransactions] = useState<any[]>([])
  const [dateFormat, setDateFormat] = useState<'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD'>('MM/DD/YYYY')

  // Update selected account when URL changes
  useEffect(() => {
    if (accountFilter) {
      setSelectedAccount(accountFilter)
    }
  }, [accountFilter])

  const handleSort = (column: typeof sortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (column: typeof sortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-1" />
    }
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />
  }

  const filteredAndSortedTransactions = transactions
    .filter((t) => {
      const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.subcategory.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesAccount = selectedAccount === 'all' || t.account === selectedAccount
      
      return matchesSearch && matchesAccount
    })
    .sort((a, b) => {
      let comparison = 0
      
      switch (sortColumn) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
          break
        case 'description':
          comparison = a.description.localeCompare(b.description)
          break
        case 'category':
          comparison = a.category.localeCompare(b.category)
          break
        case 'account':
          comparison = a.account.localeCompare(b.account)
          break
        case 'amount':
          comparison = a.amount - b.amount
          break
      }
      
      return sortDirection === 'asc' ? comparison : -comparison
    })

  const handleEditTransaction = (transaction: any) => {
    setEditingTransaction(transaction)
    setEditedDescription(transaction.description)
    setEditedAmount(Math.abs(transaction.amount).toString())
    setEditedDate(transaction.date)
    setEditedAccount(transaction.account)
    setEditedCategory(transaction.category)
    setEditedSubcategory(transaction.subcategory)
    setEditedNotes('')
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = () => {
    if (!editingTransaction) return
    
    const amount = parseFloat(editedAmount)
    if (isNaN(amount)) return

    // Update transactions state
    setTransactions(prevTransactions =>
      prevTransactions.map(t => {
        if (t.id === editingTransaction.id) {
          return {
            ...t,
            description: editedDescription,
            amount: editedCategory === 'Income' ? amount : -amount,
            date: editedDate,
            account: editedAccount,
            category: editedCategory,
            subcategory: editedSubcategory,
          }
        }
        return t
      })
    )
    
    // TODO: Update in Supabase
    console.log('Saving transaction:', {
      id: editingTransaction.id,
      description: editedDescription,
      amount: editedCategory === 'Income' ? amount : -amount,
      date: editedDate,
    })
    
    setIsEditDialogOpen(false)
    setEditingTransaction(null)
  }

  const handleCancelEdit = () => {
    setIsEditDialogOpen(false)
    setEditingTransaction(null)
    setEditedDescription('')
    setEditedAmount('')
    setEditedDate('')
    setEditedAccount('')
    setEditedCategory('')
    setEditedSubcategory('')
    setEditedNotes('')
  }

  const parseQIFFile = async (file: File, format: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD' = 'MM/DD/YYYY'): Promise<any[]> => {
    const text = await file.text()
    const transactions: any[] = []
    
    // Parse QIF format (line-based format)
    const lines = text.split('\n')
    let currentTransaction: any = {}
    
    for (const line of lines) {
      const trimmedLine = line.trim()
      
      if (!trimmedLine || trimmedLine.startsWith('!')) {
        // Skip empty lines and header lines
        continue
      }
      
      if (trimmedLine === '^') {
        // End of transaction
        if (currentTransaction.date && currentTransaction.amount && currentTransaction.description) {
          transactions.push(currentTransaction)
        }
        currentTransaction = {}
      } else if (trimmedLine.length > 1) {
        const fieldType = trimmedLine.charAt(0)
        const value = trimmedLine.substring(1)
        
        switch (fieldType) {
          case 'D': // Date
            // Parse date based on selected format
            const dateParts = value.split('/')
            if (dateParts.length === 3) {
              let year = dateParts[2]
              let month = dateParts[0]
              let day = dateParts[1]
              
              // Apply date format
              if (format === 'DD/MM/YYYY') {
                day = dateParts[0]
                month = dateParts[1]
                year = dateParts[2]
              } else if (format === 'YYYY-MM-DD') {
                year = dateParts[0]
                month = dateParts[1]
                day = dateParts[2]
              }
              
              // Handle 2-digit years
              if (year.length === 2) {
                year = parseInt(year) > 50 ? '19' + year : '20' + year
              }
              month = month.padStart(2, '0')
              day = day.padStart(2, '0')
              currentTransaction.date = `${year}-${month}-${day}`
            }
            break
          case 'T': // Amount
            currentTransaction.amount = parseFloat(value.replace(/,/g, ''))
            break
          case 'P': // Payee/Description
            currentTransaction.description = value
            break
          case 'M': // Memo
            if (currentTransaction.description) {
              currentTransaction.description += ' - ' + value
            } else {
              currentTransaction.description = value
            }
            break
          case 'N': // Check number or reference number
            currentTransaction.checkNumber = value
            break
          // Other fields like 'L' (category), 'C' (cleared status) can be added if needed
        }
      }
    }
    
    // Handle last transaction if file doesn't end with ^
    if (currentTransaction.date && currentTransaction.amount && currentTransaction.description) {
      transactions.push(currentTransaction)
    }
    
    return transactions
  }

  const isDuplicate = (newTrans: any, existingTrans: any): boolean => {
    // Check if transactions match on date, amount, and description
    return (
      newTrans.date === existingTrans.date &&
      Math.abs(newTrans.amount - existingTrans.amount) < 0.01 &&
      newTrans.description.toLowerCase().includes(existingTrans.description.toLowerCase().substring(0, 10))
    )
  }

  const handleImportQIF = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsProcessingImport(true)

    try {
      // Parse with default date format for preview
      const parsedTransactions = await parseQIFFile(file, dateFormat)
      
      // Show preview dialog
      setPreviewTransactions(parsedTransactions)
      setIsPreviewDialogOpen(true)

    } catch (error) {
      console.error('Error loading QIF file:', error)
      alert('Error loading QIF file. Please make sure it is a valid QIF file.')
    } finally {
      setIsProcessingImport(false)
      // Reset file input
      event.target.value = ''
    }
  }

  const handleConfirmImport = () => {
    try {
      let importedCount = 0
      let duplicateCount = 0
      const newTransactions: any[] = []

      for (const trans of previewTransactions) {
        // Check if duplicate
        const isDupe = transactions.some(existing => isDuplicate(trans, existing))
        
        if (isDupe) {
          duplicateCount++
        } else {
          const newTrans = {
            id: `imported-${Date.now()}-${importedCount}`,
            date: trans.date,
            description: trans.description,
            amount: trans.amount,
            category: 'Misc',
            subcategory: 'Untracked',
            account: selectedAccount !== 'all' ? selectedAccount : 'Imported Account',
            isPending: false,
          }
          newTransactions.push(newTrans)
          importedCount++
        }
      }

      // Add new transactions to state
      setTransactions(prev => [...newTransactions, ...prev])

      // Show summary
      setImportSummary({
        imported: importedCount,
        duplicates: duplicateCount,
        total: previewTransactions.length,
        transactions: newTransactions,
      })

      // TODO: Save to Supabase
      console.log('Imported transactions:', newTransactions)

      // Close preview dialog
      setIsPreviewDialogOpen(false)
      setPreviewTransactions([])

    } catch (error) {
      console.error('Error importing transactions:', error)
      alert('Error importing transactions.')
    }
  }

  const handleCancelImport = () => {
    setIsPreviewDialogOpen(false)
    setPreviewTransactions([])
  }

  // Re-parse when date format changes
  const handleDateFormatChange = async (newFormat: typeof dateFormat) => {
    setDateFormat(newFormat)
    if (previewTransactions.length > 0) {
      // Re-parse with new format - need to store the file somehow
      // For now, just update the format for next import
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">
            {selectedAccount !== 'all' 
              ? `Viewing transactions for ${selectedAccount}` 
              : 'View and manage all your transactions'}
          </p>
        </div>
        <div className="flex gap-2">
          {selectedAccount !== 'all' && (
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedAccount('all')
                window.history.pushState({}, '', '/transactions')
              }}
            >
              Clear Filter
            </Button>
          )}
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <div>
            <Input
              id="qif-upload"
              type="file"
              accept=".qif"
              className="hidden"
              onChange={handleImportQIF}
              disabled={isProcessingImport}
            />
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => document.getElementById('qif-upload')?.click()}
              disabled={isProcessingImport}
            >
              <Upload className="h-4 w-4" />
              {isProcessingImport ? 'Processing...' : 'Import QIF'}
            </Button>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Transaction</DialogTitle>
                <DialogDescription>
                  Manually add a transaction to any account
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" placeholder="e.g., Coffee at Starbucks" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use negative for expenses, positive for income
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account">Account</Label>
                  <select
                    id="account"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option>Chase Checking</option>
                    <option>Ally Savings</option>
                    <option>Chase Sapphire Reserve</option>
                    <option>Cash</option>
                  </select>
                </div>
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
                  <Label htmlFor="subcategory">Subcategory</Label>
                  <select
                    id="subcategory"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option>Groceries</option>
                    <option>Dining Out</option>
                    <option>Utilities</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input id="notes" placeholder="Additional details" />
                </div>
                <Button className="w-full">Add Transaction</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            {filteredAndSortedTransactions.length} transactions found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer select-none hover:bg-muted/50"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center">
                    Date
                    {getSortIcon('date')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer select-none hover:bg-muted/50"
                  onClick={() => handleSort('description')}
                >
                  <div className="flex items-center">
                    Description
                    {getSortIcon('description')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer select-none hover:bg-muted/50"
                  onClick={() => handleSort('category')}
                >
                  <div className="flex items-center">
                    Category
                    {getSortIcon('category')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer select-none hover:bg-muted/50"
                  onClick={() => handleSort('account')}
                >
                  <div className="flex items-center">
                    Account
                    {getSortIcon('account')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer select-none hover:bg-muted/50 text-right"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center justify-end">
                    Amount
                    {getSortIcon('amount')}
                  </div>
                </TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {formatDate(transaction.date)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {transaction.description}
                      {transaction.isPending && (
                        <Badge variant="outline" className="text-xs">
                          Pending
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{transaction.category}</span>
                      <span className="text-xs text-muted-foreground">
                        {transaction.subcategory}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{transaction.account}</TableCell>
                  <TableCell
                    className="text-right font-medium"
                    style={{
                      color: transaction.amount > 0 ? '#22c55e' : '#ef4444',
                    }}
                  >
                    {formatCurrency(Math.abs(transaction.amount))}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEditTransaction(transaction)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Transaction Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        if (!open) handleCancelEdit()
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
            <DialogDescription>
              Update transaction details
            </DialogDescription>
          </DialogHeader>
          {editingTransaction && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  placeholder="e.g., Coffee at Starbucks"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-amount">Amount</Label>
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
                <Label htmlFor="edit-account">Account</Label>
                <select
                  id="edit-account"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                  value={editedAccount}
                  onChange={(e) => setEditedAccount(e.target.value)}
                >
                  <option>Chase Checking</option>
                  <option>Ally Savings</option>
                  <option>Chase Sapphire Reserve</option>
                  <option>Cash</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <select
                  id="edit-category"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                  value={editedCategory}
                  onChange={(e) => setEditedCategory(e.target.value)}
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
                <Label htmlFor="edit-subcategory">Subcategory</Label>
                <select
                  id="edit-subcategory"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                  value={editedSubcategory}
                  onChange={(e) => setEditedSubcategory(e.target.value)}
                >
                  <option>Groceries</option>
                  <option>Dining Out</option>
                  <option>Utilities</option>
                  <option>Salary</option>
                  <option>Freelance</option>
                  <option>Untracked</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-date">Date</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={editedDate}
                  onChange={(e) => setEditedDate(e.target.value)}
                />
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

      {/* Import Summary Dialog */}
      <Dialog open={!!importSummary} onOpenChange={(open) => !open && setImportSummary(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Summary</DialogTitle>
            <DialogDescription>
              QIF file import completed
            </DialogDescription>
          </DialogHeader>
          {importSummary && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Transactions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{importSummary.total}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Imported
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {importSummary.imported}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                        Duplicates
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {importSummary.duplicates}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {importSummary.imported > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Imported Transactions</h4>
                  <div className="max-h-[300px] overflow-y-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {importSummary.transactions.slice(0, 50).map((trans) => (
                          <TableRow key={trans.id}>
                            <TableCell>{formatDate(trans.date)}</TableCell>
                            <TableCell className="max-w-[300px] truncate">
                              {trans.description}
                            </TableCell>
                            <TableCell
                              className="text-right font-medium"
                              style={{
                                color: trans.amount > 0 ? '#22c55e' : '#ef4444',
                              }}
                            >
                              {formatCurrency(Math.abs(trans.amount))}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {importSummary.transactions.length > 50 && (
                    <p className="text-xs text-muted-foreground text-center">
                      Showing first 50 of {importSummary.transactions.length} transactions
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={() => setImportSummary(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
