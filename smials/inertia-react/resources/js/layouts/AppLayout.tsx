import type { ReactNode } from 'react'
import AppSidebarLayout from '@/layouts/app/AppSidebarLayout'
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
