<script lang="ts">
  import { Eye, LogOut, Pencil, Plus } from '@lucide/svelte'
  import { edit, index } from '@/routes/teams'
  import type { BreadcrumbItem } from '@/types'

  let { teams }: { teams: App.Data.TeamData[] } = $props()

  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: 'Teams',
      href: index(),
    },
  ]

  let leaveTeamDialogOpen = $state(false)
  let teamLeaving = $state<App.Data.TeamData | null>(null)

  const openLeaveTeamDialog = (team: App.Data.TeamData) => {
    teamLeaving = team
    leaveTeamDialogOpen = true
  }
</script>

<AppLayout {breadcrumbs}>
  <AppHead title="Teams" />

  <h1 class="sr-only">Teams</h1>

  <SettingsLayout>
    <div class="flex flex-col space-y-6">
      <div class="flex items-center justify-between">
        <Heading
          variant="small"
          title="Teams"
          description="Manage your teams and team memberships"
        />

        <CreateTeamModal>
          {#snippet children(props)}
            <UiButton data-test="create-team-button" onclick={props.onClick}>
              <Plus /> New team
            </UiButton>
          {/snippet}
        </CreateTeamModal>
      </div>

      <div class="space-y-3">
        {#each teams as team (team.id)}
          <div
            class="flex items-center justify-between gap-4 rounded-lg border p-4"
          >
            <div class="flex items-center gap-4">
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-medium">{team.name}</span>
                  {#if team.is_personal}
                    <UiBadge variant="secondary">Personal</UiBadge>
                  {/if}
                </div>
                <span class="text-sm text-muted-foreground">
                  {team.role_label}
                </span>
              </div>
            </div>

            <UiTooltipProvider delayDuration={0}>
              <div class="flex items-center gap-2">
                {#if team.can_leave}
                  <UiTooltip>
                    <UiTooltipTrigger>
                      {#snippet child({ props })}
                        <UiButton
                          data-test="leave-team"
                          variant="ghost"
                          size="sm"
                          {...props}
                          onclick={() => openLeaveTeamDialog(team)}
                        >
                          <LogOut class="h-4 w-4" />
                          <span class="sr-only">Leave team</span>
                        </UiButton>
                      {/snippet}
                    </UiTooltipTrigger>
                    <UiTooltipContent>
                      <p>Leave team</p>
                    </UiTooltipContent>
                  </UiTooltip>
                {/if}

                <UiTooltip>
                  <UiTooltipTrigger>
                    {#snippet child({ props })}
                      <UiButton variant="ghost" size="sm" asChild {...props}>
                        {#snippet children(buttonProps)}
                          <Link {...buttonProps} href={edit(team.slug)}>
                            {#if team.can_update}
                              <Pencil class="h-4 w-4" />
                            {:else}
                              <Eye class="h-4 w-4" />
                            {/if}
                            <span class="sr-only">
                              {team.can_update ? 'Edit team' : 'View team'}
                            </span>
                          </Link>
                        {/snippet}
                      </UiButton>
                    {/snippet}
                  </UiTooltipTrigger>
                  <UiTooltipContent>
                    <p>{team.can_update ? 'Edit team' : 'View team'}</p>
                  </UiTooltipContent>
                </UiTooltip>
              </div>
            </UiTooltipProvider>
          </div>
        {/each}

        {#if teams.length === 0}
          <p class="py-8 text-center text-muted-foreground">
            You don't belong to any teams yet.
          </p>
        {/if}
      </div>
    </div>

    <LeaveTeamModal team={teamLeaving} bind:open={leaveTeamDialogOpen} />
  </SettingsLayout>
</AppLayout>
