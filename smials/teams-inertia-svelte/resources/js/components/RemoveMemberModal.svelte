<script lang="ts">
  import { destroy as destroyMember } from '@/routes/teams/members'

  let {
    team,
    member,
    open = $bindable(),
  }: {
    team: App.Data.TeamData
    member: App.Data.TeamMemberData | null
    open: boolean
  } = $props()

  let processing = $state(false)

  const removeMember = () => {
    if (!member) {
      return
    }

    router.visit(destroyMember([team.slug, member.id]), {
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
      <UiDialogTitle>Remove team member</UiDialogTitle>
      <UiDialogDescription>
        Are you sure you want to remove
        <strong>{member?.name}</strong> from this team?
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

      <UiButton
        data-test="remove-member-confirm"
        variant="destructive"
        disabled={processing}
        onclick={removeMember}
      >
        Remove member
      </UiButton>
    </UiDialogFooter>
  </UiDialogContent>
</UiDialog>
