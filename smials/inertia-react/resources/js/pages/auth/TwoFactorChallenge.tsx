import { Form, Head } from '@inertiajs/react'
import { REGEXP_ONLY_DIGITS } from 'input-otp'
import InputError from '@/components/InputError'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp'
import AuthLayout from '@/layouts/AuthLayout'
import { store } from '@/routes/two-factor/login'
import type { TwoFactorConfigContent } from '@/types'

export default function TwoFactorChallenge() {
  const [showRecoveryInput, setShowRecoveryInput] = useState<boolean>(false)
  const [code, setCode] = useState<string>('')

  const authConfigContent: TwoFactorConfigContent = showRecoveryInput
    ? {
        title: 'Recovery code',
        description:
          'Please confirm access to your account by entering one of your emergency recovery codes.',
        buttonText: 'login using an authentication code',
      }
    : {
        title: 'Authentication code',
        description:
          'Enter the authentication code provided by your authenticator application.',
        buttonText: 'login using a recovery code',
      }

  const toggleRecoveryMode = (clearErrors: () => void): void => {
    setShowRecoveryInput(!showRecoveryInput)
    clearErrors()
    setCode('')
  }

  return (
    <AuthLayout
      title={authConfigContent.title}
      description={authConfigContent.description}
    >
      <Head title="Two-factor authentication" />

      <div className="space-y-6">
        <Form
          {...store.form()}
          className="space-y-4"
          resetOnError
          onError={() => setCode('')}
        >
          {({ errors, processing, clearErrors }) => (
            <>
              {!showRecoveryInput ? (
                <div className="flex flex-col items-center justify-center space-y-3 text-center">
                  <input type="hidden" name="code" value={code} />
                  <div className="flex w-full items-center justify-center">
                    <InputOTP
                      id="otp"
                      value={code}
                      onChange={setCode}
                      maxLength={6}
                      disabled={processing}
                      pattern={REGEXP_ONLY_DIGITS}
                      autoFocus
                    >
                      <InputOTPGroup>
                        {Array.from({ length: 6 }, (_, index) => (
                          <InputOTPSlot key={index} index={index} />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <InputError message={errors.code} />
                </div>
              ) : (
                <>
                  <Input
                    name="recovery_code"
                    type="text"
                    placeholder="Enter recovery code"
                    autoFocus
                    required
                  />
                  <InputError message={errors.recovery_code} />
                </>
              )}

              <Button type="submit" className="w-full" disabled={processing}>
                Continue
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                <span>or you can </span>
                <button
                  type="button"
                  className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                  onClick={() => toggleRecoveryMode(clearErrors)}
                >
                  {authConfigContent.buttonText}
                </button>
              </div>
            </>
          )}
        </Form>
      </div>
    </AuthLayout>
  )
}
