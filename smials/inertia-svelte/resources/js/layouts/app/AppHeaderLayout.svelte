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

<AppShell variant="header">
  <AppHeader {breadcrumbs} />
  <AppContent variant="header">
    {@render children?.()}
  </AppContent>
  <UiToaster />
</AppShell>
