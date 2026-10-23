import { usePasskeyRegister } from '@laravel/passkeys/react'
import type { FormEvent } from 'react'
import {
  index as registerOptions,
  store as registerStore,
} from '@/actions/Laravel/Passkeys/Http/Controllers/PasskeyRegistrationController'

type Props = {
  onSuccess: () => void
}

const getDefaultPasskeyName = (): string => {
  const ua = navigator.userAgent

  const browser = [
    { pattern: /Edg|Edge/, name: 'Edge' },
    { pattern: /OPR|Opera|OPiOS/, name: 'Opera' },
    { pattern: /Firefox|FxiOS/, name: 'Firefox' },
    { pattern: /Chrome|CriOS/, name: 'Chrome' },
    { pattern: /Safari/, name: 'Safari' },
  ].find(({ pattern }) => pattern.test(ua))?.name

  const os = [
    { pattern: /iPhone/, name: 'iPhone' },
    { pattern: /iPad|Macintosh(?=.*Mobile)/, name: 'iPad' },
    { pattern: /Android/, name: 'Android' },
    { pattern: /Mac/, name: 'Mac' },
    { pattern: /Windows/, name: 'Windows' },
  ].find(({ pattern }) => pattern.test(ua))?.name

  return [browser, os].filter(Boolean).join(' on ') || ''
}

export default function PasskeyRegister({ onSuccess }: Props) {
  const [name, setName] = useState<string>(getDefaultPasskeyName)
  const [showForm, setShowForm] = useState<boolean>(false)

  const { register, isLoading, error, isSupported } = usePasskeyRegister({
    routes: {
      options: registerOptions.url(),
      submit: registerStore.url(),
    },
    onSuccess: () => {
      setName('')
      setShowForm(false)
      onSuccess()
    },
  })

  const handleSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault()

    if (!name.trim()) {
      return
    }

    await register(name)
  }

  const handleCancel = (): void => {
    setShowForm(false)
    setName('')
  }

  if (!isSupported) {
    return (
      <div className="text-sm text-muted-foreground">
        Passkeys are not supported in this browser.
      </div>
    )
  }

  if (!showForm) {
    return (
      <UiButton variant="outline" onClick={() => setShowForm(true)}>
        Add passkey
      </UiButton>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-border bg-muted/50 p-4"
    >
      <div className="grid gap-2">
        <UiLabel htmlFor="passkey-name">Passkey name</UiLabel>
        <UiInput
          id="passkey-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g., MacBook Pro, iPhone"
          className="mt-1 block w-full border-foreground/20"
          autoFocus
        />
        <p className="text-xs text-muted-foreground">
          A name helps you identify this passkey later.
        </p>
      </div>

      {error && <InputError message={error} />}

      <div className="flex gap-2">
        <UiButton type="submit" disabled={isLoading || !name.trim()}>
          {isLoading ? 'Registering...' : 'Register passkey'}
        </UiButton>
        <UiButton type="button" variant="ghost" onClick={handleCancel}>
          Cancel
        </UiButton>
      </div>
    </form>
  )
}
