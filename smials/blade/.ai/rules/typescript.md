---
paths:
  - 'resources/js/**/*.ts'
  - 'resources/views/**/*.blade.php'
  - 'tsconfig.json'
  - 'package.json'
---

# Views and TypeScript

## Views
Pass data to Blade views from controllers or `Route::view()` and keep logic out of templates. Build reusable markup as anonymous components under `resources/views/components`. Pint formats every Blade file through its `Pint/laravel_blade` rule, so run `composer lint` instead of formatting by hand.

## TypeScript
Write browser code in strict TypeScript under `resources/js`. `pnpm run test:types` runs `tsc --noEmit` as part of `composer test:types`.
