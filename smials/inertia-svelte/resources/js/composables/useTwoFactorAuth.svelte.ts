import { qrCode, recoveryCodes, secretKey } from '@/routes/two-factor'

type Ref<T> = { value: T }

export type UseTwoFactorAuthReturn = {
  qrCodeSvg: Ref<string | null>
  manualSetupKey: Ref<string | null>
  recoveryCodesList: Ref<string[]>
  errors: Ref<string[]>
  hasSetupData: { readonly value: boolean }
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

// Shared across every component, like a Vue module-level ref...
const errors = $state<Ref<string[]>>({ value: [] })
const manualSetupKey = $state<Ref<string | null>>({ value: null })
const qrCodeSvg = $state<Ref<string | null>>({ value: null })
const recoveryCodesList = $state<Ref<string[]>>({ value: [] })

const hasSetupData = {
  get value(): boolean {
    return qrCodeSvg.value !== null && manualSetupKey.value !== null
  },
}

export const useTwoFactorAuth = (): UseTwoFactorAuthReturn => {
  const fetchQrCode = async (): Promise<void> => {
    try {
      const { svg } = await fetchJson<{ svg: string; url: string }>(
        qrCode.url(),
      )

      qrCodeSvg.value = svg
    } catch {
      errors.value.push('Failed to fetch QR code')
      qrCodeSvg.value = null
    }
  }

  const fetchSetupKey = async (): Promise<void> => {
    try {
      const { secretKey: key } = await fetchJson<{ secretKey: string }>(
        secretKey.url(),
      )

      manualSetupKey.value = key
    } catch {
      errors.value.push('Failed to fetch a setup key')
      manualSetupKey.value = null
    }
  }

  const clearSetupData = (): void => {
    manualSetupKey.value = null
    qrCodeSvg.value = null
    clearErrors()
  }

  const clearErrors = (): void => {
    errors.value = []
  }

  const clearTwoFactorAuthData = (): void => {
    clearSetupData()
    recoveryCodesList.value = []
  }

  const fetchRecoveryCodes = async (): Promise<void> => {
    try {
      clearErrors()
      recoveryCodesList.value = await fetchJson<string[]>(recoveryCodes.url())
    } catch {
      errors.value.push('Failed to fetch recovery codes')
      recoveryCodesList.value = []
    }
  }

  const fetchSetupData = async (): Promise<void> => {
    clearErrors()
    await Promise.all([fetchQrCode(), fetchSetupKey()])
  }

  return {
    qrCodeSvg,
    manualSetupKey,
    recoveryCodesList,
    errors,
    hasSetupData,
    clearSetupData,
    clearErrors,
    clearTwoFactorAuthData,
    fetchQrCode,
    fetchSetupKey,
    fetchSetupData,
    fetchRecoveryCodes,
  }
}
