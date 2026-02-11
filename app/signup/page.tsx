'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { seedDefaultExpenseGroups, seedDefaultPlanItems, seedTestData } from '@/lib/seed-data'
import { Checkbox } from '@/components/ui/checkbox'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [createTestData, setCreateTestData] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [setupMessage, setSetupMessage] = useState('')
  const { signUp } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    const { error } = await signUp(email, password)

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      // Get the user ID to seed data
      try {
        setSetupMessage('Creating your account...')
        
        // Import auth client to get user
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          setSetupMessage('Setting up expense groups and categories...')
          const { expenseGroups, categoryMap } = await seedDefaultExpenseGroups(user.id)
          console.log('Created expense groups:', expenseGroups?.length || 0)
          console.log('Created expense categories:', Object.keys(categoryMap).length)
          
          setSetupMessage('Creating plan items...')
          const { planItemsCount } = await seedDefaultPlanItems(user.id, categoryMap)
          console.log('Created plan items:', planItemsCount)
          
          if (createTestData) {
            setSetupMessage('Creating test accounts and transactions...')
            const { accounts, transactionCount } = await seedTestData(user.id, categoryMap)
            console.log('Created test accounts:', accounts?.length || 0)
            console.log('Created test transactions:', transactionCount)
          }
        }
        
        setSuccess(true)
        setSetupMessage('All set! Redirecting...')
        setLoading(false)
        
        // Auto-redirect after successful signup
        setTimeout(() => {
          router.push('/platform')
        }, 2000)
      } catch (seedError) {
        console.error('Error seeding data:', seedError)
        // Still redirect even if seeding fails
        setSuccess(true)
        setSetupMessage('Account created! Redirecting...')
        setLoading(false)
        setTimeout(() => {
          router.push('/platform')
        }, 2000)
      }
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-green-600">Success!</CardTitle>
            <CardDescription>
              {setupMessage || 'Your account has been created. Redirecting to your dashboard...'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>
            Enter your details to create your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="flex items-start space-x-3 py-2">
              <Checkbox
                id="testData"
                checked={createTestData}
                onCheckedChange={(checked) => setCreateTestData(checked as boolean)}
                disabled={loading}
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="testData"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Create test data
                </Label>
                <p className="text-sm text-muted-foreground">
                  Populate your account with sample accounts and transactions to explore the app
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
            <p className="text-sm text-center text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

