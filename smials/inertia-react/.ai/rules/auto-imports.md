---
paths:
  - 'resources/js/**/*.js'
  - 'resources/js/**/*.jsx'
  - 'resources/js/**/*.ts'
  - 'resources/js/**/*.tsx'
  - 'vite.config.ts'
  - 'tsconfig.json'
  - 'package.json'
  - 'auto-imports.d.ts'
---

# React auto imports

## Runtime identifiers
This project uses `unplugin-auto-import`, powered by unimport, for Nuxt-like runtime imports. Do not explicitly import runtime APIs registered in the `AutoImport` block in `vite.config.ts`. This includes the React preset (`useState`, `useEffect`, `useRef`, `useId`, `useSyncExternalStore` and friends), the listed Inertia APIs (`usePage`, `useForm`, `useRemember`, `usePrefetch`, `router`), and named runtime exports from direct files under `resources/js/composables`.

Only direct composable files are scanned. Add an explicit glob in Vite before placing auto-imported composables in nested directories. Avoid export names that collide with React, Inertia, or another composable.

Keep type-only imports explicit. Explicitly import Wayfinder routes and actions, package APIs not registered in Vite, utilities under `resources/js/lib`, and every component.

## Components
Components are not auto-imported. Import them explicitly with their PascalCase file name, for example `import AppLogo from '@/components/AppLogo'`. File names mirror the Vue and Svelte kits so the three frontends stay structurally identical. shadcn/ui primitives keep their generated kebab-case names under `resources/js/components/ui`.

Use Inertia `Link`, `Form`, `Head` and `Deferred` by importing them from `@inertiajs/react`.

## Generated declarations
Never edit or commit `auto-imports.d.ts`. Vite generates it and `tsconfig.json` includes it. Auto-import declarations use overwrite mode so removed exports do not remain as stale globals.

Run `pnpm run build` to regenerate declarations from a clean state, then run `pnpm run test:lint` and `pnpm run test:types`.
