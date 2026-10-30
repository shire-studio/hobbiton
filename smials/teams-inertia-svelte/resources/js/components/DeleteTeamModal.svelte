<script lang="ts">
  import { destroy } from '@/routes/teams'

  let {
    team,
    open = $bindable(),
  }: {
    team: App.Data.TeamData
    open: boolean
  } = $props()

  let confirmationName = $state('')
  let formKey = $state(0)

  const canDeleteTeam = $derived(confirmationName === team.name)

  function handleOpenChange(value: boolean) {
    open = value

    if (!value) {
      confirmationName = ''
      formKey++
    }
  }
</script>

<UiDialog {open} onOpenChange={handleOpenChange}>
  <UiDialogContent>
    {#key formKey}
      <Form
        {...destroy.form(team.slug)}
        class="space-y-6"
        onSuccess={() => handleOpenChange(false)}
      >
        {#snippet children({ errors, processing })}
          <div class="space-y-3">
            <UiDialogTitle>Are you sure?</UiDialogTitle>
            <UiDialogDescription>
              This action cannot be undone. This will permanently delete the
              team
              <strong>"{team.name}"</strong>.
            </UiDialogDescription>
          </div>

          <div class="space-y-4 py-4">
            <div class="grid gap-2">
              <UiLabel for="confirmation-name">
                Type
                <strong>"{team.name}"</strong> to confirm
              </UiLabel>
              <UiInput
                id="confirmation-name"
                name="name"
                data-test="delete-team-name"
                bind:value={confirmationName}
                placeholder="Enter team name"
                autocomplete="off"
              />
              <InputError message={errors.name} />
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
              data-test="delete-team-submit"
              variant="destructive"
              type="submit"
              disabled={!canDeleteTeam || processing}
            >
              Delete team
            </UiButton>
          </UiDialogFooter>
        {/snippet}
      </Form>
    {/key}
  </UiDialogContent>
</UiDialog>
