import type { ReactNode } from 'react'
import { home } from '@/routes'

type Props = {
  title?: string
  description?: string
  children: ReactNode
}

export default function AuthSplitLayout({
  title,
  description,
  children,
}: Props) {
  const { name } = usePage().props

  return (
    <div className="relative grid h-dvh flex-col items-center justify-center px-8 sm:px-0 lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-zinc-900" />
        <Link
          href={home()}
          className="relative z-20 flex items-center text-lg font-medium"
        >
          <AppLogoIcon className="mr-2 size-8 fill-current text-white" />
          {name}
        </Link>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            {title && (
              <h1 className="text-xl font-medium tracking-tight">{title}</h1>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
