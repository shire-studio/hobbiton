<script lang="ts">
  import { store } from '@/routes/password'

  let { token, email }: { token: string; email: string } = $props()

  let inputEmail = $state(untrack(() => email))
</script>

<AuthLayout
  title="Reset password"
  description="Please enter your new password below"
>
  <AppHead title="Reset password" />

  <Form
    {...store.form()}
    transform={(data) => ({ ...data, token, email })}
    resetOnSuccess={['password', 'password_confirmation']}
  >
    {#snippet children({ errors, processing, validate })}
      <div class="grid gap-6">
        <div class="grid gap-2">
          <UiLabel for="email">Email</UiLabel>
          <UiInput
            id="email"
            type="email"
            name="email"
            autocomplete="email"
            bind:value={inputEmail}
            class="mt-1 block w-full"
            readonly
          />
          <InputError message={errors.email} class="mt-2" />
        </div>

        <div class="grid gap-2">
          <UiLabel for="password">Password</UiLabel>
          <PasswordInput
            id="password"
            name="password"
            autocomplete="new-password"
            class="mt-1 block w-full"
            autofocus
            placeholder="Password"
            onchange={() => validate('password')}
          />
          <InputError message={errors.password} />
        </div>

        <div class="grid gap-2">
          <UiLabel for="password_confirmation">Confirm password</UiLabel>
          <PasswordInput
            id="password_confirmation"
            name="password_confirmation"
            autocomplete="new-password"
            class="mt-1 block w-full"
            placeholder="Confirm password"
            onchange={() => validate('password_confirmation')}
          />
          <InputError message={errors.password_confirmation} />
        </div>

        <UiButton
          type="submit"
          class="mt-4 w-full"
          disabled={processing}
          data-test="reset-password-button"
        >
          {#if processing}<UiSpinner />{/if}
          Reset password
        </UiButton>
      </div>
    {/snippet}
  </Form>
</AuthLayout>
