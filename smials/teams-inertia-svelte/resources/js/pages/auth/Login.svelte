<script lang="ts">
  import {
    index as loginOptions,
    store as loginStore,
  } from '@/actions/Laravel/Passkeys/Http/Controllers/PasskeyLoginController'
  import { register } from '@/routes'
  import { store } from '@/routes/login'
  import { request } from '@/routes/password'

  let {
    canResetPassword,
    canRegister,
    status,
    teamInvitation,
  }: {
    canResetPassword: boolean
    canRegister: boolean
    status: string | null
    teamInvitation: App.Data.TeamInvitationContextData | null
  } = $props()
</script>

<AuthLayout
  title="Log in to your account"
  description="Enter your email and password below to log in"
>
  <AppHead title="Log in" />

  {#if status}
    <div class="mb-4 text-center text-sm font-medium text-green-600">
      {status}
    </div>
  {/if}

  {#if teamInvitation}
    <TeamInvitationAlert invitation={teamInvitation} action="Log in" />
  {/if}

  <PasskeyVerify
    routes={{
      options: loginOptions(),
      submit: loginStore(),
    }}
  />

  <Form
    {...store.form()}
    resetOnSuccess={['password']}
    class="flex flex-col gap-6"
  >
    {#snippet children({ errors, processing, validate })}
      <div class="grid gap-6">
        <div class="grid gap-2">
          <UiLabel for="email">Email address</UiLabel>
          <UiInput
            id="email"
            type="email"
            name="email"
            required
            autofocus
            tabindex={1}
            autocomplete="email"
            placeholder="email@example.com"
            onchange={() => validate('email')}
          />
          <InputError message={errors.email} />
        </div>

        <div class="grid gap-2">
          <div class="flex items-center justify-between">
            <UiLabel for="password">Password</UiLabel>
            {#if canResetPassword}
              <TextLink href={request()} class="text-sm" tabindex={5}>
                Forgot your password?
              </TextLink>
            {/if}
          </div>
          <PasswordInput
            id="password"
            name="password"
            required
            tabindex={2}
            autocomplete="current-password"
            placeholder="Password"
            onchange={() => validate('password')}
          />
          <InputError message={errors.password} />
        </div>

        <div class="flex items-center justify-between">
          <UiLabel for="remember" class="flex items-center space-x-3">
            <UiCheckbox id="remember" name="remember" tabindex={3} />
            <span>Remember me</span>
          </UiLabel>
        </div>

        <UiButton
          type="submit"
          class="mt-4 w-full"
          tabindex={4}
          disabled={processing}
          data-test="login-button"
        >
          {#if processing}<UiSpinner />{/if}
          Log in
        </UiButton>
      </div>

      {#if canRegister}
        <div class="text-center text-sm text-muted-foreground">
          Don't have an account?
          <TextLink
            href={register({ query: { invitation: teamInvitation?.code } })}
            tabindex={5}
            data-test="register-link">Sign up</TextLink
          >
        </div>
      {/if}
    {/snippet}
  </Form>
</AuthLayout>
