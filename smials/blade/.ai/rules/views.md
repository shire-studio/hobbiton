---
paths:
  - 'resources/views/**/*.blade.php'
  - 'resources/js/**/*.ts'
  - 'vite.config.ts'
  - 'tsconfig.json'
  - 'package.json'
---

# Views

## Blade
Pass data to Blade views from controllers or `Route::view()` and keep logic out of templates. Build reusable markup as anonymous components under `resources/views/components`, and wrap pages in the `x-layouts.app` layout. Pint formats every Blade file through its `Pint/laravel_blade` rule, so run `composer lint` instead of formatting by hand.

## Scripts
Nothing is auto imported. Keep `resources/js` small, write it in strict TypeScript and import every module explicitly. `pnpm run test:types` runs `tsc --noEmit` as part of `composer test:types`.
