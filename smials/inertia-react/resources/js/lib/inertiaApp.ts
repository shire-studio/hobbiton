import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers'
import type { ComponentType } from 'react'

const appName = import.meta.env.VITE_APP_NAME || 'Laravel'

export function pageTitle(title: string): string {
  return title ? `${title} - ${appName}` : appName
}

export function resolvePage(name: string): Promise<ComponentType> {
  return resolvePageComponent(
    `../pages/${name}.tsx`,
    import.meta.glob<ComponentType>('../pages/**/*.tsx'),
  )
}
