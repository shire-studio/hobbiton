<script lang="ts">
  import { login } from '@/routes'
  import { email } from '@/routes/password'

  let { status }: { status: string | null } = $props()
</script>

<AuthLayout
  title="Forgot password"
  description="Enter your email to receive a password reset link"
>
  <AppHead title="Forgot password" />

  {#if status}
    <div class="mb-4 text-center text-sm font-medium text-green-600">
      {status}
    </div>
  {/if}

  <div class="space-y-6">
    <Form {...email.form()}>
      {#snippet children({ errors, processing, validate })}
        <div class="grid gap-2">
          <UiLabel for="email">Email address</UiLabel>
          <UiInput
            id="email"
            type="email"
            name="email"
            autocomplete="off"
            autofocus
            placeholder="email@example.com"
            onchange={() => validate('email')}
          />
          <InputError message={errors.email} />
        </div>

        <div class="my-6 flex items-center justify-start">
          <UiButton
            type="submit"
            class="w-full"
            disabled={processing}
            data-test="email-password-reset-link-button"
          >
            {#if processing}<UiSpinner />{/if}
            Email password reset link
          </UiButton>
        </div>
      {/snippet}
    </Form>

    <div class="space-x-1 text-center text-sm text-muted-foreground">
      <span>Or, return to</span>
      <TextLink href={login()}>log in</TextLink>
    </div>
  </div>
</AuthLayout>
