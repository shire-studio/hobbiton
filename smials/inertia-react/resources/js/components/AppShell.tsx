import type { ReactNode } from 'react'
import type { AppVariant } from '@/types'

type Props = {
  variant?: AppVariant
  children: ReactNode
}

export default function AppShell({ variant = 'sidebar', children }: Props) {
  const isOpen = usePage().props.sidebarOpen

  if (variant === 'header') {
    return <div className="flex min-h-screen w-full flex-col">{children}</div>
  }

  return <UiSidebarProvider defaultOpen={isOpen}>{children}</UiSidebarProvider>
}
