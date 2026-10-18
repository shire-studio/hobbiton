import type { ReactNode } from 'react'
import AppContent from '@/components/AppContent'
import AppShell from '@/components/AppShell'
import AppSidebar from '@/components/AppSidebar'
import AppSidebarHeader from '@/components/AppSidebarHeader'
import { Toaster } from '@/components/ui/sonner'
import type { BreadcrumbItem } from '@/types'

type Props = {
  breadcrumbs?: BreadcrumbItem[]
  children: ReactNode
}

export default function AppSidebarLayout({
  breadcrumbs = [],
  children,
}: Props) {
  return (
    <AppShell variant="sidebar">
      <AppSidebar />
      <AppContent variant="sidebar" className="min-w-0 overflow-x-clip">
        <AppSidebarHeader breadcrumbs={breadcrumbs} />
        {children}
      </AppContent>
      <Toaster />
    </AppShell>
  )
}
