<script lang="ts">
  import { AlertCircle } from '@lucide/svelte'

  let {
    errors = [],
    title = 'Something went wrong.',
  }: {
    errors: string[]
    title?: string
  } = $props()

  const uniqueErrors = $derived([...new Set(errors)])
</script>

<UiAlert variant="destructive">
  <AlertCircle class="size-4" />
  <UiAlertTitle>{title}</UiAlertTitle>
  <UiAlertDescription>
    <ul class="list-inside list-disc text-sm">
      {#each uniqueErrors as error (error)}
        <li>{error}</li>
      {/each}
    </ul>
  </UiAlertDescription>
</UiAlert>
