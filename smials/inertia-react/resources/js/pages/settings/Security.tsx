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
                  <UiLabel htmlFor="current_password">Current password</UiLabel>
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
                  <UiLabel htmlFor="password">New password</UiLabel>
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
                  <UiLabel htmlFor="password_confirmation">
                    Confirm password
                  </UiLabel>
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
                  <UiButton
                    disabled={processing}
                    data-test="update-password-button"
                  >
                    Save
                  </UiButton>
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
