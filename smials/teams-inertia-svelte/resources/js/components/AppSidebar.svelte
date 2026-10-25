<script lang="ts">
  import { dashboardUrl, extraNavItems, mainNavItems } from '@/lib/navigation'

  const teamSlug = $derived(page.props.currentTeam?.slug)
</script>

<UiSidebar collapsible="icon" variant="inset">
  <UiSidebarHeader>
    <UiSidebarMenu>
      <UiSidebarMenuItem>
        <UiSidebarMenuButton size="lg" asChild>
          {#snippet children(props)}
            <Link {...props} href={dashboardUrl(teamSlug)} class={props.class}>
              <AppLogo />
            </Link>
          {/snippet}
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
