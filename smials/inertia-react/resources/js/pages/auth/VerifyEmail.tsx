import { logout } from '@/routes'
import { send } from '@/routes/verification'

type Props = {
  status: string | null
}

export default function VerifyEmail({ status }: Props) {
  const verificationLinkSent =
    status === ('verification-link-sent' satisfies App.Enums.SessionStatus)

  return (
    <AuthLayout
      title="Email verification"
      description="Please verify your email address by clicking on the link we just emailed to you."
    >
      <Head title="Email verification" />

      {verificationLinkSent && (
        <div className="mb-4 text-center text-sm font-medium text-green-600">
          A new verification link has been sent to the email address you
          provided during registration.
        </div>
      )}

      <Form {...send.form()} className="space-y-6 text-center">
        {({ processing }) => (
          <>
            <UiButton disabled={processing} variant="secondary">
              {processing && <UiSpinner />}
              Resend verification email
            </UiButton>

            <TextLink
              href={logout()}
              as="button"
              className="mx-auto block text-sm"
            >
              Log out
            </TextLink>
          </>
        )}
      </Form>
    </AuthLayout>
  )
}
