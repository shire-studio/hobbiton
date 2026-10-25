<script lang="ts">
  import { ChevronsUpDown } from '@lucide/svelte'
  import { useSidebar } from '@/components/ui/sidebar'

  const user = $derived(page.props.auth.user!)
  const currentTeam = $derived(page.props.currentTeam)
  const { isMobile, state: sidebarState } = useSidebar()
</script>

<UiSidebarMenu>
  <UiSidebarMenuItem>
    <UiDropdownMenu class="w-full">
      <UiDropdownMenuTrigger asChild>
        {#snippet children(props)}
          <UiSidebarMenuButton
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            data-test="sidebar-menu-button"
            onclick={props.onclick}
            aria-expanded={props['aria-expanded']}
            data-state={props['data-state']}
          >
            <UserInfo {user} team={currentTeam} />
            <ChevronsUpDown class="ml-auto size-4" />
          </UiSidebarMenuButton>
        {/snippet}
      </UiDropdownMenuTrigger>
      <UiDropdownMenuContent
        class="w-full min-w-56 rounded-lg"
        side={$isMobile
          ? 'bottom'
          : $sidebarState === 'collapsed'
            ? 'left'
            : 'bottom'}
        align="end"
        sideOffset={4}
      >
        <UserMenuContent {user} />
      </UiDropdownMenuContent>
    </UiDropdownMenu>
  </UiSidebarMenuItem>
</UiSidebarMenu>
