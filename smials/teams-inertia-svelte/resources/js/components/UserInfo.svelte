<script lang="ts">
  import type { User } from '@/types'

  let {
    user,
    showEmail = false,
    team = null,
  }: {
    user: User
    showEmail?: boolean
    team?: App.Data.TeamData | null
  } = $props()

  const initials = $derived(getInitials(user.name))
</script>

<div class="flex flex-1 items-center gap-2">
  <UiAvatar class="h-8 w-8 overflow-hidden rounded-lg">
    <UiAvatarFallback class="rounded-lg text-black dark:text-white">
      {initials}
    </UiAvatarFallback>
  </UiAvatar>

  <div class="grid flex-1 text-left text-sm leading-tight">
    <span class="truncate font-medium">{user.name}</span>
    {#if team}
      <span class="truncate text-xs text-muted-foreground">{team.name}</span>
    {:else if showEmail}
      <span class="truncate text-xs text-muted-foreground">{user.email}</span>
    {/if}
  </div>
</div>
