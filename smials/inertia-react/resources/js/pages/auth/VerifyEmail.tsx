import { Form, Head } from '@inertiajs/react'
import TextLink from '@/components/TextLink'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import AuthLayout from '@/layouts/AuthLayout'
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
            <Button disabled={processing} variant="secondary">
              {processing && <Spinner />}
              Resend verification email
            </Button>

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
