import { Form, Head } from '@inertiajs/react'
import InputError from '@/components/InputError'
import TextLink from '@/components/TextLink'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import AuthLayout from '@/layouts/AuthLayout'
import { login } from '@/routes'
import { email } from '@/routes/password'

type Props = {
  status: string | null
}

export default function ForgotPassword({ status }: Props) {
  return (
    <AuthLayout
      title="Forgot password"
      description="Enter your email to receive a password reset link"
    >
      <Head title="Forgot password" />

      {status && (
        <div className="mb-4 text-center text-sm font-medium text-green-600">
          {status}
        </div>
      )}

      <div className="space-y-6">
        <Form {...email.form()}>
          {({ errors, processing, validate }) => (
            <>
              <div className="grid gap-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  autoComplete="off"
                  autoFocus
                  placeholder="email@example.com"
                  onBlur={() => validate('email')}
                />
                <InputError message={errors.email} />
              </div>

              <div className="my-6 flex items-center justify-start">
                <Button
                  className="w-full"
                  disabled={processing}
                  data-test="email-password-reset-link-button"
                >
                  {processing && <Spinner />}
                  Email password reset link
                </Button>
              </div>
            </>
          )}
        </Form>

        <div className="space-x-1 text-center text-sm text-muted-foreground">
          <span>Or, return to</span>
          <TextLink href={login()}>log in</TextLink>
        </div>
      </div>
    </AuthLayout>
  )
}
