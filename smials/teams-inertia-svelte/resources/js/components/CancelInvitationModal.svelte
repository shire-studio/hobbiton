<script lang="ts">
  import { destroy as destroyInvitation } from '@/routes/teams/invitations'

  let {
    team,
    invitation,
    open = $bindable(),
  }: {
    team: App.Data.TeamData
    invitation: App.Data.TeamInvitationData | null
    open: boolean
  } = $props()

  let processing = $state(false)

  const cancelInvitation = () => {
    if (!invitation) {
      return
    }

    router.visit(destroyInvitation([team.slug, invitation.code]), {
      preserveScroll: true,
      onStart: () => (processing = true),
      onFinish: () => (processing = false),
      onSuccess: () => (open = false),
    })
  }
</script>

<UiDialog bind:open>
  <UiDialogContent>
    <div class="space-y-3">
      <UiDialogTitle>Cancel invitation</UiDialogTitle>
      <UiDialogDescription>
        Are you sure you want to cancel the invitation for
        <strong>{invitation?.email}</strong>?
      </UiDialogDescription>
    </div>

    <UiDialogFooter class="gap-2">
      <UiDialogClose asChild>
        {#snippet children(props)}
          <UiButton variant="secondary" onclick={props.onClick}>
            Keep invitation
          </UiButton>
        {/snippet}
      </UiDialogClose>

      <UiButton
        data-test="cancel-invitation-confirm"
        variant="destructive"
        disabled={processing}
        onclick={cancelInvitation}
      >
        Cancel invitation
      </UiButton>
    </UiDialogFooter>
  </UiDialogContent>
</UiDialog>
