<script lang="ts">
  import { Link } from '@inertiajs/svelte'
  import AppLogo from '@/components/AppLogo.svelte'
  import NavFooter from '@/components/NavFooter.svelte'
  import NavMain from '@/components/NavMain.svelte'
  import NavUser from '@/components/NavUser.svelte'
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
</script>

<Sidebar collapsible="icon" variant="inset">
  <SidebarHeader>
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" asChild>
          {#snippet children(props)}
            <Link {...props} href={dashboard()} class={props.class}>
              <AppLogo />
            </Link>
          {/snippet}
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
