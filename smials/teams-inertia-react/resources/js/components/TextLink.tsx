import type { Method } from '@inertiajs/core'
import type { InertiaLinkProps } from '@inertiajs/react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  href: NonNullable<InertiaLinkProps['href']>
  tabIndex?: number
  method?: Method
  as?: 'a' | 'button'
  className?: string
  'data-test'?: string
  children: ReactNode
}

export default function TextLink({
  href,
  tabIndex,
  method,
  as,
  className,
  'data-test': dataTest,
  children,
}: Props) {
  return (
    <Link
      href={href}
      tabIndex={tabIndex}
      method={method}
      as={as}
      data-test={dataTest}
      className={cn(
        'text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500',
        className,
      )}
    >
      {children}
    </Link>
  )
}
