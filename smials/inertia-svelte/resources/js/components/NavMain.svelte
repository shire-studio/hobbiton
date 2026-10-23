<script lang="ts">
  import type { NavItem } from '@/types'

  let { items }: { items: NavItem[] } = $props()

  const { isCurrentUrl } = useCurrentUrl()
</script>

<UiSidebarGroup class="px-2 py-0">
  <UiSidebarGroupLabel>Platform</UiSidebarGroupLabel>
  <UiSidebarMenu>
    {#each items as item (item.title)}
      <UiSidebarMenuItem>
        <UiSidebarMenuButton
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
        </UiSidebarMenuButton>
      </UiSidebarMenuItem>
    {/each}
  </UiSidebarMenu>
</UiSidebarGroup>
