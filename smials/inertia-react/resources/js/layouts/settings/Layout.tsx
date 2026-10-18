import { Link } from '@inertiajs/react'
import type { ReactNode } from 'react'
import Heading from '@/components/Heading'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn, toUrl } from '@/lib/utils'
import { edit as editAppearance } from '@/routes/appearance'
import { edit as editSecurity } from '@/routes/password'
import { edit as editProfile } from '@/routes/user-profile'
import type { NavItem } from '@/types'

const sidebarNavItems: NavItem[] = [
  {
    title: 'Profile',
    href: editProfile(),
  },
  {
    title: 'Security',
    href: editSecurity(),
  },
  {
    title: 'Appearance',
    href: editAppearance(),
  },
]

type Props = {
  children: ReactNode
}

export default function SettingsLayout({ children }: Props) {
  const { isCurrentOrParentUrl } = useCurrentUrl()

  return (
    <div className="px-4 py-6">
      <Heading
        title="Settings"
        description="Manage your profile and account settings"
      />

      <div className="flex flex-col lg:flex-row lg:space-x-12">
        <aside className="w-full max-w-xl lg:w-48">
          <nav
            className="flex flex-col space-y-1 space-x-0"
            aria-label="Settings"
          >
            {sidebarNavItems.map((item) => (
              <Button
                key={toUrl(item.href)}
                variant="ghost"
                className={cn('w-full justify-start', {
                  'bg-muted': isCurrentOrParentUrl(item.href),
                })}
                asChild
              >
                <Link href={item.href}>{item.title}</Link>
              </Button>
            ))}
          </nav>
        </aside>

        <Separator className="my-6 lg:hidden" />

        <div className="flex-1 md:max-w-2xl">
          <section className="max-w-xl space-y-12">{children}</section>
        </div>
      </div>
    </div>
  )
}
