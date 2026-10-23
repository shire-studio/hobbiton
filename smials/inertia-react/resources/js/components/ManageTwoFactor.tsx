import { ShieldCheck } from 'lucide-react'
import { disable, enable } from '@/routes/two-factor'

type Props = {
  canManageTwoFactor: boolean
  requiresConfirmation: boolean
  twoFactorEnabled: boolean
}

export default function ManageTwoFactor({
  canManageTwoFactor,
  requiresConfirmation,
  twoFactorEnabled,
}: Props) {
  const { hasSetupData, clearTwoFactorAuthData } = useTwoFactorAuth()
  const [showSetupModal, setShowSetupModal] = useState<boolean>(false)

  useEffect(() => () => clearTwoFactorAuthData(), [clearTwoFactorAuthData])

  if (!canManageTwoFactor) {
    return null
  }

  return (
    <div className="space-y-6">
      <Heading
        variant="small"
        title="Two-factor authentication"
        description="Manage your two-factor authentication settings"
      />

      {!twoFactorEnabled ? (
        <div className="flex flex-col items-start justify-start space-y-4">
          <p className="text-sm text-muted-foreground">
            When you enable two-factor authentication, you will be prompted for
            a secure pin during login. This pin can be retrieved from a
            TOTP-supported application on your phone.
          </p>

          <div>
            {hasSetupData ? (
              <UiButton onClick={() => setShowSetupModal(true)}>
                <ShieldCheck />
                Continue setup
              </UiButton>
            ) : (
              <Form
                {...enable.form()}
                onSuccess={() => setShowSetupModal(true)}
              >
                {({ processing }) => (
                  <UiButton type="submit" disabled={processing}>
                    Enable 2FA
                  </UiButton>
                )}
              </Form>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-start justify-start space-y-4">
          <p className="text-sm text-muted-foreground">
            You will be prompted for a secure, random pin during login, which
            you can retrieve from the TOTP-supported application on your phone.
          </p>

          <div className="relative inline">
            <Form {...disable.form()}>
              {({ processing }) => (
                <UiButton
                  variant="destructive"
                  type="submit"
                  disabled={processing}
                >
                  Disable 2FA
                </UiButton>
              )}
            </Form>
          </div>

          <TwoFactorRecoveryCodes />
        </div>
      )}

      <TwoFactorSetupModal
        isOpen={showSetupModal}
        onOpenChange={setShowSetupModal}
        requiresConfirmation={requiresConfirmation}
        twoFactorEnabled={twoFactorEnabled}
      />
    </div>
  )
}
