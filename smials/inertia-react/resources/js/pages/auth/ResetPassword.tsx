import { store } from '@/routes/password'

type Props = {
  token: string
  email: string
}

export default function ResetPassword({ token, email }: Props) {
  const [inputEmail, setInputEmail] = useState(email)

  return (
    <AuthLayout
      title="Reset password"
      description="Please enter your new password below"
    >
      <Head title="Reset password" />

      <Form
        {...store.form()}
        transform={(data) => ({ ...data, token, email })}
        resetOnSuccess={['password', 'password_confirmation']}
      >
        {({ errors, processing, validate }) => (
          <div className="grid gap-6">
            <div className="grid gap-2">
              <UiLabel htmlFor="email">Email</UiLabel>
              <UiInput
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                value={inputEmail}
                onChange={(event) => setInputEmail(event.target.value)}
                className="mt-1 block w-full"
                readOnly
              />
              <InputError message={errors.email} className="mt-2" />
            </div>

            <div className="grid gap-2">
              <UiLabel htmlFor="password">Password</UiLabel>
              <PasswordInput
                id="password"
                name="password"
                autoComplete="new-password"
                className="mt-1 block w-full"
                autoFocus
                placeholder="Password"
                onBlur={() => validate('password')}
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
                autoComplete="new-password"
                className="mt-1 block w-full"
                placeholder="Confirm password"
                onBlur={() => validate('password_confirmation')}
              />
              <InputError message={errors.password_confirmation} />
            </div>

            <UiButton
              type="submit"
              className="mt-4 w-full"
              disabled={processing}
              data-test="reset-password-button"
            >
              {processing && <UiSpinner />}
              Reset password
            </UiButton>
          </div>
        )}
      </Form>
    </AuthLayout>
  )
}
