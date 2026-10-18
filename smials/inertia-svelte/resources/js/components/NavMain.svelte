<script lang="ts">
  import { Link } from '@inertiajs/svelte'
  import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
  } from '@/components/ui/sidebar'
  import type { NavItem } from '@/types'

  let { items }: { items: NavItem[] } = $props()

  const { isCurrentUrl } = useCurrentUrl()
</script>

<SidebarGroup class="px-2 py-0">
  <SidebarGroupLabel>Platform</SidebarGroupLabel>
  <SidebarMenu>
    {#each items as item (item.title)}
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={isCurrentUrl(item.href)}
          tooltip={item.title}
        >
          {#snippet children(props)}
            <Link {...props} href={item.href} class={props.class}>
              {#if item.icon}
                <item.icon />
              {/if}
              <span>{item.title}</span>
            </Link>
          {/snippet}
        </SidebarMenuButton>
      </SidebarMenuItem>
    {/each}
  </SidebarMenu>
</SidebarGroup>
