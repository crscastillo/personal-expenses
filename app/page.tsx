import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet, TrendingUp, PieChart, Target, DollarSign, Shield } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <nav className="flex justify-between items-center mb-16">
          <div className="flex items-center gap-2">
            <Wallet className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold">Personal Expenses</span>
          </div>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </nav>

        <div className="text-center max-w-3xl mx-auto mb-20">
          <h1 className="text-5xl font-bold mb-6 text-gray-900">
            Master Your Money with<br />Conscious Spending
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Build a guilt-free spending plan that aligns with your values. Track expenses,
            manage budgets, and achieve financial freedom with our intuitive platform.
          </p>
          <Link href="/signup">
            <Button size="lg" className="text-lg px-8 py-6">
              Start Your Free Budget
            </Button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <Card>
            <CardHeader>
              <PieChart className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Smart Budgeting</CardTitle>
              <CardDescription>
                Create budgets based on the conscious spending methodology. Allocate
                your money to what truly matters.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <TrendingUp className="h-12 w-12 text-green-600 mb-4" />
              <CardTitle>Track Everything</CardTitle>
              <CardDescription>
                Import transactions, categorize spending, and see exactly where your
                money goes each month.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Target className="h-12 w-12 text-purple-600 mb-4" />
              <CardTitle>Achieve Goals</CardTitle>
              <CardDescription>
                Set financial goals for savings, investments, and guilt-free spending.
                Watch your progress in real-time.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* How It Works */}
        <div className="max-w-4xl mx-auto mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="space-y-8">
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Connect Your Accounts</h3>
                <p className="text-gray-600">
                  Add your bank accounts and credit cards. Import transactions with QIF files
                  or enter them manually.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Create Your Budget</h3>
                <p className="text-gray-600">
                  Define categories for fixed costs, investments, savings, and guilt-free
                  spending. Set amounts that work for your lifestyle.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Track & Optimize</h3>
                <p className="text-gray-600">
                  Monitor your spending with beautiful charts and reports. Make adjustments
                  and watch your financial health improve.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Take Control of Your Finances?</h2>
          <p className="text-xl mb-8 text-blue-50">
            Join thousands of people building better financial habits
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
              Create Your Free Account
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
