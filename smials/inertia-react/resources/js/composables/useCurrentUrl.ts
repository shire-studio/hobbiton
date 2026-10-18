import type { InertiaLinkProps } from '@inertiajs/react'
import { toUrl } from '@/lib/utils'

export type UseCurrentUrlReturn = {
  isCurrentUrl: (
    urlToCheck: NonNullable<InertiaLinkProps['href']>,
    startsWith?: boolean,
  ) => boolean
  isCurrentOrParentUrl: (
    urlToCheck: NonNullable<InertiaLinkProps['href']>,
  ) => boolean
  whenCurrentUrl: <T, F = null>(
    urlToCheck: NonNullable<InertiaLinkProps['href']>,
    ifTrue: T,
    ifFalse?: F,
  ) => T | F
}

export function useCurrentUrl(): UseCurrentUrlReturn {
  const page = usePage()
  const currentUrl = new URL(
    page.url,
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost',
  ).pathname

  function isCurrentUrl(
    urlToCheck: NonNullable<InertiaLinkProps['href']>,
    startsWith: boolean = false,
  ) {
    const urlString = toUrl(urlToCheck)

    const comparePath = (path: string): boolean =>
      startsWith ? currentUrl.startsWith(path) : path === currentUrl

    if (!urlString.startsWith('http')) {
      return comparePath(urlString)
    }

    try {
      const absoluteUrl = new URL(urlString)

      return comparePath(absoluteUrl.pathname)
    } catch {
      return false
    }
  }

  function isCurrentOrParentUrl(
    urlToCheck: NonNullable<InertiaLinkProps['href']>,
  ) {
    return isCurrentUrl(urlToCheck, true)
  }

  function whenCurrentUrl<T, F = null>(
    urlToCheck: NonNullable<InertiaLinkProps['href']>,
    ifTrue: T,
    ifFalse: F = null as F,
  ): T | F {
    return isCurrentUrl(urlToCheck) ? ifTrue : ifFalse
  }

  return {
    isCurrentUrl,
    isCurrentOrParentUrl,
    whenCurrentUrl,
  }
}
