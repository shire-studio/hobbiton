import { createInertiaApp } from '@inertiajs/react'
import createServer from '@inertiajs/react/server'
import { renderToString } from 'react-dom/server'
import { TooltipProvider } from '@/components/ui/tooltip'
import { pageTitle, resolvePage } from '@/lib/inertiaApp'

createServer(
  (page) =>
    createInertiaApp({
      page,
      render: renderToString,
      title: pageTitle,
      resolve: resolvePage,
      setup: ({ App, props }) => (
        <TooltipProvider delayDuration={0}>
          <App {...props} />
        </TooltipProvider>
      ),
    }),
  { cluster: true },
)
