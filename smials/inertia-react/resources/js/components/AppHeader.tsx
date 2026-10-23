import { Menu, Search } from 'lucide-react'
import { navigationMenuTriggerStyle } from '@/components/ui/navigation-menu'
import { extraNavItems, mainNavItems } from '@/lib/navigation'
import { cn, toUrl } from '@/lib/utils'
import { dashboard } from '@/routes'
import type { BreadcrumbItem } from '@/types'

type Props = {
  breadcrumbs?: BreadcrumbItem[]
}

const activeItemStyles =
  'text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'

export default function AppHeader({ breadcrumbs = [] }: Props) {
  const user = usePage().props.auth.user!
  const { isCurrentUrl, whenCurrentUrl } = useCurrentUrl()

  return (
    <div>
      <div className="border-b border-sidebar-border/80">
        <div className="mx-auto flex h-16 items-center px-4 md:max-w-7xl">
          {/* Mobile Menu */}
          <div className="lg:hidden">
            <UiSheet>
              <UiSheetTrigger asChild>
                <UiButton variant="ghost" size="icon" className="mr-2 h-9 w-9">
                  <Menu className="h-5 w-5" />
                </UiButton>
              </UiSheetTrigger>
              <UiSheetContent side="left" className="w-[300px] p-6">
                <UiSheetTitle className="sr-only">Navigation menu</UiSheetTitle>
                <UiSheetHeader className="flex justify-start text-left">
                  <AppLogoIcon className="size-6 fill-current text-black dark:text-white" />
                </UiSheetHeader>
                <div className="flex h-full flex-1 flex-col justify-between space-y-4 py-6">
                  <nav className="-mx-3 space-y-1">
                    {mainNavItems.map((item) => (
                      <Link
                        key={item.title}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-x-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent',
                          whenCurrentUrl(item.href, activeItemStyles),
                        )}
                      >
                        {item.icon && <item.icon className="h-5 w-5" />}
                        {item.title}
                      </Link>
                    ))}
                  </nav>
                  <div className="flex flex-col space-y-4">
                    {extraNavItems.map((item) => (
                      <a
                        key={item.title}
                        href={toUrl(item.href)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-sm font-medium"
                      >
                        {item.icon && <item.icon className="h-5 w-5" />}
                        <span>{item.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </UiSheetContent>
            </UiSheet>
          </div>

          <Link href={dashboard()} className="flex items-center gap-x-2">
            <AppLogo />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden h-full lg:flex lg:flex-1">
            <UiNavigationMenu className="ml-10 flex h-full items-stretch">
              <UiNavigationMenuList className="flex h-full items-stretch space-x-2">
                {mainNavItems.map((item, index) => (
                  <UiNavigationMenuItem
                    key={index}
                    className="relative flex h-full items-center"
                  >
                    <Link
                      className={cn(
                        navigationMenuTriggerStyle(),
                        whenCurrentUrl(item.href, activeItemStyles),
                        'h-9 cursor-pointer px-3',
                      )}
                      href={item.href}
                    >
                      {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                      {item.title}
                    </Link>
                    {isCurrentUrl(item.href) && (
                      <div className="absolute bottom-0 left-0 h-0.5 w-full translate-y-px bg-black dark:bg-white"></div>
                    )}
                  </UiNavigationMenuItem>
                ))}
              </UiNavigationMenuList>
            </UiNavigationMenu>
          </div>

          <div className="ml-auto flex items-center space-x-2">
            <div className="relative flex items-center space-x-1">
              <UiButton
                variant="ghost"
                size="icon"
                className="group h-9 w-9 cursor-pointer"
              >
                <Search className="size-5 opacity-80 group-hover:opacity-100" />
              </UiButton>

              <div className="hidden space-x-1 lg:flex">
                {extraNavItems.map((item) => (
                  <UiTooltipProvider key={item.title} delayDuration={0}>
                    <UiTooltip>
                      <UiTooltipTrigger asChild>
                        <UiButton
                          variant="ghost"
                          size="icon"
                          asChild
                          className="group h-9 w-9 cursor-pointer"
                        >
                          <a
                            href={toUrl(item.href)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <span className="sr-only">{item.title}</span>
                            {item.icon && (
                              <item.icon className="size-5 opacity-80 group-hover:opacity-100" />
                            )}
                          </a>
                        </UiButton>
                      </UiTooltipTrigger>
                      <UiTooltipContent>
                        <p>{item.title}</p>
                      </UiTooltipContent>
                    </UiTooltip>
                  </UiTooltipProvider>
                ))}
              </div>
            </div>

            <UiDropdownMenu>
              <UiDropdownMenuTrigger asChild>
                <UiButton
                  variant="ghost"
                  size="icon"
                  className="relative size-10 w-auto rounded-full p-1 focus-within:ring-2 focus-within:ring-primary"
                >
                  <UiAvatar className="size-8 overflow-hidden rounded-full">
                    <UiAvatarFallback className="rounded-lg bg-neutral-200 font-semibold text-black dark:bg-neutral-700 dark:text-white">
                      {getInitials(user.name)}
                    </UiAvatarFallback>
                  </UiAvatar>
                </UiButton>
              </UiDropdownMenuTrigger>
              <UiDropdownMenuContent align="end" className="w-56">
                <UserMenuContent user={user} />
              </UiDropdownMenuContent>
            </UiDropdownMenu>
          </div>
        </div>
      </div>

      {breadcrumbs.length > 1 && (
        <div className="flex w-full border-b border-sidebar-border/70">
          <div className="mx-auto flex h-12 w-full items-center justify-start px-4 text-neutral-500 md:max-w-7xl">
            <Breadcrumbs breadcrumbs={breadcrumbs} />
          </div>
        </div>
      )}
    </div>
  )
}
