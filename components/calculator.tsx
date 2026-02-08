'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Calculator as CalculatorIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface CalculatorProps {
  onCalculate: (value: string) => void
}

export function Calculator({ onCalculate }: CalculatorProps) {
  const [display, setDisplay] = useState('0')
  const [previousValue, setPreviousValue] = useState<string | null>(null)
  const [operation, setOperation] = useState<string | null>(null)
  const [newNumber, setNewNumber] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  const handleNumber = (num: string) => {
    if (newNumber) {
      setDisplay(num)
      setNewNumber(false)
    } else {
      setDisplay(display === '0' ? num : display + num)
    }
  }

  const handleDecimal = () => {
    if (newNumber) {
      setDisplay('0.')
      setNewNumber(false)
    } else if (!display.includes('.')) {
      setDisplay(display + '.')
    }
  }

  const handleOperation = (op: string) => {
    const current = parseFloat(display)
    
    if (previousValue !== null && operation && !newNumber) {
      const prev = parseFloat(previousValue)
      let result = prev
      
      switch (operation) {
        case '+':
          result = prev + current
          break
        case '-':
          result = prev - current
          break
        case '×':
          result = prev * current
          break
        case '÷':
          result = prev / current
          break
      }
      
      setDisplay(result.toString())
      setPreviousValue(result.toString())
    } else {
      setPreviousValue(display)
    }
    
    setOperation(op)
    setNewNumber(true)
  }

  const handleEquals = () => {
    if (previousValue !== null && operation) {
      const current = parseFloat(display)
      const prev = parseFloat(previousValue)
      let result = prev
      
      switch (operation) {
        case '+':
          result = prev + current
          break
        case '-':
          result = prev - current
          break
        case '×':
          result = prev * current
          break
        case '÷':
          result = prev / current
          break
      }
      
      const finalResult = result.toFixed(2)
      setDisplay(finalResult)
      onCalculate(finalResult)
      setPreviousValue(null)
      setOperation(null)
      setNewNumber(true)
    }
  }

  const handleClear = () => {
    setDisplay('0')
    setPreviousValue(null)
    setOperation(null)
    setNewNumber(true)
  }

  const handleUse = () => {
    onCalculate(display)
    setIsOpen(false)
  }

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default for calculator keys
      if (/^[0-9+\-*/=.]$/.test(e.key) || e.key === 'Enter' || e.key === 'Escape' || e.key === 'Backspace') {
        e.preventDefault()
      }

      // Numbers
      if (/^[0-9]$/.test(e.key)) {
        handleNumber(e.key)
      }
      
      // Decimal
      if (e.key === '.') {
        handleDecimal()
      }
      
      // Operations
      if (e.key === '+') {
        handleOperation('+')
      }
      if (e.key === '-') {
        handleOperation('-')
      }
      if (e.key === '*') {
        handleOperation('×')
      }
      if (e.key === '/') {
        handleOperation('÷')
      }
      
      // Equals
      if (e.key === 'Enter' || e.key === '=') {
        handleEquals()
      }
      
      // Clear
      if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
        handleClear()
      }
      
      // Backspace
      if (e.key === 'Backspace') {
        if (display.length > 1) {
          setDisplay(display.slice(0, -1))
        } else {
          setDisplay('0')
          setNewNumber(true)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, display, previousValue, operation, newNumber])

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" type="button" className="h-10 w-10">
          <CalculatorIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4">
        <div className="space-y-2">
          <div className="space-y-1">
            <div className="rounded-md bg-muted p-3 text-right text-2xl font-semibold">
              {display}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Keyboard supported • Esc to clear
            </p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <Button variant="outline" onClick={handleClear} className="col-span-2">
              C
            </Button>
            <Button variant="outline" onClick={() => handleOperation('÷')}>
              ÷
            </Button>
            <Button variant="outline" onClick={() => handleOperation('×')}>
              ×
            </Button>
            
            <Button variant="outline" onClick={() => handleNumber('7')}>
              7
            </Button>
            <Button variant="outline" onClick={() => handleNumber('8')}>
              8
            </Button>
            <Button variant="outline" onClick={() => handleNumber('9')}>
              9
            </Button>
            <Button variant="outline" onClick={() => handleOperation('-')}>
              -
            </Button>
            
            <Button variant="outline" onClick={() => handleNumber('4')}>
              4
            </Button>
            <Button variant="outline" onClick={() => handleNumber('5')}>
              5
            </Button>
            <Button variant="outline" onClick={() => handleNumber('6')}>
              6
            </Button>
            <Button variant="outline" onClick={() => handleOperation('+')}>
              +
            </Button>
            
            <Button variant="outline" onClick={() => handleNumber('1')}>
              1
            </Button>
            <Button variant="outline" onClick={() => handleNumber('2')}>
              2
            </Button>
            <Button variant="outline" onClick={() => handleNumber('3')}>
              3
            </Button>
            <Button variant="default" onClick={handleEquals} className="row-span-2">
              =
            </Button>
            
            <Button variant="outline" onClick={() => handleNumber('0')} className="col-span-2">
              0
            </Button>
            <Button variant="outline" onClick={handleDecimal}>
              .
            </Button>
          </div>
          <Button onClick={handleUse} className="w-full">
            Use This Value
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
