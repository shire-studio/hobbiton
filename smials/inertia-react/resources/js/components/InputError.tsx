import { cn } from '@/lib/utils'

type Props = {
  message?: string
  className?: string
}

export default function InputError({ message, className }: Props) {
  if (!message) {
    return null
  }

  return (
    <div className={className}>
      <p className={cn('text-sm text-red-600 dark:text-red-500')}>{message}</p>
    </div>
  )
}
