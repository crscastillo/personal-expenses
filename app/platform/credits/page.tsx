'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, CreditCard, Home, Car, GraduationCap, TrendingDown, FileText, Upload, Pencil } from 'lucide-react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type CreditType = 'mortgage' | 'personal_loan' | 'auto_loan' | 'student_loan' | 'credit_card' | 'line_of_credit' | 'other'

interface Credit {
  id: string
  name: string
  type: CreditType
  institution: string | null
  account_number: string | null
  original_amount: number
  current_balance: number
  interest_rate: number
  currency: string
  start_date: string | null
  maturity_date: string | null
  minimum_payment: number | null
  payment_due_day: number | null
  color: string
  is_active: boolean
  notes: string | null
}

interface CreditStatement {
  id: string
  credit_id: string
  statement_date: string
  balance: number
  interest_rate: number | null
  minimum_payment: number | null
  payment_due_date: string | null
  interest_charged: number | null
  principal_paid: number | null
  fees_charged: number | null
  new_charges: number | null
  payments_made: number | null
  notes: string | null
}

const creditTypeIcons: Record<CreditType, any> = {
  mortgage: Home,
  personal_loan: TrendingDown,
  auto_loan: Car,
  student_loan: GraduationCap,
  credit_card: CreditCard,
  line_of_credit: CreditCard,
  other: FileText,
}

const creditTypeLabels: Record<CreditType, string> = {
  mortgage: 'Mortgage',
  personal_loan: 'Personal Loan',
  auto_loan: 'Auto Loan',
  student_loan: 'Student Loan',
  credit_card: 'Credit Card',
  line_of_credit: 'Line of Credit',
  other: 'Other',
}

const getCurrencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = {
    'USD': '$',
    'CRC': '₡',
  }
  return symbols[currency] || currency
}

