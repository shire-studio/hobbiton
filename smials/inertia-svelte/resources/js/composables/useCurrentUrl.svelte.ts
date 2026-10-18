import type { LinkComponentBaseProps } from '@inertiajs/core'
import { toUrl } from '@/lib/utils'

type Href = NonNullable<LinkComponentBaseProps['href']>

export type UseCurrentUrlReturn = {
  isCurrentUrl: (urlToCheck: Href, startsWith?: boolean) => boolean
  isCurrentOrParentUrl: (urlToCheck: Href) => boolean
  whenCurrentUrl: <T, F = null>(
    urlToCheck: Href,
    ifTrue: T,
    ifFalse?: F,
  ) => T | F
}

const currentUrl = () =>
  new URL(
    page.url,
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost',
  ).pathname

export function useCurrentUrl(): UseCurrentUrlReturn {
  function isCurrentUrl(urlToCheck: Href, startsWith: boolean = false) {
    const urlToCompare = currentUrl()
    const urlString = toUrl(urlToCheck)

    const comparePath = (path: string): boolean =>
      startsWith ? urlToCompare.startsWith(path) : path === urlToCompare

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

  function isCurrentOrParentUrl(urlToCheck: Href) {
    return isCurrentUrl(urlToCheck, true)
  }

  function whenCurrentUrl<T, F = null>(
    urlToCheck: Href,
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
