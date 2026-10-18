import type { ResolvedComponent } from '@inertiajs/svelte'
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers'

const appName = import.meta.env.VITE_APP_NAME || 'Laravel'

export function pageTitle(title: string): string {
  return title ? `${title} - ${appName}` : appName
}

export function resolvePage(name: string): Promise<ResolvedComponent> {
  return resolvePageComponent(
    `../pages/${name}.svelte`,
    import.meta.glob<ResolvedComponent>('../pages/**/*.svelte'),
  )
}
