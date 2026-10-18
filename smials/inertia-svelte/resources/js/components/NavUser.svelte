<script lang="ts">
  import { ChevronsUpDown } from '@lucide/svelte'
  import UserInfo from '@/components/UserInfo.svelte'
  import UserMenuContent from '@/components/UserMenuContent.svelte'
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
  } from '@/components/ui/dropdown-menu'
  import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
  } from '@/components/ui/sidebar'

  const user = $derived(page.props.auth.user!)
  const { isMobile, state: sidebarState } = useSidebar()
</script>

<SidebarMenu>
  <SidebarMenuItem>
    <DropdownMenu class="w-full">
      <DropdownMenuTrigger asChild>
        {#snippet children(props)}
          <SidebarMenuButton
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            data-test="sidebar-menu-button"
            onclick={props.onclick}
            aria-expanded={props['aria-expanded']}
            data-state={props['data-state']}
          >
            <UserInfo {user} />
            <ChevronsUpDown class="ml-auto size-4" />
          </SidebarMenuButton>
        {/snippet}
      </DropdownMenuTrigger>
      <DropdownMenuContent
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
      </DropdownMenuContent>
    </DropdownMenu>
  </SidebarMenuItem>
</SidebarMenu>
