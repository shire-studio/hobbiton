import { Form, Head } from '@inertiajs/react'
import Heading from '@/components/Heading'
import InputError from '@/components/InputError'
import ManagePasskeys from '@/components/ManagePasskeys'
import ManageTwoFactor from '@/components/ManageTwoFactor'
import PasswordInput from '@/components/PasswordInput'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import AppLayout from '@/layouts/AppLayout'
import SettingsLayout from '@/layouts/settings/Layout'
import { edit, update } from '@/routes/password'
import type { BreadcrumbItem } from '@/types'

type Props = {
  canManageTwoFactor: boolean
  requiresConfirmation: boolean
  twoFactorEnabled: boolean
  canManagePasskeys: boolean
  passkeys: App.Data.PasskeyData[]
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Security settings',
    href: edit(),
  },
]

export default function Security({
  canManageTwoFactor,
  requiresConfirmation,
  twoFactorEnabled,
  canManagePasskeys,
  passkeys,
}: Props) {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Security settings" />

      <h1 className="sr-only">Security settings</h1>

      <SettingsLayout>
        <div className="space-y-6">
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
            resetOnError={[
              'password',
              'password_confirmation',
              'current_password',
            ]}
            className="space-y-6"
          >
            {({ errors, processing }) => (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="current_password">Current password</Label>
                  <PasswordInput
                    id="current_password"
                    name="current_password"
                    className="mt-1 block w-full"
                    autoComplete="current-password"
                    placeholder="Current password"
                  />
                  <InputError message={errors.current_password} />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password">New password</Label>
                  <PasswordInput
                    id="password"
                    name="password"
                    className="mt-1 block w-full"
                    autoComplete="new-password"
                    placeholder="New password"
                  />
                  <InputError message={errors.password} />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password_confirmation">
                    Confirm password
                  </Label>
                  <PasswordInput
                    id="password_confirmation"
                    name="password_confirmation"
                    className="mt-1 block w-full"
                    autoComplete="new-password"
                    placeholder="Confirm password"
                  />
                  <InputError message={errors.password_confirmation} />
                </div>

                <div className="flex items-center gap-4">
                  <Button
                    disabled={processing}
                    data-test="update-password-button"
                  >
                    Save
                  </Button>
                </div>
              </>
            )}
          </Form>
        </div>

        <ManageTwoFactor
          canManageTwoFactor={canManageTwoFactor}
          requiresConfirmation={requiresConfirmation}
          twoFactorEnabled={twoFactorEnabled}
        />

        <ManagePasskeys
          canManagePasskeys={canManagePasskeys}
          passkeys={passkeys}
        />
      </SettingsLayout>
    </AppLayout>
  )
}
