<script lang="ts">
  import type { Snippet } from 'svelte'

  let {
    title,
    description,
    children,
  }: {
    title?: string
    description?: string
    children: Snippet
  } = $props()
</script>

<AuthSimpleLayout {title} {description}>
  {@render children()}
</AuthSimpleLayout>
