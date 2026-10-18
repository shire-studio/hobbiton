import { createInertiaApp } from '@inertiajs/svelte'
import createServer from '@inertiajs/svelte/server'
import { render } from 'svelte/server'
import { pageTitle, resolvePage } from '@/lib/inertiaApp'

createServer(
  (page) =>
    createInertiaApp({
      page,
      title: pageTitle,
      resolve: resolvePage,
      setup: ({ App, props }) => render(App, { props }),
    }),
  { cluster: true },
)
