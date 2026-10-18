import { Link } from '@inertiajs/react'
import AppLogo from '@/components/AppLogo'
import NavFooter from '@/components/NavFooter'
import NavMain from '@/components/NavMain'
import NavUser from '@/components/NavUser'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { extraNavItems, mainNavItems } from '@/lib/navigation'
import { dashboard } from '@/routes'

export default function AppSidebar() {
  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={dashboard()}>
                <AppLogo />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={mainNavItems} />
      </SidebarContent>

      <SidebarFooter>
        <NavFooter items={extraNavItems} />
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
