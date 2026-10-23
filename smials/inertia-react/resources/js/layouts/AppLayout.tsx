import type { ReactNode } from 'react'
import type { BreadcrumbItem } from '@/types'

type Props = {
  breadcrumbs?: BreadcrumbItem[]
  children: ReactNode
}

export default function AppLayout({ breadcrumbs = [], children }: Props) {
  return (
    <AppSidebarLayout breadcrumbs={breadcrumbs}>{children}</AppSidebarLayout>
  )
}
