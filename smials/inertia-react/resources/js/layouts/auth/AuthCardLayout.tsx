import type { ReactNode } from 'react'
import { home } from '@/routes'

type Props = {
  title?: string
  description?: string
  children: ReactNode
}

export default function AuthCardLayout({
  title,
  description,
  children,
}: Props) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-md flex-col gap-6">
        <Link
          href={home()}
          className="flex items-center gap-2 self-center font-medium"
        >
          <div className="flex h-9 w-9 items-center justify-center">
            <AppLogoIcon className="size-9 fill-current text-black dark:text-white" />
          </div>
        </Link>

        <div className="flex flex-col gap-6">
          <UiCard className="rounded-xl">
            <UiCardHeader className="px-10 pt-8 pb-0 text-center">
              <UiCardTitle className="text-xl">{title}</UiCardTitle>
              <UiCardDescription>{description}</UiCardDescription>
            </UiCardHeader>
            <UiCardContent className="px-10 py-8">{children}</UiCardContent>
          </UiCard>
        </div>
      </div>
    </div>
  )
}
