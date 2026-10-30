<script lang="ts">
  import { Check, ChevronsUpDown, Plus, Users } from '@lucide/svelte'
  import { switchMethod } from '@/routes/teams'

  let { inHeader = false }: { inHeader?: boolean } = $props()

  let isMobile = $state(false)

  const currentTeam = $derived(page.props.currentTeam)
  const teams = $derived(page.props.teams)
  const itemClass = $derived(inHeader ? 'gap-2' : 'gap-2 p-2')

  const switchTeam = (team: App.Data.TeamData) => {
    router.visit(switchMethod(team.slug))
  }

  onMount(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)')
    const update = () => (isMobile = mediaQuery.matches)

    update()
    mediaQuery.addEventListener('change', update)

    return () => mediaQuery.removeEventListener('change', update)
  })
</script>

{#key currentTeam?.id}
  <UiDropdownMenu class={inHeader ? '' : 'w-full'}>
    <UiDropdownMenuTrigger asChild>
      {#snippet children(props)}
        <UiButton
          data-test="team-switcher"
          variant="ghost"
          class={inHeader
            ? 'h-8 gap-1 px-2'
            : 'w-full justify-start px-2 has-[>svg]:px-2 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'}
          onclick={props.onclick}
          aria-expanded={props['aria-expanded']}
          data-state={props['data-state']}
        >
          <Users
            class={inHeader
              ? 'hidden'
              : 'hidden size-4 shrink-0 group-data-[collapsible=icon]:block'}
          />
          <div
            class={inHeader
              ? 'grid flex-1 text-left text-sm leading-tight'
              : 'grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:sr-only'}
          >
            <span
              class={inHeader
                ? 'max-w-[120px] truncate font-medium'
                : 'truncate font-semibold'}
            >
              {currentTeam?.name ?? 'Select team'}
            </span>
          </div>
          <ChevronsUpDown
            class={inHeader
              ? 'size-4 opacity-50'
              : 'ml-auto group-data-[collapsible=icon]:hidden'}
          />
        </UiButton>
      {/snippet}
    </UiDropdownMenuTrigger>

    <UiDropdownMenuContent
      class={inHeader ? 'w-56' : 'w-full min-w-56 rounded-lg'}
      side={inHeader ? undefined : isMobile ? 'bottom' : 'right'}
      align={inHeader ? 'end' : 'start'}
      sideOffset={inHeader ? undefined : 4}
    >
      <UiDropdownMenuLabel class="text-xs text-muted-foreground">
        Teams
      </UiDropdownMenuLabel>

      {#each teams as team (team.id)}
        <UiDropdownMenuItem asChild>
          {#snippet children(props)}
            <button
              type="button"
              class="{props.class} {itemClass}"
              data-test="team-switcher-item"
              onclick={() => {
                props.onClick?.()
                switchTeam(team)
              }}
            >
              {team.name}
              {#if currentTeam?.id === team.id}
                <Check
                  class={inHeader ? 'ml-auto size-4' : 'ml-auto h-4 w-4'}
                />
              {/if}
            </button>
          {/snippet}
        </UiDropdownMenuItem>
      {/each}

      <UiDropdownMenuSeparator />

      <CreateTeamModal>
        {#snippet children(triggerProps)}
          <UiDropdownMenuItem asChild>
            {#snippet children(props)}
              <button
                type="button"
                data-test="team-switcher-new-team"
                class="{props.class} {itemClass}"
                onclick={triggerProps.onClick}
              >
                <Plus class={inHeader ? 'size-4' : 'h-4 w-4'} />
                <span class="text-muted-foreground">New team</span>
              </button>
            {/snippet}
          </UiDropdownMenuItem>
        {/snippet}
      </CreateTeamModal>
    </UiDropdownMenuContent>
  </UiDropdownMenu>
{/key}
