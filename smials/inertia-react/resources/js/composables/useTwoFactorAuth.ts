import { qrCode, recoveryCodes, secretKey } from '@/routes/two-factor'

type TwoFactorState = {
  qrCodeSvg: string | null
  manualSetupKey: string | null
  recoveryCodesList: string[]
  errors: string[]
}

export type UseTwoFactorAuthReturn = TwoFactorState & {
  hasSetupData: boolean
  clearSetupData: () => void
  clearErrors: () => void
  clearTwoFactorAuthData: () => void
  fetchQrCode: () => Promise<void>
  fetchSetupKey: () => Promise<void>
  fetchSetupData: () => Promise<void>
  fetchRecoveryCodes: () => Promise<void>
}

const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status}`)
  }

  return response.json()
}

// Shared across every component that uses the hook, like a Vue module-level ref...
const initialState: TwoFactorState = {
  qrCodeSvg: null,
  manualSetupKey: null,
  recoveryCodesList: [],
  errors: [],
}

let state = initialState
const listeners = new Set<() => void>()

const subscribe = (listener: () => void) => {
  listeners.add(listener)

  return () => listeners.delete(listener)
}

const setState = (changes: Partial<TwoFactorState>) => {
  state = { ...state, ...changes }
  listeners.forEach((listener) => listener())
}

const pushError = (error: string) =>
  setState({ errors: [...state.errors, error] })

const clearErrors = (): void => setState({ errors: [] })

const clearSetupData = (): void =>
  setState({ manualSetupKey: null, qrCodeSvg: null, errors: [] })

const clearTwoFactorAuthData = (): void => setState({ ...initialState })

const fetchQrCode = async (): Promise<void> => {
  try {
    const { svg } = await fetchJson<{ svg: string; url: string }>(qrCode.url())

    setState({ qrCodeSvg: svg })
  } catch {
    pushError('Failed to fetch QR code')
    setState({ qrCodeSvg: null })
  }
}

const fetchSetupKey = async (): Promise<void> => {
  try {
    const { secretKey: key } = await fetchJson<{ secretKey: string }>(
      secretKey.url(),
    )

    setState({ manualSetupKey: key })
  } catch {
    pushError('Failed to fetch a setup key')
    setState({ manualSetupKey: null })
  }
}

const fetchRecoveryCodes = async (): Promise<void> => {
  try {
    clearErrors()
    setState({
      recoveryCodesList: await fetchJson<string[]>(recoveryCodes.url()),
    })
  } catch {
    pushError('Failed to fetch recovery codes')
    setState({ recoveryCodesList: [] })
  }
}

const fetchSetupData = async (): Promise<void> => {
  clearErrors()
  await Promise.all([fetchQrCode(), fetchSetupKey()])
}

export const useTwoFactorAuth = (): UseTwoFactorAuthReturn => {
  const current = useSyncExternalStore(
    subscribe,
    () => state,
    () => initialState,
  )

  return {
    ...current,
    hasSetupData: current.qrCodeSvg !== null && current.manualSetupKey !== null,
    clearSetupData,
    clearErrors,
    clearTwoFactorAuthData,
    fetchQrCode,
    fetchSetupKey,
    fetchSetupData,
    fetchRecoveryCodes,
  }
}
