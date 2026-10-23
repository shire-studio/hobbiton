---
paths:
  - 'resources/js/**/*.js'
  - 'resources/js/**/*.jsx'
  - 'resources/js/**/*.ts'
  - 'resources/js/**/*.svelte'
  - 'vite.config.ts'
  - 'tsconfig.json'
  - 'package.json'
  - 'auto-imports.d.ts'
---

# Svelte auto imports

## Runtime identifiers
This project uses `unplugin-auto-import`, powered by unimport, for Nuxt-like runtime imports. Do not explicitly import runtime APIs registered in the `AutoImport` block in `vite.config.ts`. This includes the Svelte preset (`onMount`, `onDestroy`, `tick`, `untrack` and friends), the listed Inertia APIs (`page`, `router`, `useForm`, `useRemember`), named runtime exports from direct files under `resources/js/composables`, and the components described below.

Only direct composable files are scanned. Add an explicit glob in Vite before placing auto-imported composables in nested directories. Avoid export names that collide with Svelte, Inertia, or another composable. Composables that hold runes state use the `.svelte.ts` extension and expose state as `{ value }` objects, mirroring Vue refs.

Keep type-only imports explicit. Explicitly import Wayfinder routes and actions, package APIs not registered in Vite, utilities under `resources/js/lib`, icons, and non-component exports from `resources/js/components/ui` such as `useSidebar` and `navigationMenuTriggerStyle`.

## Components
Components in direct files under `resources/js/components` and in every file under `resources/js/layouts` are auto-imported by file name, such as `AppLogo`, `AuthCardLayout`, and `SettingsLayout`. File names mirror the Vue and React kits so the three frontends stay structurally identical. Vite reads the list when it starts, so restart it after adding a component, a layout, or a shadcn-svelte component.

shadcn-svelte primitives keep their generated kebab-case folders under `resources/js/components/ui`. Every PascalCase export from a folder's `index.ts` is auto-imported with a `Ui` prefix, such as `UiButton` and `UiDropdownMenuItem`, matching the Vue kit.

Use Inertia `Link`, `Form` and `Deferred` directly in markup. Set page titles with `AppHead`, which wraps `<svelte:head>`.

## Generated declarations
Never edit or commit `auto-imports.d.ts`. Vite generates it and `tsconfig.json` includes it. Auto-import declarations use overwrite mode so removed exports do not remain as stale globals.

Run `pnpm run build` to regenerate declarations from a clean state, then run `pnpm run test:lint` and `pnpm run test:types`.
