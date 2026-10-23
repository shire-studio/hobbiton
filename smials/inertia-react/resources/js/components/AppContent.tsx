import type { ReactNode } from 'react'
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
    return <UiSidebarInset className={className}>{children}</UiSidebarInset>
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
