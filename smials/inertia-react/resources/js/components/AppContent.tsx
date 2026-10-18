import type { ReactNode } from 'react'
import { SidebarInset } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import type { AppVariant } from '@/types'

type Props = {
  variant?: AppVariant
  className?: string
  children: ReactNode
}

export default function AppContent({
  variant = 'sidebar',
  className,
  children,
}: Props) {
  if (variant === 'sidebar') {
    return <SidebarInset className={className}>{children}</SidebarInset>
  }

  return (
    <main
      className={cn(
        'mx-auto flex h-full w-full max-w-7xl flex-1 flex-col gap-4 rounded-xl',
        className,
      )}
    >
      {children}
    </main>
  )
}
