import type { ReactNode } from 'react'
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
      <UiToaster />
    </AppShell>
  )
}
