<script lang="ts">
  import { Form } from '@inertiajs/svelte'
  import AppHead from '@/components/AppHead.svelte'
  import Heading from '@/components/Heading.svelte'
  import InputError from '@/components/InputError.svelte'
  import ManagePasskeys from '@/components/ManagePasskeys.svelte'
  import ManageTwoFactor from '@/components/ManageTwoFactor.svelte'
  import PasswordInput from '@/components/PasswordInput.svelte'
  import { Button } from '@/components/ui/button'
  import { Label } from '@/components/ui/label'
  import AppLayout from '@/layouts/AppLayout.svelte'
  import SettingsLayout from '@/layouts/settings/Layout.svelte'
  import { edit, update } from '@/routes/password'
  import type { BreadcrumbItem } from '@/types'

  let {
    canManageTwoFactor,
    requiresConfirmation,
    twoFactorEnabled,
    canManagePasskeys,
    passkeys,
  }: {
    canManageTwoFactor: boolean
    requiresConfirmation: boolean
    twoFactorEnabled: boolean
    canManagePasskeys: boolean
    passkeys: App.Data.PasskeyData[]
  } = $props()

  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: 'Security settings',
      href: edit(),
    },
  ]
</script>

<AppLayout {breadcrumbs}>
  <AppHead title="Security settings" />

  <h1 class="sr-only">Security settings</h1>

  <SettingsLayout>
    <div class="space-y-6">
      <Heading
        variant="small"
        title="Update password"
        description="Ensure your account is using a long, random password to stay secure"
      />

      <Form
        {...update.form()}
        options={{
          preserveScroll: true,
        }}
        resetOnSuccess
        resetOnError={['password', 'password_confirmation', 'current_password']}
        class="space-y-6"
      >
        {#snippet children({ errors, processing })}
          <div class="grid gap-2">
            <Label for="current_password">Current password</Label>
            <PasswordInput
              id="current_password"
              name="current_password"
              class="mt-1 block w-full"
              autocomplete="current-password"
              placeholder="Current password"
            />
            <InputError message={errors.current_password} />
          </div>

          <div class="grid gap-2">
            <Label for="password">New password</Label>
            <PasswordInput
              id="password"
              name="password"
              class="mt-1 block w-full"
              autocomplete="new-password"
              placeholder="New password"
            />
            <InputError message={errors.password} />
          </div>

          <div class="grid gap-2">
            <Label for="password_confirmation">Confirm password</Label>
            <PasswordInput
              id="password_confirmation"
              name="password_confirmation"
              class="mt-1 block w-full"
              autocomplete="new-password"
              placeholder="Confirm password"
            />
            <InputError message={errors.password_confirmation} />
          </div>

          <div class="flex items-center gap-4">
            <Button
              type="submit"
              disabled={processing}
              data-test="update-password-button"
            >
              Save
            </Button>
          </div>
        {/snippet}
      </Form>
    </div>

    <ManageTwoFactor
      {canManageTwoFactor}
      {requiresConfirmation}
      {twoFactorEnabled}
    />

    <ManagePasskeys {canManagePasskeys} {passkeys} />
  </SettingsLayout>
</AppLayout>
