<script lang="ts">
  import { login } from '@/routes'
  import { store } from '@/routes/register'

  let {
    teamInvitation,
  }: { teamInvitation: App.Data.TeamInvitationContextData | null } = $props()
</script>

<AuthLayout
  title="Create an account"
  description="Enter your details below to create your account"
>
  <AppHead title="Register" />

  {#if teamInvitation}
    <TeamInvitationAlert invitation={teamInvitation} action="Register" />
  {/if}

  <Form
    {...store.form()}
    resetOnSuccess={['password', 'password_confirmation']}
    class="flex flex-col gap-6"
  >
    {#snippet children({ errors, processing, validate })}
      <div class="grid gap-6">
        <div class="grid gap-2">
          <UiLabel for="name">Name</UiLabel>
          <UiInput
            id="name"
            type="text"
            required
            autofocus
            tabindex={1}
            autocomplete="name"
            name="name"
            placeholder="Full name"
            onchange={() => validate('name')}
          />
          <InputError message={errors.name} />
        </div>

        <div class="grid gap-2">
          <UiLabel for="email">Email address</UiLabel>
          <UiInput
            id="email"
            type="email"
            required
            tabindex={2}
            autocomplete="email"
            name="email"
            placeholder="email@example.com"
            onchange={() => validate('email')}
          />
          <InputError message={errors.email} />
        </div>

        <div class="grid gap-2">
          <UiLabel for="password">Password</UiLabel>
          <PasswordInput
            id="password"
            required
            tabindex={3}
            autocomplete="new-password"
            name="password"
            placeholder="Password"
            onchange={() => validate('password')}
          />
          <InputError message={errors.password} />
        </div>

        <div class="grid gap-2">
          <UiLabel for="password_confirmation">Confirm password</UiLabel>
          <PasswordInput
            id="password_confirmation"
            required
            tabindex={4}
            autocomplete="new-password"
            name="password_confirmation"
            placeholder="Confirm password"
            onchange={() => validate('password_confirmation')}
          />
          <InputError message={errors.password_confirmation} />
        </div>

        <UiButton
          type="submit"
          class="mt-2 w-full"
          tabindex={5}
          disabled={processing}
          data-test="register-user-button"
        >
          {#if processing}<UiSpinner />{/if}
          Create account
        </UiButton>
      </div>

      <div class="text-center text-sm text-muted-foreground">
        Already have an account?
        <TextLink
          href={teamInvitation
            ? login({ query: { invitation: teamInvitation.code } })
            : login()}
          class="underline underline-offset-4"
          tabindex={6}
          data-test="login-link">Log in</TextLink
        >
      </div>
    {/snippet}
  </Form>
</AuthLayout>
