import { extraNavItems, mainNavItems } from '@/lib/navigation'
import { dashboard } from '@/routes'

export default function AppSidebar() {
  return (
    <UiSidebar collapsible="icon" variant="inset">
      <UiSidebarHeader>
        <UiSidebarMenu>
          <UiSidebarMenuItem>
            <UiSidebarMenuButton size="lg" asChild>
              <Link href={dashboard()}>
                <AppLogo />
              </Link>
            </UiSidebarMenuButton>
          </UiSidebarMenuItem>
        </UiSidebarMenu>
      </UiSidebarHeader>

      <UiSidebarContent>
        <NavMain items={mainNavItems} />
      </UiSidebarContent>

      <UiSidebarFooter>
        <NavFooter items={extraNavItems} />
        <NavUser />
      </UiSidebarFooter>
    </UiSidebar>
  )
}
