<script lang="ts">
  import type { BreadcrumbItem as BreadcrumbItemType } from '@/types'

  let {
    breadcrumbs = [],
  }: {
    breadcrumbs: BreadcrumbItemType[]
  } = $props()
</script>

<UiBreadcrumb>
  <UiBreadcrumbList>
    {#each breadcrumbs as item, index (index)}
      <UiBreadcrumbItem>
        {#if index === breadcrumbs.length - 1}
          <UiBreadcrumbPage>{item.title}</UiBreadcrumbPage>
        {:else}
          <UiBreadcrumbLink asChild>
            {#snippet children(props)}
              <Link href={item.href} class={props.class}>
                {item.title}
              </Link>
            {/snippet}
          </UiBreadcrumbLink>
        {/if}
      </UiBreadcrumbItem>
      {#if index !== breadcrumbs.length - 1}
        <UiBreadcrumbSeparator />
      {/if}
    {/each}
  </UiBreadcrumbList>
</UiBreadcrumb>
