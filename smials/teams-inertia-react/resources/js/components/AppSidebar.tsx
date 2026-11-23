import { dashboardUrl, extraNavItems, mainNavItems } from '@/lib/navigation'

export default function AppSidebar() {
  const teamSlug = usePage().props.currentTeam?.slug

  return (
    <UiSidebar collapsible="icon" variant="inset">
      <UiSidebarHeader>
        <UiSidebarMenu>
          <UiSidebarMenuItem>
            <UiSidebarMenuButton size="lg" asChild>
              <Link href={dashboardUrl(teamSlug)}>
                <AppLogo />
              </Link>
            </UiSidebarMenuButton>
          </UiSidebarMenuItem>
        </UiSidebarMenu>
        <UiSidebarMenu>
          <UiSidebarMenuItem>
            <TeamSwitcher />
          </UiSidebarMenuItem>
        </UiSidebarMenu>
      </UiSidebarHeader>

      <UiSidebarContent>
        <NavMain items={mainNavItems(teamSlug)} />
      </UiSidebarContent>

      <UiSidebarFooter>
        <NavFooter items={extraNavItems} />
        <NavUser />
      </UiSidebarFooter>
    </UiSidebar>
  )
}
