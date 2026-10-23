import {
  index as confirmOptions,
  store as confirmStore,
} from '@/actions/Laravel/Passkeys/Http/Controllers/PasskeyConfirmationController'
import { store } from '@/routes/password/confirm'

export default function ConfirmPassword() {
  return (
    <AuthLayout
      title="Confirm password"
      description="This is a secure area of the application. Please confirm your password before continuing."
    >
      <Head title="Confirm password" />

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
        {({ errors, processing }) => (
          <div className="space-y-6">
            <div className="grid gap-2">
              <UiLabel htmlFor="password">Password</UiLabel>
              <PasswordInput
                id="password"
                name="password"
                className="mt-1 block w-full"
                required
                autoComplete="current-password"
                autoFocus
              />

              <InputError message={errors.password} />
            </div>

            <div className="flex items-center">
              <UiButton
                className="w-full"
                disabled={processing}
                data-test="confirm-password-button"
              >
                {processing && <UiSpinner />}
                Confirm password
              </UiButton>
            </div>
          </div>
        )}
      </Form>
    </AuthLayout>
  )
}
