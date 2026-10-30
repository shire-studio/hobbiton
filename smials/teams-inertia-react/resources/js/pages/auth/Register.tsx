import { login } from '@/routes'
import { store } from '@/routes/register'

type Props = {
  teamInvitation: App.Data.TeamInvitationContextData | null
}

export default function Register({ teamInvitation }: Props) {
  return (
    <AuthLayout
      title="Create an account"
      description="Enter your details below to create your account"
    >
      <Head title="Register" />

      {teamInvitation && (
        <TeamInvitationAlert invitation={teamInvitation} action="Register" />
      )}

      <Form
        {...store.form()}
        resetOnSuccess={['password', 'password_confirmation']}
        className="flex flex-col gap-6"
      >
        {({ errors, processing, validate }) => (
          <>
            <div className="grid gap-6">
              <div className="grid gap-2">
                <UiLabel htmlFor="name">Name</UiLabel>
                <UiInput
                  id="name"
                  type="text"
                  required
                  autoFocus
                  tabIndex={1}
                  autoComplete="name"
                  name="name"
                  placeholder="Full name"
                  onBlur={() => validate('name')}
                />
                <InputError message={errors.name} />
              </div>

              <div className="grid gap-2">
                <UiLabel htmlFor="email">Email address</UiLabel>
                <UiInput
                  id="email"
                  type="email"
                  required
                  tabIndex={2}
                  autoComplete="email"
                  name="email"
                  placeholder="email@example.com"
                  onBlur={() => validate('email')}
                />
                <InputError message={errors.email} />
              </div>

              <div className="grid gap-2">
                <UiLabel htmlFor="password">Password</UiLabel>
                <PasswordInput
                  id="password"
                  required
                  tabIndex={3}
                  autoComplete="new-password"
                  name="password"
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
                  required
                  tabIndex={4}
                  autoComplete="new-password"
                  name="password_confirmation"
                  placeholder="Confirm password"
                  onBlur={() => validate('password_confirmation')}
                />
                <InputError message={errors.password_confirmation} />
              </div>

              <UiButton
                type="submit"
                className="mt-2 w-full"
                tabIndex={5}
                disabled={processing}
                data-test="register-user-button"
              >
                {processing && <UiSpinner />}
                Create account
              </UiButton>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <TextLink
                href={
                  teamInvitation
                    ? login({ query: { invitation: teamInvitation.code } })
                    : login()
                }
                className="underline underline-offset-4"
                tabIndex={6}
                data-test="login-link"
              >
                Log in
              </TextLink>
            </div>
          </>
        )}
      </Form>
    </AuthLayout>
  )
}
