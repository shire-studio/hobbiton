import { createInertiaApp } from '@inertiajs/react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { TooltipProvider } from '@/components/ui/tooltip'
import { initializeFlashToast } from '@/lib/flashToast'
import { pageTitle, resolvePage } from '@/lib/inertiaApp'

void createInertiaApp({
  title: pageTitle,
  resolve: resolvePage,
  setup({ el, App, props }) {
    const app = (
      <TooltipProvider delayDuration={0}>
        <App {...props} />
      </TooltipProvider>
    )

    if (el.hasChildNodes()) {
      hydrateRoot(el, app)

      return
    }

    createRoot(el).render(app)
  },
  progress: {
    color: '#4B5563',
  },
})

// This will set light / dark mode on page load...
initializeTheme()

// This will listen for flash toast data from the server...
initializeFlashToast()
