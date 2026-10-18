---
paths:
  - 'app/Livewire/**'
  - 'resources/views/**/*.blade.php'
  - 'resources/js/**/*.ts'
  - 'tests/Feature/Livewire/**'
  - 'vite.config.ts'
  - 'tsconfig.json'
  - 'package.json'
---

# Livewire and views

## Pages and forms
Controllers render pages with `view()` and pass every value the view needs. Plain forms post to controller routes, so they share Form Requests and Actions with the Inertia kits. Keep logic out of Blade templates.

## Livewire components
Use class based Livewire components under `app/Livewire` for interactive pieces, with their views under `resources/views/livewire`. Do not write single file or multi file components, because PHPStan, type coverage and code coverage only see classes under `app/`. Mark properties that the browser must not change with `#[Locked]`, and call Actions from component methods instead of putting business logic in the component.

Test every component with `Livewire::test()` under `tests/Feature/Livewire`.

## Flux
Build UI with Flux components before writing custom markup. Show a toast after a redirect by flashing `toast` with a `type` and `message` from the controller. The layout hands it to Flux.

## Formatting and scripts
Pint formats every Blade file through its `Pint/laravel_blade` rule, so run `composer lint` instead of formatting by hand. Livewire injects Livewire and Alpine, so nothing is auto imported. Keep `resources/js` small, write it in strict TypeScript and import every module explicitly.
