import { Form } from '@inertiajs/react'
import { REGEXP_ONLY_DIGITS } from 'input-otp'
import { Check, Copy, ScanLine } from 'lucide-react'
import AlertError from '@/components/AlertError'
import InputError from '@/components/InputError'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp'
import { Spinner } from '@/components/ui/spinner'
import { confirm } from '@/routes/two-factor'
import type { TwoFactorConfigContent } from '@/types'

type Props = {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  requiresConfirmation: boolean
  twoFactorEnabled: boolean
}

export default function TwoFactorSetupModal({
  isOpen,
  onOpenChange,
  requiresConfirmation,
  twoFactorEnabled,
}: Props) {
  const { resolvedAppearance } = useAppearance()
  const { copy, copied } = useClipboard()
  const { qrCodeSvg, manualSetupKey, clearSetupData, fetchSetupData, errors } =
    useTwoFactorAuth()

  const [showVerificationStep, setShowVerificationStep] = useState(false)
  const [code, setCode] = useState<string>('')
  const pinInputContainerRef = useRef<HTMLDivElement>(null)

  const modalConfig: TwoFactorConfigContent = twoFactorEnabled
    ? {
        title: 'Two-factor authentication enabled',
        description:
          'Two-factor authentication is now enabled. Scan the QR code or enter the setup key in your authenticator app.',
        buttonText: 'Close',
      }
    : showVerificationStep
      ? {
          title: 'Verify authentication code',
          description: 'Enter the 6-digit code from your authenticator app',
          buttonText: 'Continue',
        }
      : {
          title: 'Enable two-factor authentication',
          description:
            'To finish enabling two-factor authentication, scan the QR code or enter the setup key in your authenticator app',
          buttonText: 'Continue',
        }

  const handleModalNextStep = () => {
    if (requiresConfirmation) {
      setShowVerificationStep(true)

      setTimeout(() => {
        pinInputContainerRef.current?.querySelector('input')?.focus()
      })

      return
    }

    clearSetupData()
    onOpenChange(false)
  }

  useEffect(() => {
    if (!isOpen) {
      if (twoFactorEnabled) {
        clearSetupData()
      }

      setShowVerificationStep(false)
      setCode('')

      return
    }

    if (!qrCodeSvg) {
      void fetchSetupData()
    }
    // Only react to the modal opening and closing, like the Vue watcher...
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex items-center justify-center">
          <div className="mb-3 w-auto rounded-full border border-border bg-card p-0.5 shadow-sm">
            <div className="relative overflow-hidden rounded-full border border-border bg-muted p-2.5">
              <div className="absolute inset-0 grid grid-cols-5 opacity-50">
                {Array.from({ length: 5 }, (_, i) => (
                  <div
                    key={`col-${i}`}
                    className="border-r border-border last:border-r-0"
                  />
                ))}
              </div>
              <div className="absolute inset-0 grid grid-rows-5 opacity-50">
                {Array.from({ length: 5 }, (_, i) => (
                  <div
                    key={`row-${i}`}
                    className="border-b border-border last:border-b-0"
                  />
                ))}
              </div>
              <ScanLine className="relative z-20 size-6 text-foreground" />
            </div>
          </div>
          <DialogTitle>{modalConfig.title}</DialogTitle>
          <DialogDescription className="text-center">
            {modalConfig.description}
          </DialogDescription>
        </DialogHeader>

        <div className="relative flex w-auto flex-col items-center justify-center space-y-5">
          {!showVerificationStep ? (
            errors.length ? (
              <AlertError errors={errors} />
            ) : (
              <>
                <div className="relative mx-auto flex max-w-md items-center overflow-hidden">
                  <div className="relative mx-auto aspect-square w-64 overflow-hidden rounded-lg border border-border">
                    {!qrCodeSvg ? (
                      <div className="absolute inset-0 z-10 flex aspect-square h-auto w-full animate-pulse items-center justify-center bg-background">
                        <Spinner className="size-6" />
                      </div>
                    ) : (
                      <div className="relative z-10 overflow-hidden border p-5">
                        <div
                          dangerouslySetInnerHTML={{ __html: qrCodeSvg }}
                          className="flex aspect-square size-full items-center justify-center"
                          style={{
                            filter:
                              resolvedAppearance === 'dark'
                                ? 'invert(1) brightness(1.5)'
                                : undefined,
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex w-full items-center space-x-5">
                  <Button className="w-full" onClick={handleModalNextStep}>
                    {modalConfig.buttonText}
                  </Button>
                </div>

                <div className="relative flex w-full items-center justify-center">
                  <div className="absolute inset-0 top-1/2 h-px w-full bg-border" />
                  <span className="relative bg-card px-2 py-1">
                    or, enter the code manually
                  </span>
                </div>

                <div className="flex w-full items-center justify-center space-x-2">
                  <div className="flex w-full items-stretch overflow-hidden rounded-xl border border-border">
                    {!manualSetupKey ? (
                      <div className="flex h-full w-full items-center justify-center bg-muted p-3">
                        <Spinner />
                      </div>
                    ) : (
                      <>
                        <input
                          type="text"
                          readOnly
                          value={manualSetupKey}
                          className="h-full w-full bg-background p-3 text-foreground"
                        />
                        <button
                          onClick={() => void copy(manualSetupKey)}
                          className="relative block h-auto border-l border-border px-3 hover:bg-muted"
                        >
                          {copied ? (
                            <Check className="w-4 text-green-500" />
                          ) : (
                            <Copy className="w-4" />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </>
            )
          ) : (
            <Form
              {...confirm.form()}
              errorBag="confirmTwoFactorAuthentication"
              resetOnError
              onFinish={() => setCode('')}
              onSuccess={() => onOpenChange(false)}
            >
              {({ errors, processing }) => (
                <>
                  <input type="hidden" name="code" value={code} />
                  <div
                    ref={pinInputContainerRef}
                    className="relative w-full space-y-3"
                  >
                    <div className="flex w-full flex-col items-center justify-center space-y-3 py-2">
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
                      <InputError message={errors.code} />
                    </div>

                    <div className="flex w-full items-center space-x-5">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-auto flex-1"
                        onClick={() => setShowVerificationStep(false)}
                        disabled={processing}
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        className="w-auto flex-1"
                        disabled={processing || code.length < 6}
                      >
                        Confirm
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </Form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
