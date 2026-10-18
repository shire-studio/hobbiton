import type { ReactNode } from 'react'
import AppContent from '@/components/AppContent'
import AppHeader from '@/components/AppHeader'
import AppShell from '@/components/AppShell'
import { Toaster } from '@/components/ui/sonner'
import type { BreadcrumbItem } from '@/types'

type Props = {
  breadcrumbs?: BreadcrumbItem[]
  children: ReactNode
}

export default function AppHeaderLayout({ breadcrumbs = [], children }: Props) {
  return (
    <AppShell variant="header">
      <AppHeader breadcrumbs={breadcrumbs} />
      <AppContent variant="header">{children}</AppContent>
      <Toaster />
    </AppShell>
  )
}
