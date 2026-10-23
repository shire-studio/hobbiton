import { ChevronsUpDown } from 'lucide-react'
import { useSidebar } from '@/components/ui/sidebar'

export default function NavUser() {
  const user = usePage().props.auth.user!
  const { isMobile, state } = useSidebar()

  return (
    <UiSidebarMenu>
      <UiSidebarMenuItem>
        <UiDropdownMenu>
          <UiDropdownMenuTrigger asChild>
            <UiSidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              data-test="sidebar-menu-button"
            >
              <UserInfo user={user} />
              <ChevronsUpDown className="ml-auto size-4" />
            </UiSidebarMenuButton>
          </UiDropdownMenuTrigger>
          <UiDropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={
              isMobile ? 'bottom' : state === 'collapsed' ? 'left' : 'bottom'
            }
            align="end"
            sideOffset={4}
          >
            <UserMenuContent user={user} />
          </UiDropdownMenuContent>
        </UiDropdownMenu>
      </UiSidebarMenuItem>
    </UiSidebarMenu>
  )
}
