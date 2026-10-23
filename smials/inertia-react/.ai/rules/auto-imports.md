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
This project uses `unplugin-auto-import`, powered by unimport, for Nuxt-like runtime imports. Do not explicitly import runtime APIs registered in the `AutoImport` block in `vite.config.ts`. This includes the React preset (`useState`, `useEffect`, `useRef`, `useId`, `useSyncExternalStore` and friends), the listed Inertia APIs (`usePage`, `useForm`, `useRemember`, `usePrefetch`, `router`), named runtime exports from direct files under `resources/js/composables`, and the components described below.

Only direct composable files are scanned. Add an explicit glob in Vite before placing auto-imported composables in nested directories. Avoid export names that collide with React, Inertia, or another composable.

Keep type-only imports explicit. Explicitly import Wayfinder routes and actions, package APIs not registered in Vite, utilities under `resources/js/lib`, icons, and non-component exports from `resources/js/components/ui` such as `useSidebar` and `buttonVariants`.

## Components
Default exports from direct files under `resources/js/components` and from every file under `resources/js/layouts` are auto-imported by file name, such as `AppLogo`, `AuthCardLayout`, and `SettingsLayout`. Name each component file after its component. File names mirror the Vue and Svelte kits so the three frontends stay structurally identical.

shadcn/ui primitives keep their generated kebab-case files under `resources/js/components/ui`. Every PascalCase export from those files is auto-imported with a `Ui` prefix, such as `UiButton` and `UiDropdownMenuItem`, matching the Vue kit. Restart Vite after adding a shadcn/ui component so it is registered.

Use Inertia `Link`, `Form`, `Head` and `Deferred` directly in JSX.

## Generated declarations
Never edit or commit `auto-imports.d.ts`. Vite generates it and `tsconfig.json` includes it. Auto-import declarations use overwrite mode so removed exports do not remain as stale globals.

Run `pnpm run build` to regenerate declarations from a clean state, then run `pnpm run test:lint` and `pnpm run test:types`.
