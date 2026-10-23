<script lang="ts">
  import { destroy } from '@/routes/user'

  let passwordInput = $state<HTMLInputElement>()
</script>

<div class="space-y-6">
  <Heading
    variant="small"
    title="Delete account"
    description="Delete your account and all of its resources"
  />
  <div
    class="space-y-4 rounded-lg border border-red-100 bg-red-50 p-4 dark:border-red-200/10 dark:bg-red-700/10"
  >
    <div class="relative space-y-0.5 text-red-600 dark:text-red-100">
      <p class="font-medium">Warning</p>
      <p class="text-sm">Please proceed with caution, this cannot be undone.</p>
    </div>
    <UiDialog>
      <UiDialogTrigger asChild>
        {#snippet children(props)}
          <UiButton
            variant="destructive"
            data-test="delete-user-button"
            onclick={props.onClick}>Delete account</UiButton
          >
        {/snippet}
      </UiDialogTrigger>
      <UiDialogContent>
        <Form
          {...destroy.form()}
          resetOnSuccess
          onError={() => passwordInput?.focus()}
          options={{
            preserveScroll: true,
          }}
          class="space-y-6"
        >
          {#snippet children({
            errors,
            processing,
            reset,
            clearErrors,
            validate,
          })}
            <div class="space-y-3">
              <UiDialogTitle
                >Are you sure you want to delete your account?</UiDialogTitle
              >
              <UiDialogDescription>
                Once your account is deleted, all of its resources and data will
                also be permanently deleted. Please enter your password to
                confirm you would like to permanently delete your account.
              </UiDialogDescription>
            </div>

            <div class="grid gap-2">
              <UiLabel for="password" class="sr-only">Password</UiLabel>
              <PasswordInput
                id="password"
                name="password"
                bind:ref={passwordInput}
                placeholder="Password"
                onchange={() => validate('password')}
              />
              <InputError message={errors.password} />
            </div>

            <UiDialogFooter class="gap-2">
              <UiDialogClose asChild>
                {#snippet children(props)}
                  <UiButton
                    variant="secondary"
                    onclick={() => {
                      clearErrors()
                      reset()
                      props.onClick?.()
                    }}
                  >
                    Cancel
                  </UiButton>
                {/snippet}
              </UiDialogClose>

              <UiButton
                type="submit"
                variant="destructive"
                disabled={processing}
                data-test="confirm-delete-user-button"
              >
                Delete account
              </UiButton>
            </UiDialogFooter>
          {/snippet}
        </Form>
      </UiDialogContent>
    </UiDialog>
  </div>
</div>
