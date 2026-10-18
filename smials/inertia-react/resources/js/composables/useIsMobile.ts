const MOBILE_BREAKPOINT = 768

const mediaQuery = () =>
  window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)

const subscribe = (callback: () => void) => {
  const query = mediaQuery()
  query.addEventListener('change', callback)

  return () => query.removeEventListener('change', callback)
}

export function useIsMobile(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => mediaQuery().matches,
    () => false,
  )
}
