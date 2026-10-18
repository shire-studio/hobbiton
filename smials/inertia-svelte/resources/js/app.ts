import { createInertiaApp } from '@inertiajs/svelte'
import { hydrate, mount } from 'svelte'
import { initializeFlashToast } from '@/lib/flashToast'
import { pageTitle, resolvePage } from '@/lib/inertiaApp'

void createInertiaApp({
  title: pageTitle,
  resolve: resolvePage,
  setup({ el, App, props }) {
    if (el?.dataset.serverRendered === 'true') {
      hydrate(App, { target: el, props })

      return
    }

    mount(App, { target: el!, props })
  },
  progress: {
    color: '#4B5563',
  },
})

// This will set light / dark mode on page load...
initializeTheme()

// This will listen for flash toast data from the server...
initializeFlashToast()