export default function CreditsPage() {
  const [creditsList, setCreditsList] = useState<Credit[]>([])
  const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null)
  const [statements, setStatements] = useState<CreditStatement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Exchange rates for USD conversion
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({})
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isStatementsDialogOpen, setIsStatementsDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [isLargeScreen, setIsLargeScreen] = useState(false)
  const [editingCredit, setEditingCredit] = useState<Credit | null>(null)
  
  // Form state for adding credit
  const [newCreditName, setNewCreditName] = useState('')
  const [newCreditType, setNewCreditType] = useState<CreditType>('credit_card')
  const [newInstitution, setNewInstitution] = useState('')
  const [newAccountNumber, setNewAccountNumber] = useState('')
  const [newOriginalAmount, setNewOriginalAmount] = useState('')
  const [newCurrentBalance, setNewCurrentBalance] = useState('')
  const [newInterestRate, setNewInterestRate] = useState('')
  const [newStartDate, setNewStartDate] = useState('')
  const [newMaturityDate, setNewMaturityDate] = useState('')
  const [newMinimumPayment, setNewMinimumPayment] = useState('')
  const [newPaymentDueDay, setNewPaymentDueDay] = useState('')
  const [newCurrency, setNewCurrency] = useState('USD')
  const [newColor, setNewColor] = useState('#ef4444')
  const [newNotes, setNewNotes] = useState('')

  // Form state for editing credit
  const [editCreditName, setEditCreditName] = useState('')
  const [editCreditType, setEditCreditType] = useState<CreditType>('credit_card')
  const [editInstitution, setEditInstitution] = useState('')
  const [editAccountNumber, setEditAccountNumber] = useState('')
  const [editOriginalAmount, setEditOriginalAmount] = useState('')
  const [editCurrentBalance, setEditCurrentBalance] = useState('')
  const [editInterestRate, setEditInterestRate] = useState('')
  const [editStartDate, setEditStartDate] = useState('')
  const [editMaturityDate, setEditMaturityDate] = useState('')
  const [editMinimumPayment, setEditMinimumPayment] = useState('')
  const [editPaymentDueDay, setEditPaymentDueDay] = useState('')
  const [editCurrency, setEditCurrency] = useState('USD')
  const [editColor, setEditColor] = useState('#ef4444')
  const [editNotes, setEditNotes] = useState('')

  // Form state for adding statement
  const [statementDate, setStatementDate] = useState('')
  const [statementBalance, setStatementBalance] = useState('')
  const [statementInterestRate, setStatementInterestRate] = useState('')
  const [statementMinPayment, setStatementMinPayment] = useState('')
  const [statementDueDate, setStatementDueDate] = useState('')
  const [statementInterestCharged, setStatementInterestCharged] = useState('')
  const [statementPrincipalPaid, setStatementPrincipalPaid] = useState('')
  const [statementFeesCharged, setStatementFeesCharged] = useState('')
  const [statementNewCharges, setStatementNewCharges] = useState('')
  const [statementPaymentsMade, setStatementPaymentsMade] = useState('')
  const [statementNotes, setStatementNotes] = useState('')

  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024)
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  useEffect(() => {
    loadCredits()
  }, [])

  // Load exchange rates when credits change
  useEffect(() => {
    loadExchangeRates()
  }, [creditsList])

  const loadExchangeRates = async () => {
    try {
      // Get unique currencies from credits
      const currencies = Array.from(new Set(creditsList.map(c => c.currency).filter(c => c && c !== 'USD')))
      
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

  const loadCredits = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/credits')
      
      if (!response.ok) {
        if (response.status === 401) {
          setCreditsList([])
          setIsLoading(false)
          return
        }
        throw new Error('Failed to load credits')
      }

      const credits = await response.json()
      setCreditsList(credits)
    } catch (error: any) {
      console.error('Error loading credits:', error)
      alert(`Failed to load credits: ${error.message}`)
      setCreditsList([])
    } finally {
      setIsLoading(false)
    }
  }

  const loadStatements = async (creditId: string) => {
    try {
      const response = await fetch(`/api/credits/statements?creditId=${creditId}`)
      
      if (!response.ok) {
        throw new Error('Failed to load statements')
      }

      const data = await response.json()
      setStatements(data)
    } catch (error: any) {
      console.error('Error loading statements:', error)
      alert(`Failed to load statements: ${error.message}`)
      setStatements([])
    }
  }

  const totalDebt = creditsList.reduce((sum, c) => sum + c.current_balance, 0)
  const totalOriginal = creditsList.reduce((sum, c) => sum + c.original_amount, 0)
  const totalMinPayments = creditsList.reduce((sum, c) => sum + (c.minimum_payment || 0), 0)
  const avgInterestRate = creditsList.length > 0
    ? creditsList.reduce((sum, c) => sum + c.interest_rate, 0) / creditsList.length
    : 0

  // USD converted totals
  const totalDebtUSD = creditsList.reduce((sum, c) => sum + convertToUSD(c.current_balance, c.currency), 0)
  const totalOriginalUSD = creditsList.reduce((sum, c) => sum + convertToUSD(c.original_amount, c.currency), 0)
  const totalMinPaymentsUSD = creditsList.reduce((sum, c) => sum + convertToUSD(c.minimum_payment || 0, c.currency), 0)

  const handleAddCredit = async () => {
    if (!newCreditName.trim()) {
      alert('Credit name is required')
      return
    }

    if (!newOriginalAmount || parseFloat(newOriginalAmount) <= 0) {
      alert('Original amount is required')
      return
    }

    if (!newCurrentBalance || parseFloat(newCurrentBalance) <= 0) {
      alert('Current balance is required')
      return
    }

    if (!newInterestRate || parseFloat(newInterestRate) < 0) {
      alert('Interest rate is required')
      return
    }

    try {
      const response = await fetch('/api/credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCreditName,
          type: newCreditType,
          institution: newInstitution || null,
          account_number: newAccountNumber || null,
          original_amount: parseFloat(newOriginalAmount),
          current_balance: parseFloat(newCurrentBalance),
          interest_rate: parseFloat(newInterestRate),
          start_date: newStartDate || null,
          maturity_date: newMaturityDate || null,
          minimum_payment: newMinimumPayment ? parseFloat(newMinimumPayment) : null,
          payment_due_day: newPaymentDueDay ? parseInt(newPaymentDueDay) : null,
          currency: newCurrency,
          color: newColor,
          notes: newNotes || null,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add credit')
      }

      await loadCredits()
      resetAddForm()
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error('Error adding credit:', error)
      alert('Error adding credit. Please try again.')
    }
  }

  const handleAddStatement = async () => {
    if (!selectedCredit) return

    if (!statementDate || !statementBalance) {
      alert('Statement date and balance are required')
      return
    }

    try {
      const response = await fetch('/api/credits/statements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credit_id: selectedCredit.id,
          statement_date: statementDate,
          balance: parseFloat(statementBalance),
          interest_rate: statementInterestRate ? parseFloat(statementInterestRate) : null,
          minimum_payment: statementMinPayment ? parseFloat(statementMinPayment) : null,
          payment_due_date: statementDueDate || null,
          interest_charged: statementInterestCharged ? parseFloat(statementInterestCharged) : null,
          principal_paid: statementPrincipalPaid ? parseFloat(statementPrincipalPaid) : null,
          fees_charged: statementFeesCharged ? parseFloat(statementFeesCharged) : null,
          new_charges: statementNewCharges ? parseFloat(statementNewCharges) : null,
          payments_made: statementPaymentsMade ? parseFloat(statementPaymentsMade) : null,
          notes: statementNotes || null,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add statement')
      }

      await loadStatements(selectedCredit.id)
      await loadCredits()
      resetStatementForm()
    } catch (error) {
      console.error('Error adding statement:', error)
      alert('Error adding statement. Please try again.')
    }
  }

  const handleImportCSV = async (creditId: string, file: File) => {
    try {
      // This is a placeholder for CSV import functionality
      // You would need to implement CSV parsing logic here
      alert('CSV import functionality will be implemented. For now, please add statements manually.')
    } catch (error) {
      console.error('Error importing CSV:', error)
      alert('Error importing statements. Please try again.')
    }
  }

  const resetAddForm = () => {
    setNewCreditName('')
    setNewCreditType('credit_card')
    setNewInstitution('')
    setNewAccountNumber('')
    setNewOriginalAmount('')
    setNewCurrentBalance('')
    setNewInterestRate('')
    setNewStartDate('')
    setNewMaturityDate('')
    setNewMinimumPayment('')
    setNewPaymentDueDay('')
    setNewCurrency('USD')
    setNewColor('#ef4444')
    setNewNotes('')
  }

  const openEditDialog = (credit: Credit) => {
    setEditingCredit(credit)
    setEditCreditName(credit.name)
    setEditCreditType(credit.type)
    setEditInstitution(credit.institution || '')
    setEditAccountNumber(credit.account_number || '')
    setEditOriginalAmount(credit.original_amount.toString())
    setEditCurrentBalance(credit.current_balance.toString())
    setEditInterestRate(credit.interest_rate.toString())
    setEditStartDate(credit.start_date || '')
    setEditMaturityDate(credit.maturity_date || '')
    setEditMinimumPayment(credit.minimum_payment?.toString() || '')
    setEditPaymentDueDay(credit.payment_due_day?.toString() || '')
    setEditCurrency(credit.currency || 'USD')
    setEditColor(credit.color)
    setEditNotes(credit.notes || '')
    setIsEditDialogOpen(true)
  }

  const resetEditForm = () => {
    setEditingCredit(null)
    setEditCreditName('')
    setEditCreditType('credit_card')
    setEditInstitution('')
    setEditAccountNumber('')
    setEditOriginalAmount('')
    setEditCurrentBalance('')
    setEditInterestRate('')
    setEditStartDate('')
    setEditMaturityDate('')
    setEditMinimumPayment('')
    setEditPaymentDueDay('')
    setEditCurrency('USD')
    setEditColor('#ef4444')
    setEditNotes('')
  }

  const handleEditCredit = async () => {
    if (!editingCredit) return

    if (!editCreditName.trim()) {
      alert('Credit name is required')
      return
    }

    if (!editOriginalAmount || parseFloat(editOriginalAmount) <= 0) {
      alert('Original amount is required')
      return
    }

    if (!editCurrentBalance || parseFloat(editCurrentBalance) <= 0) {
      alert('Current balance is required')
      return
    }

    if (!editInterestRate || parseFloat(editInterestRate) < 0) {
      alert('Interest rate is required')
      return
    }

    try {
      const response = await fetch('/api/credits', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingCredit.id,
          name: editCreditName,
          type: editCreditType,
          institution: editInstitution || null,
          account_number: editAccountNumber || null,
          original_amount: parseFloat(editOriginalAmount),
          current_balance: parseFloat(editCurrentBalance),
          interest_rate: parseFloat(editInterestRate),
          start_date: editStartDate || null,
          maturity_date: editMaturityDate || null,
          minimum_payment: editMinimumPayment ? parseFloat(editMinimumPayment) : null,
          payment_due_day: editPaymentDueDay ? parseInt(editPaymentDueDay) : null,
          currency: editCurrency,
          color: editColor,
          notes: editNotes || null,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update credit')
      }

      await loadCredits()
      resetEditForm()
      setIsEditDialogOpen(false)
    } catch (error) {
      console.error('Error updating credit:', error)
      alert('Error updating credit. Please try again.')
    }
  }

  const resetStatementForm = () => {
    setStatementDate('')
    setStatementBalance('')
    setStatementInterestRate('')
    setStatementMinPayment('')
    setStatementDueDate('')
    setStatementInterestCharged('')
    setStatementPrincipalPaid('')
    setStatementFeesCharged('')
    setStatementNewCharges('')
    setStatementPaymentsMade('')
    setStatementNotes('')
  }

  const openStatementsDialog = async (credit: Credit) => {
    setSelectedCredit(credit)
    await loadStatements(credit.id)
    setIsStatementsDialogOpen(true)
  }

  const addCreditFormContent = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Credit Name *</Label>
        <Input 
          placeholder="e.g., Chase Freedom" 
          value={newCreditName}
          onChange={(e) => setNewCreditName(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Type *</Label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
          value={newCreditType}
          onChange={(e) => setNewCreditType(e.target.value as CreditType)}
        >
          <option value="credit_card">Credit Card</option>
          <option value="mortgage">Mortgage</option>
          <option value="personal_loan">Personal Loan</option>
          <option value="auto_loan">Auto Loan</option>
          <option value="student_loan">Student Loan</option>
          <option value="line_of_credit">Line of Credit</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Original Amount *</Label>
          <Input 
            type="number" 
            step="0.01" 
            placeholder="0.00" 
            value={newOriginalAmount}
            onChange={(e) => setNewOriginalAmount(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Current Balance *</Label>
          <Input 
            type="number" 
            step="0.01" 
            placeholder="0.00" 
            value={newCurrentBalance}
            onChange={(e) => setNewCurrentBalance(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Interest Rate (%) *</Label>
        <Input 
          type="number" 
          step="0.01" 
          placeholder="e.g., 4.5" 
          value={newInterestRate}
          onChange={(e) => setNewInterestRate(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Institution</Label>
        <Input 
          placeholder="e.g., Chase Bank" 
          value={newInstitution}
          onChange={(e) => setNewInstitution(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Account Number</Label>
        <Input 
          placeholder="e.g., ****1234" 
          value={newAccountNumber}
          onChange={(e) => setNewAccountNumber(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Input 
            type="date" 
            value={newStartDate}
            onChange={(e) => setNewStartDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Maturity Date</Label>
          <Input 
            type="date" 
            value={newMaturityDate}
            onChange={(e) => setNewMaturityDate(e.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Minimum Payment</Label>
          <Input 
            type="number" 
            step="0.01" 
            placeholder="0.00" 
            value={newMinimumPayment}
            onChange={(e) => setNewMinimumPayment(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Payment Due Day</Label>
          <Input 
            type="number" 
            min="1" 
            max="31" 
            placeholder="e.g., 15" 
            value={newPaymentDueDay}
            onChange={(e) => setNewPaymentDueDay(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Color</Label>
        <Input 
          type="color" 
          value={newColor}
          onChange={(e) => setNewColor(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Currency</Label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
          value={newCurrency}
          onChange={(e) => setNewCurrency(e.target.value)}
        >
          <option value="USD">USD - US Dollar ($)</option>
          <option value="CRC">CRC - Costa Rican Colón (₡)</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label>Notes</Label>
        <Input 
          placeholder="Additional notes" 
          value={newNotes}
          onChange={(e) => setNewNotes(e.target.value)}
        />
      </div>
    </div>
  )

  const editCreditFormContent = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Credit Name *</Label>
        <Input 
          placeholder="e.g., Chase Freedom" 
          value={editCreditName}
          onChange={(e) => setEditCreditName(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Type *</Label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
          value={editCreditType}
          onChange={(e) => setEditCreditType(e.target.value as CreditType)}
        >
          <option value="credit_card">Credit Card</option>
          <option value="mortgage">Mortgage</option>
          <option value="personal_loan">Personal Loan</option>
          <option value="auto_loan">Auto Loan</option>
          <option value="student_loan">Student Loan</option>
          <option value="line_of_credit">Line of Credit</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Original Amount *</Label>
          <Input 
            type="number" 
            step="0.01" 
            placeholder="0.00" 
            value={editOriginalAmount}
            onChange={(e) => setEditOriginalAmount(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Current Balance *</Label>
          <Input 
            type="number" 
            step="0.01" 
            placeholder="0.00" 
            value={editCurrentBalance}
            onChange={(e) => setEditCurrentBalance(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Interest Rate (%) *</Label>
        <Input 
          type="number" 
          step="0.01" 
          placeholder="e.g., 4.5" 
          value={editInterestRate}
          onChange={(e) => setEditInterestRate(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Institution</Label>
        <Input 
          placeholder="e.g., Chase Bank" 
          value={editInstitution}
          onChange={(e) => setEditInstitution(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Account Number</Label>
        <Input 
          placeholder="e.g., ****1234" 
          value={editAccountNumber}
          onChange={(e) => setEditAccountNumber(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Input 
            type="date" 
            value={editStartDate}
            onChange={(e) => setEditStartDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Maturity Date</Label>
          <Input 
            type="date" 
            value={editMaturityDate}
            onChange={(e) => setEditMaturityDate(e.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Minimum Payment</Label>
          <Input 
            type="number" 
            step="0.01" 
            placeholder="0.00" 
            value={editMinimumPayment}
            onChange={(e) => setEditMinimumPayment(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Payment Due Day</Label>
          <Input 
            type="number" 
            min="1" 
            max="31" 
            placeholder="e.g., 15" 
            value={editPaymentDueDay}
            onChange={(e) => setEditPaymentDueDay(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Color</Label>
        <Input 
          type="color" 
          value={editColor}
          onChange={(e) => setEditColor(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Currency</Label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
          value={editCurrency}
          onChange={(e) => setEditCurrency(e.target.value)}
        >
          <option value="USD">USD - US Dollar ($)</option>
          <option value="CRC">CRC - Costa Rican Colón (₡)</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label>Notes</Label>
        <Input 
          placeholder="Additional notes" 
          value={editNotes}
          onChange={(e) => setEditNotes(e.target.value)}
        />
      </div>
    </div>
  )

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Credits & Loans</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Track mortgages, loans, credit cards, and other debts
          </p>
        </div>
        
        {isLargeScreen ? (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Add Credit/Loan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Credit/Loan</DialogTitle>
                <DialogDescription>
                  Add a credit card, mortgage, loan, or other debt to track
                </DialogDescription>
              </DialogHeader>
              {addCreditFormContent}
              <Button className="w-full" onClick={handleAddCredit}>Add Credit</Button>
            </DialogContent>
          </Dialog>
        ) : (
          <Drawer open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DrawerTrigger asChild>
              <Button className="gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Add Credit/Loan
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Add New Credit/Loan</DrawerTitle>
                <DrawerDescription>
                  Add a credit card, mortgage, loan, or other debt to track
                </DrawerDescription>
              </DrawerHeader>
              <div className="px-4 pb-4 overflow-y-auto flex-1">
                {addCreditFormContent}
              </div>
              <DrawerFooter>
                <Button className="w-full" onClick={handleAddCredit}>Add Credit</Button>
                <DrawerClose asChild>
                  <Button variant="outline" className="w-full">Cancel</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Debt</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalDebtUSD, 'USD')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Original Amount</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalOriginalUSD, 'USD')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalMinPaymentsUSD, 'USD')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Interest Rate</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgInterestRate.toFixed(2)}%</div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading credits...</p>
        </div>
      ) : creditsList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No credits or loans added yet</p>
            <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Credit
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {creditsList.map((credit) => {
            const Icon = creditTypeIcons[credit.type]
            const percentPaid = ((credit.original_amount - credit.current_balance) / credit.original_amount) * 100

            return (
              <Card key={credit.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => openStatementsDialog(credit)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${credit.color}20` }}
                      >
                        <Icon className="h-5 w-5" style={{ color: credit.color }} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{credit.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {creditTypeLabels[credit.type]}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation()
                        openEditDialog(credit)
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Current Balance</span>
                    <div className="text-right">
                      {credit.currency !== 'USD' && (
                        <div className="text-xs text-muted-foreground mb-0.5">
                          {getCurrencySymbol(credit.currency)}{credit.current_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      )}
                      <span className="font-semibold text-lg">
                        {formatCurrency(convertToUSD(credit.current_balance, credit.currency), 'USD')}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Interest Rate</span>
                    <Badge variant="secondary">{credit.interest_rate}% APR</Badge>
                  </div>
                  {credit.minimum_payment && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Min Payment</span>
                      <div className="text-right">
                        {credit.currency !== 'USD' && (
                          <div className="text-xs text-muted-foreground">
                            {getCurrencySymbol(credit.currency)}{credit.minimum_payment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        )}
                        <span className="font-medium">
                          {formatCurrency(convertToUSD(credit.minimum_payment, credit.currency), 'USD')}
                        </span>
                      </div>
                    </div>
                  )}
                  {credit.payment_due_day && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Due Day</span>
                      <span className="font-medium">Day {credit.payment_due_day}</span>
                    </div>
                  )}
                  {credit.institution && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Institution</span>
                      <span className="text-sm">{credit.institution}</span>
                    </div>
                  )}
                  <div className="pt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Paid off</span>
                      <span className="font-medium">{percentPaid.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all"
                        style={{ 
                          width: `${Math.min(percentPaid, 100)}%`,
                          backgroundColor: credit.color 
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Statements Dialog */}
      {selectedCredit && (
        <Dialog open={isStatementsDialogOpen} onOpenChange={setIsStatementsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>{selectedCredit.name} - Statements</DialogTitle>
              <DialogDescription>
                View and manage monthly statements for this credit account
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="statements" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="statements">Statements</TabsTrigger>
                <TabsTrigger value="add">Add Statement</TabsTrigger>
              </TabsList>
              
              <TabsContent value="statements" className="flex-1 overflow-y-auto">
                {statements.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No statements recorded yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {statements.map((statement) => (
                      <Card key={statement.id}>
                        <CardHeader>
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-base">
                              {new Date(statement.statement_date).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </CardTitle>
                            <span className="text-lg font-bold">{getCurrencySymbol(selectedCredit.currency)}{statement.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                          {statement.interest_rate !== null && (
                            <div>
                              <span className="text-muted-foreground">Interest Rate:</span>
                              <span className="ml-2 font-medium">{statement.interest_rate}%</span>
                            </div>
                          )}
                          {statement.minimum_payment !== null && (
                            <div>
                              <span className="text-muted-foreground">Min Payment:</span>
                              <span className="ml-2 font-medium">{getCurrencySymbol(selectedCredit.currency)}{statement.minimum_payment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          )}
                          {statement.interest_charged !== null && (
                            <div>
                              <span className="text-muted-foreground">Interest:</span>
                              <span className="ml-2 font-medium">{getCurrencySymbol(selectedCredit.currency)}{statement.interest_charged.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          )}
                          {statement.principal_paid !== null && (
                            <div>
                              <span className="text-muted-foreground">Principal:</span>
                              <span className="ml-2 font-medium">{getCurrencySymbol(selectedCredit.currency)}{statement.principal_paid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          )}
                          {statement.payments_made !== null && (
                            <div>
                              <span className="text-muted-foreground">Payments:</span>
                              <span className="ml-2 font-medium">{getCurrencySymbol(selectedCredit.currency)}{statement.payments_made.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          )}
                          {statement.new_charges !== null && (
                            <div>
                              <span className="text-muted-foreground">New Charges:</span>
                              <span className="ml-2 font-medium">{getCurrencySymbol(selectedCredit.currency)}{statement.new_charges.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          )}
                          {statement.fees_charged !== null && statement.fees_charged > 0 && (
                            <div>
                              <span className="text-muted-foreground">Fees:</span>
                              <span className="ml-2 font-medium">{getCurrencySymbol(selectedCredit.currency)}{statement.fees_charged.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="add" className="flex-1 overflow-y-auto">
                <div className="space-y-4 px-1">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Statement Date *</Label>
                      <Input 
                        type="date" 
                        value={statementDate}
                        onChange={(e) => setStatementDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Balance *</Label>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        value={statementBalance}
                        onChange={(e) => setStatementBalance(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Interest Rate (%)</Label>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="e.g., 4.5" 
                        value={statementInterestRate}
                        onChange={(e) => setStatementInterestRate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Minimum Payment</Label>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        value={statementMinPayment}
                        onChange={(e) => setStatementMinPayment(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Due Date</Label>
                    <Input 
                      type="date" 
                      value={statementDueDate}
                      onChange={(e) => setStatementDueDate(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Interest Charged</Label>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        value={statementInterestCharged}
                        onChange={(e) => setStatementInterestCharged(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Principal Paid</Label>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        value={statementPrincipalPaid}
                        onChange={(e) => setStatementPrincipalPaid(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Fees Charged</Label>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        value={statementFeesCharged}
                        onChange={(e) => setStatementFeesCharged(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>New Charges</Label>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        value={statementNewCharges}
                        onChange={(e) => setStatementNewCharges(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Payments Made</Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
                      value={statementPaymentsMade}
                      onChange={(e) => setStatementPaymentsMade(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Input 
                      placeholder="Additional notes" 
                      value={statementNotes}
                      onChange={(e) => setStatementNotes(e.target.value)}
                    />
                  </div>
                  <Button className="w-full" onClick={handleAddStatement}>Add Statement</Button>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Credit Dialog */}
      {isLargeScreen ? (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Credit/Loan</DialogTitle>
              <DialogDescription>
                Update the details of your credit account
              </DialogDescription>
            </DialogHeader>
            {editCreditFormContent}
            <Button className="w-full" onClick={handleEditCredit}>Save Changes</Button>
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Edit Credit/Loan</DrawerTitle>
              <DrawerDescription>
                Update the details of your credit account
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-4 overflow-y-auto flex-1">
              {editCreditFormContent}
            </div>
            <DrawerFooter>
              <Button className="w-full" onClick={handleEditCredit}>Save Changes</Button>
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
