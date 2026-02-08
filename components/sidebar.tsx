'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Wallet, CreditCard, Settings, PiggyBank, FolderTree } from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/app', icon: LayoutDashboard },
  { name: 'Budgets', href: '/app/budgets', icon: PiggyBank },
  { name: 'Accounts', href: '/app/accounts', icon: Wallet },
  { name: 'Transactions', href: '/app/transactions', icon: CreditCard },
  { name: 'Categories', href: '/app/categories', icon: FolderTree },
  { name: 'Settings', href: '/app/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col border-r bg-muted/10">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold">Personal Expenses</h1>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
      <div className="border-t p-4">
        <div className="text-xs text-muted-foreground">
          Conscious Spending Plan
          <br />
          <span className="text-[10px]">Inspired by Ramit Sethi</span>
        </div>
      </div>
    </div>
  )
}
