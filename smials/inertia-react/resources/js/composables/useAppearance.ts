import type { Appearance, ResolvedAppearance } from '@/types'

export type { Appearance, ResolvedAppearance }

export type UseAppearanceReturn = {
  appearance: Appearance
  resolvedAppearance: ResolvedAppearance
  updateAppearance: (value: Appearance) => void
}

export function updateTheme(value: Appearance): void {
  if (typeof window === 'undefined') {
    return
  }

  if (value === 'system') {
    const mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)')
    const systemTheme = mediaQueryList.matches ? 'dark' : 'light'

    document.documentElement.classList.toggle('dark', systemTheme === 'dark')
  } else {
    document.documentElement.classList.toggle('dark', value === 'dark')
  }
}

const setCookie = (name: string, value: string, days = 365) => {
  if (typeof document === 'undefined') {
    return
  }

  const maxAge = days * 24 * 60 * 60

  document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`
}

const mediaQuery = () => {
  if (typeof window === 'undefined') {
    return null
  }

  return window.matchMedia('(prefers-color-scheme: dark)')
}

const getStoredAppearance = () => {
  if (typeof window === 'undefined') {
    return null
  }

  return localStorage.getItem('appearance') as Appearance | null
}

const prefersDark = (): boolean => {
  if (typeof window === 'undefined') {
    return false
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

const handleSystemThemeChange = () => {
  const currentAppearance = getStoredAppearance()

  updateTheme(currentAppearance || 'system')
}

export function initializeTheme(): void {
  if (typeof window === 'undefined') {
    return
  }

  // Initialize theme from saved preference or default to system...
  const savedAppearance = getStoredAppearance()
  updateTheme(savedAppearance || 'system')

  // Set up system theme change listener...
  mediaQuery()?.addEventListener('change', handleSystemThemeChange)
}

// Shared across every component that uses the hook, like a Vue module-level ref...
let appearance: Appearance = 'system'
const listeners = new Set<() => void>()

const subscribe = (listener: () => void) => {
  listeners.add(listener)

  return () => listeners.delete(listener)
}

const setAppearance = (value: Appearance) => {
  appearance = value
  listeners.forEach((listener) => listener())
}

export function useAppearance(): UseAppearanceReturn {
  const current = useSyncExternalStore(
    subscribe,
    () => appearance,
    () => 'system' as Appearance,
  )

  useEffect(() => {
    const savedAppearance = getStoredAppearance()

    if (savedAppearance) {
      setAppearance(savedAppearance)
    }
  }, [])

  const resolvedAppearance: ResolvedAppearance =
    current === 'system' ? (prefersDark() ? 'dark' : 'light') : current

  function updateAppearance(value: Appearance) {
    setAppearance(value)

    // Store in localStorage for client-side persistence...
    localStorage.setItem('appearance', value)

    // Store in cookie for SSR...
    setCookie('appearance', value)

    updateTheme(value)
  }

  return {
    appearance: current,
    resolvedAppearance,
    updateAppearance,
  }
}
