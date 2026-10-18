import { KeyRound } from 'lucide-react'
import { destroy } from '@/actions/Laravel/Passkeys/Http/Controllers/PasskeyRegistrationController'
import Heading from '@/components/Heading'
import PasskeyItem from '@/components/PasskeyItem'
import PasskeyRegister from '@/components/PasskeyRegister'

type Props = {
  canManagePasskeys: boolean
  passkeys: App.Data.PasskeyData[]
}

export default function ManagePasskeys({ canManagePasskeys, passkeys }: Props) {
  const handleDelete = (id: string, onError: () => void): void => {
    router.delete(destroy.url(id), {
      preserveScroll: true,
      onError,
    })
  }

  const handleRegisterSuccess = (): void => {
    router.reload()
  }

  if (!canManagePasskeys) {
    return null
  }

  return (
    <div className="space-y-6">
      <Heading
        variant="small"
        title="Passkeys"
        description="Manage your passkeys for passwordless sign-in"
      />

      <div className="overflow-hidden rounded-lg border border-border">
        {passkeys.length ? (
          passkeys.map((passkey) => (
            <PasskeyItem
              key={passkey.id}
              passkey={passkey}
              onRemove={handleDelete}
            />
          ))
        ) : (
          <div className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <KeyRound className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="font-medium">No passkeys yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a passkey to sign in without a password
            </p>
          </div>
        )}
      </div>

      <PasskeyRegister onSuccess={handleRegisterSuccess} />
    </div>
  )
}
