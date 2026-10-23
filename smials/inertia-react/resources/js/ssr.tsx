import { createInertiaApp } from '@inertiajs/react'
import createServer from '@inertiajs/react/server'
import { renderToString } from 'react-dom/server'
import { pageTitle, resolvePage } from '@/lib/inertiaApp'

createServer(
  (page) =>
    createInertiaApp({
      page,
      render: renderToString,
      title: pageTitle,
      resolve: resolvePage,
      setup: ({ App, props }) => (
        <UiTooltipProvider delayDuration={0}>
          <App {...props} />
        </UiTooltipProvider>
      ),
    }),
  { cluster: true },
)
