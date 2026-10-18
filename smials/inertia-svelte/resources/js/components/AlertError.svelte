<script lang="ts">
  import { AlertCircle } from '@lucide/svelte'
  import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

  let {
    errors = [],
    title = 'Something went wrong.',
  }: {
    errors: string[]
    title?: string
  } = $props()

  const uniqueErrors = $derived([...new Set(errors)])
</script>

<Alert variant="destructive">
  <AlertCircle class="size-4" />
  <AlertTitle>{title}</AlertTitle>
  <AlertDescription>
    <ul class="list-inside list-disc text-sm">
      {#each uniqueErrors as error (error)}
        <li>{error}</li>
      {/each}
    </ul>
  </AlertDescription>
</Alert>
