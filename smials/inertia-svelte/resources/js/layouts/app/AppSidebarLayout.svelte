<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { BreadcrumbItem } from '@/types'

  let {
    breadcrumbs = [],
    children,
  }: {
    breadcrumbs?: BreadcrumbItem[]
    children?: Snippet
  } = $props()
</script>

<AppShell variant="sidebar">
  <AppSidebar />
  <AppContent variant="sidebar" class="min-w-0 overflow-x-clip">
    <AppSidebarHeader {breadcrumbs} />
    {@render children?.()}
  </AppContent>
  <UiToaster />
</AppShell>
