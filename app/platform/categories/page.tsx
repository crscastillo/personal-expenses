'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function CategoriesPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the new expense-groups page
    router.replace('/platform/expense-groups')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">Redirecting to Expense Groups...</p>
      </div>
    </div>
  )
}
