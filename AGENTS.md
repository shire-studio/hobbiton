# Hobbiton Guide

Hobbiton raises six Laravel starter kits (Vue, React, Svelte, Livewire, API, Blade) from shared smials under `smials/`. Read `README.md` for the full picture. These rules matter most when you change code here.

## Where a change belongs

- `raised/` is disposable. Edit inside `smials/`, or edit a raised kit and run `composer tend -- --<kit> --once` so the change is copied back.
- Put a change in the lowest smial that every affected kit shares. A change to an Action belongs in `auth`, a controller change for every Inertia kit belongs in `inertia`, and a component change belongs in the frontend smial.
- When you change a frontend component, make the same change in `inertia-vue`, `inertia-react` and `inertia-svelte`. File names, props and copy stay identical across the three. `livewire` mirrors the same screens with Flux.
- `hobbiton.json` defines each kit's smials, excluded files and placeholders. Update it when you add a smial or a kit.

## Verifying

- `composer test` runs Hobbiton's own tests, including the check that the Inertia kits share identical PHP.
- `composer survey -- --<kit>` runs a kit's full `composer test` (Pint, Rector, oxlint, PHPStan, TypeScript, type coverage and 100% code coverage). Add `--tend` to copy lock files and formatter fixes back.
- Survey every kit a shared smial feeds before you finish.
- `composer harvest` updates every kit's dependencies. A person runs it, because Vet asks them which releases to trust.
