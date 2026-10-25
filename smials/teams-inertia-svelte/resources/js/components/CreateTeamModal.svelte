<script lang="ts">
  import type { Snippet } from 'svelte'
  import { store } from '@/routes/teams'

  let {
    children: trigger,
  }: {
    children?: Snippet<[{ onClick?: (event: MouseEvent) => void }]>
  } = $props()

  let open = $state(false)
  let formKey = $state(0)

  function handleOpenChange(value: boolean) {
    open = value

    if (!value) {
      formKey++
    }
  }
</script>

<UiDialog {open} onOpenChange={handleOpenChange}>
  <UiDialogTrigger asChild>
    {#snippet children(props)}
      {@render trigger?.(props)}
    {/snippet}
  </UiDialogTrigger>
  <UiDialogContent>
    {#key formKey}
      <Form
        {...store.form()}
        class="space-y-6"
        onSuccess={() => handleOpenChange(false)}
      >
        {#snippet children({ errors, processing })}
          <div class="space-y-3">
            <UiDialogTitle>Create a new team</UiDialogTitle>
            <UiDialogDescription>
              Create a new team to collaborate with others.
            </UiDialogDescription>
          </div>

          <div class="grid gap-2">
            <UiLabel for="create-team-name">Team name</UiLabel>
            <UiInput
              id="create-team-name"
              name="name"
              data-test="create-team-name"
              placeholder="My team"
              required
            />
            <InputError message={errors.name} />
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
              data-test="create-team-submit"
              disabled={processing}
            >
              Create team
            </UiButton>
          </UiDialogFooter>
        {/snippet}
      </Form>
    {/key}
  </UiDialogContent>
</UiDialog>
