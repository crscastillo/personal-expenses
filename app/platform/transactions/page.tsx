'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Search, Filter, Download, Pencil, ArrowUpDown, ArrowUp, ArrowDown, Upload, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react'
import { Calculator } from '@/components/calculator'
import { formatCurrency, formatDate } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
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

export default function TransactionsPage() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const accountFilter = searchParams?.get('account') || null
  
  const [transactions, setTransactions] = useState<any[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
  const [subcategories, setSubcategories] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAccount, setSelectedAccount] = useState(accountFilter || 'all')
  const [sortColumn, setSortColumn] = useState<'date' | 'description' | 'category' | 'account' | 'amount'>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  
  // Add transaction form state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newDescription, setNewDescription] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [newAccountId, setNewAccountId] = useState('')
  const [newSubcategoryId, setNewSubcategoryId] = useState('')
  const [newTransferToAccountId, setNewTransferToAccountId] = useState('')
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0])
  const [newNotes, setNewNotes] = useState('')
  const [newReferenceNumber, setNewReferenceNumber] = useState('')
  const [newReference, setNewReference] = useState('')
  
  const [editingTransaction, setEditingTransaction] = useState<any>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editedDescription, setEditedDescription] = useState('')
  const [editedAmount, setEditedAmount] = useState('')
  const [editedDate, setEditedDate] = useState('')
  const [editedAccountId, setEditedAccountId] = useState('')
  const [editedExpenseCategoryId, setEditedExpenseCategoryId] = useState('')
  const [editedNotes, setEditedNotes] = useState('')
  const [editedReferenceNumber, setEditedReferenceNumber] = useState('')
  const [editedReference, setEditedReference] = useState('')
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
  const [qifFileContent, setQifFileContent] = useState<string>('')

  // Load transactions, accounts, and subcategories from Supabase
  useEffect(() => {
    loadTransactions()
    loadAccountsAndSubcategories()
  }, [])

  // Update selected account when URL changes
  useEffect(() => {
    if (accountFilter) {
      setSelectedAccount(accountFilter)
    }
  }, [accountFilter])

  const loadTransactions = async () => {
    try {
      setIsLoading(true)
      
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.error('Auth error:', authError)
        setTransactions([])
        setIsLoading(false)
        return
      }
      
      if (!user) {
        console.log('No authenticated user found')
        setTransactions([])
        setIsLoading(false)
        return
      }

      console.log('Loading transactions for user:', user.id)

      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          account:accounts!transactions_account_id_fkey(name),
          expense_category:expense_categories(
            name,
            expense_group:expense_groups(name)
          ),
          transfer_account:accounts!transactions_transfer_to_account_id_fkey(name)
        `)
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false })

      if (error) {
        console.error('Supabase error - raw:', error)
        console.error('Supabase error - stringified:', JSON.stringify(error, null, 2))
        console.error('Supabase error - keys:', Object.keys(error))
        throw error
      }

      console.log('Loaded transactions:', data?.length || 0)

      // Transform data to match the component's expected format
      const transformedTransactions = (data || []).map((t: any) => ({
        id: t.id,
        date: t.transaction_date,
        description: t.description,
        amount: parseFloat(t.amount),
        category: t.transfer_account ? 'Transfer' : (t.expense_category?.expense_group?.name || 'Misc'),
        subcategory: t.transfer_account ? t.transfer_account.name : (t.expense_category?.name || 'Untracked'),
        account: t.account?.name || 'Unknown',
        isPending: t.is_pending || false,
        notes: t.notes,
        referenceNumber: t.reference_number,
        reference: t.reference,
        isTransfer: !!t.transfer_account,
      }))

      setTransactions(transformedTransactions)
    } catch (error: any) {
      console.error('Catch block error - raw:', error)
      console.error('Catch block error - stringified:', JSON.stringify(error, null, 2))
      console.error('Catch block error - type:', typeof error)
      setTransactions([])
    } finally {
      setIsLoading(false)
    }
  }

  const loadAccountsAndSubcategories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load accounts
      const { data: accountsData } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name')

      // Load expense categories with their groups
      const { data: expenseCategoriesData } = await supabase
        .from('expense_categories')
        .select('*, group:expense_groups(name)')
        .eq('user_id', user.id)
        .order('name')

      setAccounts(accountsData || [])
      setSubcategories(expenseCategoriesData || [])
    } catch (error) {
      console.error('Error loading accounts and subcategories:', error)
    }
  }

  const handleAddTransaction = async () => {
    if (!newDescription || !newAmount || !newAccountId) {
      alert('Please fill in all required fields')
      return
    }

    if (!newSubcategoryId && !newTransferToAccountId) {
      alert('Please select either a subcategory or a transfer account')
      return
    }

    if (newSubcategoryId && newTransferToAccountId) {
      alert('Cannot select both subcategory and transfer account')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      if (newSubcategoryId) {
        // Regular categorized transaction
        const transactionData = {
          user_id: user.id,
          account_id: newAccountId,
          expense_category_id: newSubcategoryId,
          amount: parseFloat(newAmount),
          description: newDescription,
          transaction_date: newDate,
          notes: newNotes || null,
          reference_number: newReferenceNumber || null,
          reference: newReference || null,
        }

        const { error } = await supabase
          .from('transactions')
          .insert(transactionData)

        if (error) throw error

      } else if (newTransferToAccountId) {
        // Transfer - create two transactions
        const amount = parseFloat(newAmount)
        const absAmount = Math.abs(amount)
        
        const transactions = [
          // Transaction in source account (negative - money leaving)
          {
            user_id: user.id,
            account_id: newAccountId,
            transfer_to_account_id: newTransferToAccountId,
            amount: -absAmount,
            description: newDescription,
            transaction_date: newDate,
            notes: newNotes || null,
            reference_number: newReferenceNumber || null,
            reference: newReference || null,
          },
          // Transaction in destination account (positive - money arriving)
          {
            user_id: user.id,
            account_id: newTransferToAccountId,
            transfer_to_account_id: newAccountId,
            amount: absAmount,
            description: newDescription,
            transaction_date: newDate,
            notes: newNotes || null,
            reference_number: newReferenceNumber || null,
            reference: newReference || null,
          }
        ]

        const { error } = await supabase
          .from('transactions')
          .insert(transactions)

        if (error) throw error
      }

      // Reset form
      setNewDescription('')
      setNewAmount('')
      setNewAccountId('')
      setNewSubcategoryId('')
      setNewTransferToAccountId('')
      setNewDate(new Date().toISOString().split('T')[0])
      setNewNotes('')
      setNewReferenceNumber('')
      setNewReference('')
      setIsAddDialogOpen(false)

      // Reload transactions
      loadTransactions()
    } catch (error) {
      console.error('Error adding transaction:', error)
      alert('Error adding transaction')
    }
  }

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

  const handleEditTransaction = async (transaction: any) => {
    setEditingTransaction(transaction)
    setEditedDescription(transaction.description)
    setEditedAmount(Math.abs(transaction.amount).toString())
    setEditedDate(transaction.date)
    setEditedNotes(transaction.notes || '')
    setEditedReferenceNumber(transaction.referenceNumber || '')
    setEditedReference(transaction.reference || '')
    
    // Load the actual transaction to get IDs
    try {
      const { data: transData } = await supabase
        .from('transactions')
        .select('account_id, expense_category_id')
        .eq('id', transaction.id)
        .single()
      
      if (transData) {
        setEditedAccountId(transData.account_id || '')
        setEditedExpenseCategoryId(transData.expense_category_id || '')
      }
    } catch (error) {
      console.error('Error loading transaction details:', error)
    }
    
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingTransaction) return
    
    const amount = parseFloat(editedAmount)
    if (isNaN(amount)) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Determine if this is income or expense based on the category
      let finalAmount = amount
      if (editedExpenseCategoryId) {
        const category = subcategories.find(c => c.id === editedExpenseCategoryId)
        const isIncome = category?.group?.name === 'Income'
        finalAmount = isIncome ? amount : -amount
      }

      // Update the transaction in Supabase
      const { error } = await supabase
        .from('transactions')
        .update({
          description: editedDescription,
          account_id: editedAccountId,
          expense_category_id: editedExpenseCategoryId || null,
          amount: finalAmount,
          transaction_date: editedDate,
          notes: editedNotes || null,
          reference_number: editedReferenceNumber || null,
          reference: editedReference || null,
        })
        .eq('id', editingTransaction.id)

      if (error) throw error

      // Reload transactions to get fresh data
      await loadTransactions()
      
      setIsEditDialogOpen(false)
      setEditingTransaction(null)
      loadTransactions() // Reload to get fresh data
    } catch (error) {
      console.error('Error updating transaction:', error)
      alert('Error updating transaction')
    }
  }

  const handleDeleteTransaction = async () => {
    if (!editingTransaction) return
    
    if (!confirm('Are you sure you want to delete this transaction?')) {
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Check if this is a transfer transaction
      const { data: transactionData } = await supabase
        .from('transactions')
        .select('transfer_to_account_id')
        .eq('id', editingTransaction.id)
        .single()

      if (transactionData?.transfer_to_account_id) {
        // For transfers, find and delete both transactions
        const { data: linkedTransactions } = await supabase
          .from('transactions')
          .select('id, transfer_to_account_id, account_id, transaction_date, amount')
          .eq('user_id', user.id)
          .eq('transaction_date', editingTransaction.date)
          .or(`id.eq.${editingTransaction.id},and(account_id.eq.${transactionData.transfer_to_account_id},amount.eq.${-parseFloat(editingTransaction.amount)})`)

        if (linkedTransactions && linkedTransactions.length > 0) {
          const idsToDelete = linkedTransactions.map(t => t.id)
          const { error } = await supabase
            .from('transactions')
            .delete()
            .in('id', idsToDelete)

          if (error) throw error
        }
      } else {
        // Regular transaction - just delete it
        const { error } = await supabase
          .from('transactions')
          .delete()
          .eq('id', editingTransaction.id)

        if (error) throw error
      }

      setIsEditDialogOpen(false)
      setEditingTransaction(null)
      loadTransactions()
    } catch (error) {
      console.error('Error deleting transaction:', error)
      alert('Error deleting transaction')
    }
  }

  const handleCancelEdit = () => {
    setIsEditDialogOpen(false)
    setEditingTransaction(null)
    setEditedDescription('')
    setEditedAmount('')
    setEditedDate('')
    setEditedAccountId('')
    setEditedExpenseCategoryId('')
    setEditedNotes('')
    setEditedReferenceNumber('')
    setEditedReference('')
  }

  const parseQIFContent = (text: string, format: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD' = 'MM/DD/YYYY'): any[] => {
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
      // Read file content
      const content = await file.text()
      setQifFileContent(content)
      
      // Parse with current date format for preview
      const parsedTransactions = parseQIFContent(content, dateFormat)
      
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
      setQifFileContent('')

    } catch (error) {
      console.error('Error importing transactions:', error)
      alert('Error importing transactions.')
    }
  }

  const handleCancelImport = () => {
    setIsPreviewDialogOpen(false)
    setPreviewTransactions([])
    setQifFileContent('')
  }

  // Re-parse when date format changes
  const handleDateFormatChange = (newFormat: typeof dateFormat) => {
    setDateFormat(newFormat)
    if (qifFileContent) {
      // Re-parse with new format
      const parsedTransactions = parseQIFContent(qifFileContent, newFormat)
      setPreviewTransactions(parsedTransactions)
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Transactions</h1>
          <p className="text-sm text-muted-foreground md:text-base truncate">
            {selectedAccount !== 'all' 
              ? `Viewing transactions for ${selectedAccount}` 
              : 'View and manage all your transactions'}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {selectedAccount !== 'all' && (
            <Button 
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedAccount('all')
                window.history.pushState({}, '', '/transactions')
              }}
            >
              Clear Filter
            </Button>
          )}
          <Button variant="outline" className="gap-2" size="sm">
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filter</span>
          </Button>
          <Button variant="outline" className="gap-2" size="sm">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
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
              size="sm"
              onClick={() => document.getElementById('qif-upload')?.click()}
              disabled={isProcessingImport}
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">{isProcessingImport ? 'Processing...' : 'Import QIF'}</span>
              <span className="sm:hidden">Import</span>
            </Button>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Transaction</DialogTitle>
                <DialogDescription>
                  Manually add a transaction to any account
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-description">Description *</Label>
                  <Input 
                    id="new-description" 
                    placeholder="e.g., Coffee at Starbucks"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-amount">Amount *</Label>
                  <Input
                    id="new-amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    {newTransferToAccountId 
                      ? 'Enter transfer amount (will be deducted from source and added to destination)'
                      : 'Use negative for expenses, positive for income'
                    }
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-account">Account *</Label>
                  <select
                    id="new-account"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                    value={newAccountId}
                    onChange={(e) => setNewAccountId(e.target.value)}
                  >
                    <option value="">Select an account</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-subcategory">Expense Category</Label>
                  <select
                    id="new-subcategory"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                    value={newSubcategoryId}
                    onChange={(e) => {
                      setNewSubcategoryId(e.target.value)
                      if (e.target.value) setNewTransferToAccountId('')
                    }}
                    disabled={!!newTransferToAccountId}
                  >
                    <option value="">None (for transfers)</option>
                    {subcategories.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name} {sub.group?.name && `(${sub.group.name})`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-transfer">Transfer To Account</Label>
                  <select
                    id="new-transfer"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                    value={newTransferToAccountId}
                    onChange={(e) => {
                      setNewTransferToAccountId(e.target.value)
                      if (e.target.value) setNewSubcategoryId('')
                    }}
                    disabled={!!newSubcategoryId}
                  >
                    <option value="">None (regular transaction)</option>
                    {accounts.filter(a => a.id !== newAccountId).map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Select this for transfers between your accounts
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-date">Date *</Label>
                  <Input 
                    id="new-date" 
                    type="date" 
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-notes">Notes (Optional)</Label>
                  <Input 
                    id="new-notes" 
                    placeholder="Additional details"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-reference-number">Reference Number (Optional)</Label>
                  <Input 
                    id="new-reference-number" 
                    placeholder="e.g., Check #, Transaction ID"
                    maxLength={25}
                    value={newReferenceNumber}
                    onChange={(e) => setNewReferenceNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-reference">Reference (Optional)</Label>
                  <Input 
                    id="new-reference" 
                    placeholder="Additional reference or memo"
                    maxLength={250}
                    value={newReference}
                    onChange={(e) => setNewReference(e.target.value)}
                  />
                </div>
                <Button className="w-full" onClick={handleAddTransaction}>
                  Add Transaction
                </Button>
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
          <div className="overflow-x-auto">
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
                    {transaction.referenceNumber && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Ref: {transaction.referenceNumber}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{transaction.category}</span>
                      <span className="text-xs text-muted-foreground">
                        {transaction.subcategory}
                      </span>
                      {transaction.reference && (
                        <span className="text-xs text-muted-foreground italic mt-1">
                          {transaction.reference}
                        </span>
                      )}
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
          </div>
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
                  value={editedAccountId}
                  onChange={(e) => setEditedAccountId(e.target.value)}
                >
                  <option value="">Select an account</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-expense-category">Expense Category</Label>
                <select
                  id="edit-expense-category"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                  value={editedExpenseCategoryId}
                  onChange={(e) => setEditedExpenseCategoryId(e.target.value)}
                >
                  <option value="">Select a category</option>
                  {subcategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} {sub.group?.name && `(${sub.group.name})`}
                    </option>
                  ))}
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
              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Input
                  id="edit-notes"
                  placeholder="Additional details"
                  value={editedNotes}
                  onChange={(e) => setEditedNotes(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-reference-number">Reference Number</Label>
                <Input
                  id="edit-reference-number"
                  placeholder="e.g., Check #, Transaction ID"
                  maxLength={25}
                  value={editedReferenceNumber}
                  onChange={(e) => setEditedReferenceNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-reference">Reference</Label>
                <Input
                  id="edit-reference"
                  placeholder="Additional reference or memo"
                  maxLength={250}
                  value={editedReference}
                  onChange={(e) => setEditedReference(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={handleSaveEdit}>
                  Save Changes
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  size="icon"
                  onClick={handleDeleteTransaction}
                  title="Delete transaction"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Import Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview Import</DialogTitle>
            <DialogDescription>
              Review transactions before importing. {previewTransactions.length} transactions found.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date-format">Date Format</Label>
              <select
                id="date-format"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                value={dateFormat}
                onChange={(e) => handleDateFormatChange(e.target.value as typeof dateFormat)}
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY (US Format)</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY (European Format)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (ISO Format)</option>
              </select>
              <p className="text-xs text-muted-foreground">
                Select the date format used in your QIF file. If dates look incorrect, try a different format.
              </p>
            </div>

            {previewTransactions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Transaction Preview</h4>
                <div className="max-h-[400px] overflow-y-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewTransactions.slice(0, 100).map((trans, index) => (
                        <TableRow key={index}>
                          <TableCell>{formatDate(trans.date)}</TableCell>
                          <TableCell className="max-w-[400px] truncate">
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
                {previewTransactions.length > 100 && (
                  <p className="text-xs text-muted-foreground text-center">
                    Showing first 100 of {previewTransactions.length} transactions
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancelImport}>
                Cancel
              </Button>
              <Button onClick={handleConfirmImport}>
                Import {previewTransactions.length} Transactions
              </Button>
            </div>
          </div>
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
