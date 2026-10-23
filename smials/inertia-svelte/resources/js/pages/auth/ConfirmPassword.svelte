<script lang="ts">
  import {
    index as confirmOptions,
    store as confirmStore,
  } from '@/actions/Laravel/Passkeys/Http/Controllers/PasskeyConfirmationController'
  import { store } from '@/routes/password/confirm'
</script>

<AuthLayout
  title="Confirm password"
  description="This is a secure area of the application. Please confirm your password before continuing."
>
  <AppHead title="Confirm password" />

  <PasskeyVerify
    routes={{
      options: confirmOptions(),
      submit: confirmStore(),
    }}
    label="Confirm with passkey"
    loadingLabel="Confirming..."
    separator="Or confirm with password"
  />

  <Form {...store.form()} resetOnSuccess>
    {#snippet children({ errors, processing })}
      <div class="space-y-6">
        <div class="grid gap-2">
          <UiLabel for="password">Password</UiLabel>
          <PasswordInput
            id="password"
            name="password"
            class="mt-1 block w-full"
            required
            autocomplete="current-password"
            autofocus
          />

          <InputError message={errors.password} />
        </div>

        <div class="flex items-center">
          <UiButton
            type="submit"
            class="w-full"
            disabled={processing}
            data-test="confirm-password-button"
          >
            {#if processing}<UiSpinner />{/if}
            Confirm password
          </UiButton>
        </div>
      </div>
    {/snippet}
  </Form>
</AuthLayout>
