<script lang="ts">
  import { store as storeInvitation } from '@/routes/teams/invitations'

  let {
    team,
    availableRoles,
    open = $bindable(),
  }: {
    team: App.Data.TeamData
    availableRoles: { value: string; label: string }[]
    open: boolean
  } = $props()

  let inviteRole = $state('member')
  let formKey = $state(0)

  const inviteRoleLabel = $derived(
    availableRoles.find((role) => role.value === inviteRole)?.label ??
      'Select a role',
  )

  function handleOpenChange(value: boolean) {
    open = value

    if (!value) {
      inviteRole = 'member'
      formKey++
    }
  }
</script>

<UiDialog {open} onOpenChange={handleOpenChange}>
  <UiDialogContent>
    {#key formKey}
      <Form
        {...storeInvitation.form(team.slug)}
        class="space-y-6"
        onSuccess={() => handleOpenChange(false)}
      >
        {#snippet children({ errors, processing })}
          <div class="space-y-3">
            <UiDialogTitle>Invite a team member</UiDialogTitle>
            <UiDialogDescription>
              Send an invitation to join this team.
            </UiDialogDescription>
          </div>

          <div class="grid gap-4">
            <div class="grid gap-2">
              <UiLabel for="invite-email">Email address</UiLabel>
              <UiInput
                id="invite-email"
                name="email"
                data-test="invite-email"
                type="email"
                placeholder="colleague@example.com"
                required
              />
              <InputError message={errors.email} />
            </div>

            <div class="grid gap-2">
              <UiLabel for="invite-role">Role</UiLabel>
              <UiSelect bind:value={inviteRole}>
                <UiSelectTrigger id="invite-role" class="w-full">
                  {inviteRoleLabel}
                </UiSelectTrigger>
                <UiSelectContent>
                  {#each availableRoles as role (role.value)}
                    <UiSelectItem value={role.value} label={role.label}>
                      {role.label}
                    </UiSelectItem>
                  {/each}
                </UiSelectContent>
              </UiSelect>
              <input type="hidden" name="role" value={inviteRole} />
              <InputError message={errors.role} />
            </div>
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
              type="submit"
              data-test="invite-submit"
              disabled={processing}
            >
              Send invitation
            </UiButton>
          </UiDialogFooter>
        {/snippet}
      </Form>
    {/key}
  </UiDialogContent>
</UiDialog>
