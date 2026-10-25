<script lang="ts">
  import { leave as leaveTeamAction } from '@/routes/teams'

  let {
    team,
    open = $bindable(),
  }: {
    team: App.Data.TeamData | null
    open: boolean
  } = $props()

  let processing = $state(false)

  const leaveTeam = () => {
    if (!team) {
      return
    }

    router.visit(leaveTeamAction(team.slug), {
      onStart: () => (processing = true),
      onFinish: () => (processing = false),
      onSuccess: () => (open = false),
    })
  }
</script>

<UiDialog bind:open>
  <UiDialogContent>
    <div class="space-y-3">
      <UiDialogTitle>Leave team</UiDialogTitle>
      <UiDialogDescription>
        Are you sure you want to leave <strong>{team?.name}</strong>?
      </UiDialogDescription>
    </div>

    <UiDialogFooter class="gap-2">
      <UiDialogClose asChild>
        {#snippet children(props)}
          <UiButton variant="secondary" onclick={props.onClick}>
            Cancel
          </UiButton>
        {/snippet}
      </UiDialogClose>

      <UiButton variant="destructive" disabled={processing} onclick={leaveTeam}>
        Leave team
      </UiButton>
    </UiDialogFooter>
  </UiDialogContent>
</UiDialog>
