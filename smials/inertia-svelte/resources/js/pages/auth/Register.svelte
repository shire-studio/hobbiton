<script lang="ts">
  import { Form } from '@inertiajs/svelte'
  import AppHead from '@/components/AppHead.svelte'
  import InputError from '@/components/InputError.svelte'
  import PasswordInput from '@/components/PasswordInput.svelte'
  import TextLink from '@/components/TextLink.svelte'
  import { Button } from '@/components/ui/button'
  import { Input } from '@/components/ui/input'
  import { Label } from '@/components/ui/label'
  import { Spinner } from '@/components/ui/spinner'
  import AuthLayout from '@/layouts/AuthLayout.svelte'
  import { login } from '@/routes'
  import { store } from '@/routes/register'
</script>

<AuthLayout
  title="Create an account"
  description="Enter your details below to create your account"
>
  <AppHead title="Register" />

  <Form
    {...store.form()}
    resetOnSuccess={['password', 'password_confirmation']}
    class="flex flex-col gap-6"
  >
    {#snippet children({ errors, processing, validate })}
      <div class="grid gap-6">
        <div class="grid gap-2">
          <Label for="name">Name</Label>
          <Input
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
          <Label for="email">Email address</Label>
          <Input
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
          <Label for="password">Password</Label>
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
          <Label for="password_confirmation">Confirm password</Label>
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

        <Button
          type="submit"
          class="mt-2 w-full"
          tabindex={5}
          disabled={processing}
          data-test="register-user-button"
        >
          {#if processing}<Spinner />{/if}
          Create account
        </Button>
      </div>

      <div class="text-center text-sm text-muted-foreground">
        Already have an account?
        <TextLink
          href={login()}
          class="underline underline-offset-4"
          tabindex={6}>Log in</TextLink
        >
      </div>
    {/snippet}
  </Form>
</AuthLayout>
