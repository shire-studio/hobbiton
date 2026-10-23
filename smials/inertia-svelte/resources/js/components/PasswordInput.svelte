<script lang="ts">
  import { Eye, EyeOff } from '@lucide/svelte'
  import type { HTMLInputAttributes } from 'svelte/elements'
  import { cn } from '@/lib/utils'

  let {
    ref = $bindable(),
    class: className = '',
    ...rest
  }: Omit<HTMLInputAttributes, 'type'> & { ref?: HTMLInputElement } = $props()

  let showPassword = $state(false)
</script>

<div class="relative">
  <UiInput
    bind:ref
    type={showPassword ? 'text' : 'password'}
    class={cn('pr-10', className)}
    {...rest}
  />
  <button
    type="button"
    onclick={() => (showPassword = !showPassword)}
    class="absolute inset-y-0 right-0 flex items-center rounded-r-md px-3 text-muted-foreground hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none"
    aria-label={showPassword ? 'Hide password' : 'Show password'}
    tabindex={-1}
  >
    {#if showPassword}
      <EyeOff class="size-4" />
    {:else}
      <Eye class="size-4" />
    {/if}
  </button>
</div>
