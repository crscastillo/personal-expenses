'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Search, Filter, Download, Pencil, ArrowUpDown, ArrowUp, ArrowDown, Upload, AlertCircle, CheckCircle2, Trash2, ChevronDown, ChevronUp, MoreVertical, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { Calculator } from '@/components/calculator'
import { formatCurrency, formatDate, getMonthName, getCurrentMonth, getCurrentYear } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
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
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  // searchParams.get() already decodes URL parameters automatically
  const accountFilter = searchParams?.get('account') || null
  
  const [transactions, setTransactions] = useState<any[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
  const [subcategories, setSubcategories] = useState<any[]>([])
  const [expenseGroups, setExpenseGroups] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAccount, setSelectedAccount] = useState(accountFilter || 'all')
  const [sortColumn, setSortColumn] = useState<'date' | 'description' | 'category' | 'account' | 'amount'>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [isLargeScreen, setIsLargeScreen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth())
  const [currentYear, setCurrentYear] = useState(getCurrentYear())
  
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
  const [showOptionalFields, setShowOptionalFields] = useState(false)
  
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
    skipped: number
    total: number
    transactions: any[]
  } | null>(null)
  const [isProcessingImport, setIsProcessingImport] = useState(false)
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
  const [previewTransactions, setPreviewTransactions] = useState<any[]>([])
  const [dateFormat, setDateFormat] = useState<'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD'>('MM/DD/YYYY')
  const [qifFileContent, setQifFileContent] = useState<string>('')
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set())

  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024) // lg breakpoint
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

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

      // Load expense groups
      const { data: expenseGroupsData } = await supabase
        .from('expense_groups')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order')

      // Load expense categories with their groups
      const { data: expenseCategoriesData } = await supabase
        .from('expense_categories')
        .select('*, group:expense_groups(name, id)')
        .eq('user_id', user.id)
        .order('name')

      setAccounts(accountsData || [])
      setExpenseGroups(expenseGroupsData || [])
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
      setShowOptionalFields(false)
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
      
      // Compare trimmed account names
      const matchesAccount = selectedAccount === 'all' || t.account.trim() === selectedAccount.trim()
      
      // Month filter
      const transactionDate = new Date(t.date)
      const matchesMonth = transactionDate.getMonth() + 1 === currentMonth && 
                          transactionDate.getFullYear() === currentYear
      
      return matchesSearch && matchesAccount && matchesMonth
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

  const nextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const previousMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

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

  const handleToggleTransaction = (transactionId: string) => {
    setSelectedTransactions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(transactionId)) {
        newSet.delete(transactionId)
      } else {
        newSet.add(transactionId)
      }
      return newSet
    })
  }

  const handleToggleAllTransactions = () => {
    if (selectedTransactions.size === filteredAndSortedTransactions.length) {
      setSelectedTransactions(new Set())
    } else {
      setSelectedTransactions(new Set(filteredAndSortedTransactions.map(t => t.id)))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedTransactions.size === 0) return

    const confirmMessage = `Are you sure you want to delete ${selectedTransactions.size} transaction(s)? This action cannot be undone.`
    if (!confirm(confirmMessage)) return

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .in('id', Array.from(selectedTransactions))

      if (error) throw error

      // Clear selection and reload
      setSelectedTransactions(new Set())
      await loadTransactions()
    } catch (error) {
      console.error('Error deleting transactions:', error)
      alert('Error deleting transactions. Please try again.')
    }
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
              
              // Convert to numbers for validation
              const monthNum = parseInt(month)
              const dayNum = parseInt(day)
              const yearNum = parseInt(year)
              
              // Validate date ranges
              if (monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31 || yearNum < 1900 || yearNum > 2100) {
                console.warn(`Invalid date detected: ${value} (parsed as ${year}-${month}-${day}). Check date format setting.`)
                break
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

  const parseOFXContent = (text: string): any[] => {
    const transactions: any[] = []
    
    try {
      // OFX can be SGML or XML format
      // Extract transaction statements (STMTTRN blocks)
      const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g
      let match
      
      while ((match = stmtTrnRegex.exec(text)) !== null) {
        const trnBlock = match[1]
        
        // Extract fields from transaction block
        const getField = (fieldName: string): string | null => {
          const fieldRegex = new RegExp(`<${fieldName}>([^<\n]+)`)
          const fieldMatch = trnBlock.match(fieldRegex)
          return fieldMatch ? fieldMatch[1].trim() : null
        }
        
        // Parse date (format: YYYYMMDD or YYYYMMDDHHMMSS)
        const dtPosted = getField('DTPOSTED')
        let date = ''
        if (dtPosted) {
          const dateStr = dtPosted.substring(0, 8) // Get YYYYMMDD part
          const year = dateStr.substring(0, 4)
          const month = dateStr.substring(4, 6)
          const day = dateStr.substring(6, 8)
          date = `${year}-${month}-${day}`
        }
        
        // Parse amount
        const trnAmt = getField('TRNAMT')
        const amount = trnAmt ? parseFloat(trnAmt) : 0
        
        // Parse description (try NAME first, then MEMO)
        let description = getField('NAME') || getField('MEMO') || 'Unknown'
        
        // Add memo if both exist
        const name = getField('NAME')
        const memo = getField('MEMO')
        if (name && memo && name !== memo) {
          description = `${name} - ${memo}`
        }
        
        // Parse reference number
        const checkNum = getField('CHECKNUM') || getField('REFNUM')
        
        if (date && description) {
          transactions.push({
            date,
            amount,
            description,
            checkNumber: checkNum || undefined
          })
        }
      }
      
      return transactions
    } catch (error) {
      console.error('Error parsing OFX:', error)
      throw new Error('Invalid OFX format')
    }
  }

  const isDuplicate = (newTrans: any, existingTrans: any): boolean => {
    // Check if transactions match on date, amount, and description
    return (
      newTrans.date === existingTrans.date &&
      Math.abs(newTrans.amount - existingTrans.amount) < 0.01 &&
      newTrans.description.toLowerCase().includes(existingTrans.description.toLowerCase().substring(0, 10))
    )
  }

  // Auto-categorize transactions based on description patterns
  const autoCategorizTransaction = (description: string): { categoryId: string | null, categoryName: string, subcategoryName: string } => {
    const desc = description.toLowerCase().trim()
    
    // Helper function to extract merchant name from description
    const extractMerchantName = (text: string): string => {
      return text
        .toLowerCase()
        .replace(/\\/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/\b\d+\b/g, '') // Remove standalone numbers
        .replace(/\b(inc|llc|ltd|corp|co|the|and|at|in|on|de|del|la|el)\b/gi, '')
        .trim()
        .split(/\s+/)
        .slice(0, 3) // Take first 3 words as merchant identifier
        .join(' ')
    }
    
    const currentMerchant = extractMerchantName(desc)
    
    // Strategy 1: Look for exact merchant name matches in history (highest priority)
    // Sort by date descending to get the most recent categorization
    const sortedTransactions = [...transactions].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    
    for (const t of sortedTransactions) {
      if (!t.description || t.subcategory === 'Untracked') continue
      
      const historicalMerchant = extractMerchantName(t.description.toLowerCase())
      
      // Check for exact merchant match
      if (currentMerchant && historicalMerchant && currentMerchant === historicalMerchant) {
        const subcategoryMatch = subcategories.find(sub => sub.name === t.subcategory)
        return {
          categoryId: subcategoryMatch?.id || null,
          categoryName: t.category,
          subcategoryName: t.subcategory
        }
      }
    }
    
    // Strategy 2: Look for partial matches with significant word overlap
    for (const t of sortedTransactions) {
      if (!t.description || t.subcategory === 'Untracked') continue
      
      const cleanHistorical = t.description.toLowerCase()
        .replace(/\\/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      
      const cleanCurrent = desc.replace(/\\/g, ' ').replace(/\s+/g, ' ').trim()
      
      // Extract meaningful words (longer than 3 chars, not numbers)
      const historicalWords = new Set(
        cleanHistorical
          .split(/\s+/)
          .filter((w: string) => w.length > 3 && !/^\d+$/.test(w))
      )
      
      const currentWords = cleanCurrent
        .split(/\s+/)
        .filter((w: string) => w.length > 3 && !/^\d+$/.test(w))
      
      // Need at least 2 matching words or 1 very specific word (>6 chars)
      const matchingWords = currentWords.filter(word => historicalWords.has(word))
      const hasStrongMatch = matchingWords.some((w: string) => w.length > 6) || matchingWords.length >= 2
      
      if (hasStrongMatch) {
        const subcategoryMatch = subcategories.find(sub => sub.name === t.subcategory)
        return {
          categoryId: subcategoryMatch?.id || null,
          categoryName: t.category,
          subcategoryName: t.subcategory
        }
      }
    }
    
    // Strategy 3: Common merchant patterns (fallback when no historical data)
    const patterns = [
      // Tech & Software
      { keywords: ['github', 'google', 'apple.com/bill', 'microsoft', 'adobe', 'aws', 'digitalocean', 'heroku', 'netlify', 'vercel'], group: 'Technology', category: 'Software & Subscriptions' },
      { keywords: ['youtube', 'netflix', 'spotify', 'disney', 'hulu', 'hbo', 'amazon prime'], group: 'Entertainment', category: 'Streaming Services' },
      
      // Shopping
      { keywords: ['amazon', 'walmart', 'wal-mart', 'target', 'costco', 'best buy', 'home depot'], group: 'Shopping', category: 'General Shopping' },
      { keywords: ['zara', 'h&m', 'gap', 'old navy', 'nike', 'adidas', 'boot barn'], group: 'Shopping', category: 'Clothing' },
      
      // Food & Dining
      { keywords: ['restaurant', 'cafe', 'coffee', 'starbucks', 'mcdonalds', 'subway', 'pizza'], group: 'Food & Dining', category: 'Restaurants' },
      { keywords: ['supermercado', 'supermarket', 'grocery', 'pali', 'fresh market', 'whole foods', 'trader joe'], group: 'Food & Dining', category: 'Groceries' },
      { keywords: ['farmacia', 'pharmacy', 'cvs', 'walgreens', 'medismart'], group: 'Healthcare', category: 'Pharmacy' },
      
      // Transportation
      { keywords: ['uber', 'lyft', 'taxi', 'parking', 'gas', 'shell', 'exxon', 'chevron'], group: 'Transportation', category: 'Transportation' },
      
      // Utilities & Services
      { keywords: ['coopelesca', 'municipalidad', 'municipality', 'agua', 'water', 'electric', 'internet'], group: 'Fixed Costs', category: 'Utilities' },
      
      // Transfers & Banking
      { keywords: ['sinpe', 'tef a :', 'tef de:', 'transfer'], group: 'Transfer', category: 'Transfer' },
      { keywords: ['deposito', 'deposit', 'dep_atm', 'dep atm'], group: 'Income', category: 'Deposit' },
      { keywords: ['comision', 'commission', 'intereses', 'interest'], group: 'Fixed Costs', category: 'Bank Fees' },
    ]
    
    // Find matching pattern
    for (const pattern of patterns) {
      if (pattern.keywords.some(keyword => desc.includes(keyword))) {
        // Try to find matching category in user's subcategories
        const matchingSubcategory = subcategories.find(sub => 
          sub.name.toLowerCase().includes(pattern.category.toLowerCase()) ||
          pattern.category.toLowerCase().includes(sub.name.toLowerCase())
        )
        
        if (matchingSubcategory) {
          return {
            categoryId: matchingSubcategory.id,
            categoryName: pattern.group,
            subcategoryName: matchingSubcategory.name
          }
        }
        
        // If no exact match, return pattern suggestion
        return {
          categoryId: null,
          categoryName: pattern.group,
          subcategoryName: pattern.category
        }
      }
    }
    
    // Default to Misc/Untracked
    return {
      categoryId: null,
      categoryName: 'Misc',
      subcategoryName: 'Untracked'
    }
  }

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsProcessingImport(true)

    try {
      // Read file content
      const content = await file.text()
      setQifFileContent(content)
      
      // Detect file type and parse accordingly
      const fileName = file.name.toLowerCase()
      let parsedTransactions: any[] = []
      
      if (fileName.endsWith('.ofx')) {
        // Parse OFX file
        parsedTransactions = parseOFXContent(content)
      } else if (fileName.endsWith('.qif')) {
        // Parse QIF file with current date format
        parsedTransactions = parseQIFContent(content, dateFormat)
      } else {
        throw new Error('Unsupported file format. Please upload a .qif or .ofx file.')
      }
      
      // Show preview dialog
      setPreviewTransactions(parsedTransactions)
      setIsPreviewDialogOpen(true)

    } catch (error) {
      console.error('Error loading file:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`Error loading file: ${errorMessage}`)
    } finally {
      setIsProcessingImport(false)
      // Reset file input
      event.target.value = ''
    }
  }

  const handleConfirmImport = async () => {
    try {
      // Validation: Ensure an account is selected
      if (!selectedAccount || selectedAccount === 'all') {
        alert('Please select a specific account to import transactions into.')
        return
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('You must be logged in to import transactions.')
        return
      }

      // Find the account ID from the selected account name
      const account = accounts.find(acc => acc.name === selectedAccount)
      if (!account) {
        alert('Selected account not found. Please refresh the page and try again.')
        return
      }

      // Find or identify an "Untracked" category as fallback
      const untrackedCategory = subcategories.find(sub => 
        sub.name.toLowerCase() === 'untracked' || 
        sub.name.toLowerCase() === 'uncategorized' ||
        sub.name.toLowerCase() === 'misc' ||
        sub.name.toLowerCase() === 'other'
      )

      let importedCount = 0
      let duplicateCount = 0
      let skippedCount = 0
      const newTransactionsForDb: any[] = []
      const newTransactionsForSummary: any[] = []

      for (const trans of previewTransactions) {
        // Check if duplicate
        const isDupe = transactions.some(existing => isDuplicate(trans, existing))
        
        if (isDupe) {
          duplicateCount++
        } else {
          // Auto-categorize based on description
          const categorization = autoCategorizTransaction(trans.description)
          
          // If no category found, use the untracked category as fallback
          let finalCategoryId = categorization.categoryId
          if (!finalCategoryId) {
            if (untrackedCategory) {
              finalCategoryId = untrackedCategory.id
            } else {
              // Skip this transaction if no category available
              console.warn(`Skipping transaction "${trans.description}" - no category available`)
              skippedCount++
              continue
            }
          }
          
          // Prepare transaction for database insert
          const dbTransaction = {
            user_id: user.id,
            account_id: account.id, // Use the UUID, not the name
            expense_category_id: finalCategoryId, // Always has a value now
            amount: trans.amount,
            description: trans.description,
            transaction_date: trans.date,
            is_pending: false,
          }
          newTransactionsForDb.push(dbTransaction)

          // Prepare transaction for summary display
          const summaryTransaction = {
            date: trans.date,
            description: trans.description,
            amount: trans.amount,
            category: categorization.categoryName,
            subcategory: categorization.subcategoryName,
          }
          newTransactionsForSummary.push(summaryTransaction)
          
          importedCount++
        }
      }

      // Validate dates before saving
      const invalidDates = newTransactionsForDb.filter(t => {
        const date = new Date(t.transaction_date)
        return isNaN(date.getTime())
      })

      if (invalidDates.length > 0) {
        alert(`Found ${invalidDates.length} transaction(s) with invalid dates. For QIF files, check the date format setting in the preview. For OFX files, the file may be corrupted.`)
        return
      }

      // Save to Supabase
      if (newTransactionsForDb.length > 0) {
        const { error } = await supabase
          .from('transactions')
          .insert(newTransactionsForDb)

        if (error) {
          console.error('Database error:', error)
          if (error.message.includes('date/time field value out of range')) {
            alert('Some dates are invalid. For QIF files, select the correct date format (MM/DD/YYYY or DD/MM/YYYY) in the preview screen. For OFX files, check if the file is valid.')
          } else {
            alert('Error saving transactions: ' + error.message)
          }
          throw error
        }
      }

      // Show summary
      setImportSummary({
        imported: importedCount,
        duplicates: duplicateCount,
        skipped: skippedCount,
        total: previewTransactions.length,
        transactions: newTransactionsForSummary,
      })

      // Show alert if some were skipped
      if (skippedCount > 0) {
        alert(`Import complete! ${importedCount} imported, ${duplicateCount} duplicates skipped, ${skippedCount} skipped (no matching category). To import skipped transactions, please create an "Untracked" or "Misc" category first.`)
      }

      // Close preview dialog
      setIsPreviewDialogOpen(false)
      setPreviewTransactions([])
      setQifFileContent('')

      // Reload transactions from database
      await loadTransactions()

    } catch (error) {
      console.error('Error importing transactions:', error)
      alert('Error importing transactions. Please try again.')
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
        <div className="flex gap-2 flex-wrap items-center">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium whitespace-nowrap">
                {getMonthName(currentMonth)} {currentYear}
              </span>
            </div>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
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
              id="file-upload"
              type="file"
              accept=".qif,.ofx"
              className="hidden"
              onChange={handleImportFile}
              disabled={isProcessingImport}
            />
            <Button 
              variant="outline" 
              className="gap-2"
              size="sm"
              onClick={() => document.getElementById('file-upload')?.click()}
              disabled={isProcessingImport}
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">{isProcessingImport ? 'Processing...' : 'Import QIF/OFX'}</span>
              <span className="sm:hidden">Import</span>
            </Button>
          </div>
          
          {/* Large Screen: Dialog */}
          {isLargeScreen ? (
            <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
              setIsAddDialogOpen(open)
              if (!open) setShowOptionalFields(false)
            }}>
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
                      {expenseGroups
                        .sort((a, b) => {
                          // Sort income groups first, then expenses
                          if (a.type === 'income' && b.type !== 'income') return -1
                          if (a.type !== 'income' && b.type === 'income') return 1
                          return a.sort_order - b.sort_order
                        })
                        .map((group) => {
                          const groupCategories = subcategories.filter(
                            cat => cat.group?.id === group.id
                          )
                          if (groupCategories.length === 0) return null
                          return (
                            <optgroup key={group.id} label={group.name}>
                              {groupCategories.map((sub) => (
                                <option key={sub.id} value={sub.id}>
                                  {sub.name}
                                </option>
                              ))}
                            </optgroup>
                          )
                        })}
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
                  
                  {/* Optional Fields Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowOptionalFields(!showOptionalFields)}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showOptionalFields ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        Hide optional fields
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        Show optional fields
                      </>
                    )}
                  </button>

                  {showOptionalFields && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="new-notes">Notes</Label>
                        <Input 
                          id="new-notes" 
                          placeholder="Additional details"
                          value={newNotes}
                          onChange={(e) => setNewNotes(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-reference-number">Reference Number</Label>
                        <Input 
                          id="new-reference-number" 
                          placeholder="e.g., Check #, Transaction ID"
                          maxLength={25}
                          value={newReferenceNumber}
                          onChange={(e) => setNewReferenceNumber(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-reference">Reference</Label>
                        <Input 
                          id="new-reference" 
                          placeholder="Additional reference or memo"
                          maxLength={250}
                          value={newReference}
                          onChange={(e) => setNewReference(e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  <Button className="w-full" onClick={handleAddTransaction}>
                    Add Transaction
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            /* Small/Medium Screen: Drawer from bottom */
            <Drawer open={isAddDialogOpen} onOpenChange={(open) => {
              setIsAddDialogOpen(open)
              if (!open) setShowOptionalFields(false)
            }}>
              <DrawerTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Transaction
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Add Transaction</DrawerTitle>
                  <DrawerDescription>
                    Manually add a transaction to any account
                  </DrawerDescription>
                </DrawerHeader>
                <div className="px-4 pb-4 space-y-4 overflow-y-auto flex-1">
                  <div className="space-y-2">
                    <Label htmlFor="new-description-drawer">Description *</Label>
                    <Input 
                      id="new-description-drawer" 
                      placeholder="e.g., Coffee at Starbucks"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-amount-drawer">Amount *</Label>
                    <Input
                      id="new-amount-drawer"
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
                    <Label htmlFor="new-account-drawer">Account *</Label>
                    <select
                      id="new-account-drawer"
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
                    <Label htmlFor="new-subcategory-drawer">Expense Category</Label>
                    <select
                      id="new-subcategory-drawer"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                      value={newSubcategoryId}
                      onChange={(e) => {
                        setNewSubcategoryId(e.target.value)
                        if (e.target.value) setNewTransferToAccountId('')
                      }}
                      disabled={!!newTransferToAccountId}
                    >
                      <option value="">None (for transfers)</option>
                      {expenseGroups
                        .sort((a, b) => {
                          // Sort income groups first, then expenses
                          if (a.type === 'income' && b.type !== 'income') return -1
                          if (a.type !== 'income' && b.type === 'income') return 1
                          return a.sort_order - b.sort_order
                        })
                        .map((group) => {
                          const groupCategories = subcategories.filter(
                            cat => cat.group?.id === group.id
                          )
                          if (groupCategories.length === 0) return null
                          return (
                            <optgroup key={group.id} label={group.name}>
                              {groupCategories.map((sub) => (
                                <option key={sub.id} value={sub.id}>
                                  {sub.name}
                                </option>
                              ))}
                            </optgroup>
                          )
                        })}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-transfer-drawer">Transfer To Account</Label>
                    <select
                      id="new-transfer-drawer"
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
                    <Label htmlFor="new-date-drawer">Date *</Label>
                    <Input 
                      id="new-date-drawer" 
                      type="date" 
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                    />
                  </div>
                  
                  {/* Optional Fields Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowOptionalFields(!showOptionalFields)}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showOptionalFields ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        Hide optional fields
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        Show optional fields
                      </>
                    )}
                  </button>

                  {showOptionalFields && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="new-notes-drawer">Notes</Label>
                        <Input 
                          id="new-notes-drawer" 
                          placeholder="Additional details"
                          value={newNotes}
                          onChange={(e) => setNewNotes(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-reference-number-drawer">Reference Number</Label>
                        <Input 
                          id="new-reference-number-drawer" 
                          placeholder="e.g., Check #, Transaction ID"
                          maxLength={25}
                          value={newReferenceNumber}
                          onChange={(e) => setNewReferenceNumber(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-reference-drawer">Reference</Label>
                        <Input 
                          id="new-reference-drawer" 
                          placeholder="Additional reference or memo"
                          maxLength={250}
                          value={newReference}
                          onChange={(e) => setNewReference(e.target.value)}
                        />
                      </div>
                    </>
                  )}
                </div>
                <DrawerFooter>
                  <Button className="w-full" onClick={handleAddTransaction}>
                    Add Transaction
                  </Button>
                  <DrawerClose asChild>
                    <Button variant="outline" className="w-full">Cancel</Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          )}
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                {filteredAndSortedTransactions.length} transactions found
                {selectedTransactions.size > 0 && isLargeScreen && (
                  <span className="ml-2 text-primary font-medium">
                    ({selectedTransactions.size} selected)
                  </span>
                )}
              </CardDescription>
            </div>
            {selectedTransactions.size > 0 && isLargeScreen && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="h-4 w-4 mr-2" />
                    Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={handleBulkDelete}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected ({selectedTransactions.size})
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
              <TableRow>
                {isLargeScreen && (
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectedTransactions.size === filteredAndSortedTransactions.length && filteredAndSortedTransactions.length > 0}
                      onCheckedChange={handleToggleAllTransactions}
                    />
                  </TableHead>
                )}
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
                  {isLargeScreen && (
                    <TableCell>
                      <Checkbox
                        checked={selectedTransactions.has(transaction.id)}
                        onCheckedChange={() => handleToggleTransaction(transaction.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                  )}
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
                  {expenseGroups
                    .sort((a, b) => {
                      // Sort income groups first, then expenses
                      if (a.type === 'income' && b.type !== 'income') return -1
                      if (a.type !== 'income' && b.type === 'income') return 1
                      return a.sort_order - b.sort_order
                    })
                    .map((group) => {
                      const groupCategories = subcategories.filter(
                        cat => cat.group?.id === group.id
                      )
                      if (groupCategories.length === 0) return null
                      return (
                        <optgroup key={group.id} label={group.name}>
                          {groupCategories.map((sub) => (
                            <option key={sub.id} value={sub.id}>
                              {sub.name}
                            </option>
                          ))}
                        </optgroup>
                      )
                    })}
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

      {/* Import Preview Drawer */}
      <Drawer open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen} direction="bottom">
        <DrawerContent className="w-[90%] mx-auto max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Preview Import</DrawerTitle>
            <DrawerDescription>
              Review transactions before importing. {previewTransactions.length} transactions found.
              Categories are auto-detected based on merchant names and your transaction history.
              <strong className="block mt-2 text-foreground">⚠️ If dates look wrong (for QIF files), change the date format below.</strong>
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4 space-y-4 overflow-y-auto flex-1">
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
                <strong>Important:</strong> This setting is only for QIF files. OFX files contain date format information and are parsed automatically.
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
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewTransactions.slice(0, 100).map((trans, index) => {
                        const categorization = autoCategorizTransaction(trans.description)
                        return (
                          <TableRow key={index}>
                            <TableCell>{formatDate(trans.date)}</TableCell>
                            <TableCell className="max-w-[300px] truncate">
                              {trans.description}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-medium">{categorization.categoryName}</span>
                                <span className="text-xs text-muted-foreground">{categorization.subcategoryName}</span>
                              </div>
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
                        )
                      })}
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
        </DrawerContent>
      </Drawer>

      {/* Import Summary Drawer */}
      <Drawer open={!!importSummary} onOpenChange={(open) => !open && setImportSummary(null)} direction="bottom">
        <DrawerContent className="w-[90%] mx-auto max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Import Summary</DrawerTitle>
            <DrawerDescription>
              File import completed
            </DrawerDescription>
          </DrawerHeader>
          {importSummary && (
            <div className="px-4 pb-4 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        Skipped
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {importSummary.skipped}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {importSummary.skipped > 0 && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="pt-6">
                    <div className="flex gap-3">
                      <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-blue-900">
                          {importSummary.skipped} transaction(s) were skipped
                        </p>
                        <p className="text-sm text-blue-800">
                          These transactions couldn't be auto-categorized and you don't have an "Untracked", "Uncategorized", "Misc", or "Other" category. 
                          To import these transactions, go to Categories and create one of these catch-all categories, then try importing again.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {importSummary.imported > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Imported Transactions (with auto-detected categories)</h4>
                  <div className="max-h-[400px] overflow-y-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[120px]">Date</TableHead>
                          <TableHead className="min-w-[300px]">Description</TableHead>
                          <TableHead className="w-[200px]">Category</TableHead>
                          <TableHead className="text-right w-[120px]">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {importSummary.transactions.slice(0, 50).map((trans) => (
                          <TableRow key={trans.id}>
                            <TableCell className="whitespace-nowrap">{formatDate(trans.date)}</TableCell>
                            <TableCell className="max-w-[400px]">
                              <div className="truncate">{trans.description}</div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-medium">{trans.category}</span>
                                <span className="text-xs text-muted-foreground">{trans.subcategory}</span>
                              </div>
                            </TableCell>
                            <TableCell
                              className="text-right font-medium whitespace-nowrap"
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
        </DrawerContent>
      </Drawer>
    </div>
  )
}
