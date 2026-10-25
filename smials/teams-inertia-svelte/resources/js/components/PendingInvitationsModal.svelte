<script lang="ts">
  import { accept, decline } from '@/routes/invitations'

  let {
    invitations,
  }: {
    invitations: App.Data.PendingTeamInvitationData[]
  } = $props()

  let open = $state(true)
  let processingCode = $state<string | null>(null)

  const respond = (
    invitation: App.Data.PendingTeamInvitationData,
    action: typeof accept | typeof decline,
  ) => {
    router.visit(action(invitation.code), {
      onStart: () => (processingCode = invitation.code),
      onFinish: () => (processingCode = null),
    })
  }
</script>

<UiDialog bind:open>
  <UiDialogContent>
    <div class="space-y-6">
      <div class="space-y-3">
        <UiDialogTitle>Pending team invitations</UiDialogTitle>
        <UiDialogDescription>
          Accept or decline the teams you have been invited to join.
        </UiDialogDescription>
      </div>

      <div class="grid gap-4">
        {#each invitations as invitation (invitation.code)}
          <div class="rounded-lg border p-4">
            <div class="space-y-1">
              <p class="font-medium">{invitation.team_name}</p>
              <p class="text-sm text-muted-foreground">
                {invitation.inviter_name} invited you to join this team.
              </p>
            </div>

            <div class="mt-4 flex justify-end gap-2">
              <UiButton
                variant="secondary"
                disabled={processingCode === invitation.code}
                onclick={() => respond(invitation, decline)}
              >
                Decline
              </UiButton>

              <UiButton
                data-test="accept-invitation"
                disabled={processingCode === invitation.code}
                onclick={() => respond(invitation, accept)}
              >
                Accept
              </UiButton>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </UiDialogContent>
</UiDialog>
