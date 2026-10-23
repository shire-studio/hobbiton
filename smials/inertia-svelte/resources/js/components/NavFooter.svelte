<script lang="ts">
  import { toUrl } from '@/lib/utils'
  import type { NavItem } from '@/types'

  let { items }: { items: NavItem[] } = $props()
</script>

<UiSidebarGroup class="group-data-[collapsible=icon]:p-0">
  <UiSidebarGroupContent>
    <UiSidebarMenu>
      {#each items as item (item.title)}
        <UiSidebarMenuItem>
          <UiSidebarMenuButton
            class="text-neutral-600 hover:text-neutral-800 dark:text-neutral-300 dark:hover:text-neutral-100"
            asChild
          >
            {#snippet children(props)}
              <a
                {...props}
                href={toUrl(item.href)}
                target="_blank"
                rel="noopener noreferrer"
                class={props.class}
              >
                {#if item.icon}
                  <item.icon />
                {/if}
                <span>{item.title}</span>
              </a>
            {/snippet}
          </UiSidebarMenuButton>
        </UiSidebarMenuItem>
      {/each}
    </UiSidebarMenu>
  </UiSidebarGroupContent>
</UiSidebarGroup>
