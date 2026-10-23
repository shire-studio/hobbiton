<script lang="ts">
  import { extraNavItems, mainNavItems } from '@/lib/navigation'
  import { dashboard } from '@/routes'
</script>

<UiSidebar collapsible="icon" variant="inset">
  <UiSidebarHeader>
    <UiSidebarMenu>
      <UiSidebarMenuItem>
        <UiSidebarMenuButton size="lg" asChild>
          {#snippet children(props)}
            <Link {...props} href={dashboard()} class={props.class}>
              <AppLogo />
            </Link>
          {/snippet}
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
