# Hobbiton

Hobbiton is where every Shire Studio Laravel starter kit is grown. Each kit is raised from a stack of shared **smials**, so a fix made once reaches every kit that shares it. When a change lands on `main`, the **quick post** delivers each kit to its own repository.

## The Kits

| Kit | Stack | Repository |
| --- | --- | --- |
| Vue | Inertia, Vue 3, shadcn-vue, Fortify | [shire-studio/laravel-starter-kit-vue](https://github.com/shire-studio/laravel-starter-kit-vue) |
| React | Inertia, React 19, shadcn/ui, Fortify | [shire-studio/laravel-starter-kit-react](https://github.com/shire-studio/laravel-starter-kit-react) |
| Svelte | Inertia, Svelte 5, shadcn-svelte, Fortify | [shire-studio/laravel-starter-kit-svelte](https://github.com/shire-studio/laravel-starter-kit-svelte) |
| Livewire | Livewire 4, Flux, Fortify | [shire-studio/laravel-starter-kit-livewire](https://github.com/shire-studio/laravel-starter-kit-livewire) |
| API | Sanctum tokens, JSON resources | [shire-studio/laravel-starter-kit-api](https://github.com/shire-studio/laravel-starter-kit-api) |
| Blade | Blade views and Tailwind CSS, landing page only | [shire-studio/laravel-starter-kit-blade](https://github.com/shire-studio/laravel-starter-kit-blade) |

Every kit ships the same tooling: Pint (PHP and Blade), Rector, PHPStan at level max, Pest with 100% code and type coverage, Laravel Vet, Boost guidelines and the `.ai` rules. Kits with a frontend add Vite Plus (oxlint and oxfmt) and a TypeScript check.

## Smials

A smial is a folder under `smials/` holding part of a kit. Raising a kit copies its smials in order, so a later smial overrides a file from an earlier one.

| Smial | Holds | Raised into |
| --- | --- | --- |
| `common` | Config, tooling, CI, AI rules and the base test suite | Every kit |
| `auth` | Actions, form requests, models, rules, factories and their unit tests | Vue, React, Svelte, Livewire, API |
| `web` | Session controllers and feature tests that never render a page | Vue, React, Svelte, Livewire |
| `inertia` | Controllers, routes, middleware, Data classes and feature tests | Vue, React, Svelte |
| `inertia-vue`, `inertia-react`, `inertia-svelte` | The frontend, its tooling and its lock files | One kit each |
| `livewire` | Controllers that return Blade views, Livewire components and Flux views | Livewire |
| `api` | JSON controllers, Sanctum and the API tests | API |
| `blade` | The landing page | Blade |

`hobbiton.json` lists every kit with its smials, the files it leaves out and the `{{placeholders}}` it fills in. `raise`, `tend`, `survey`, `deliver` and both CI workflows read it.

The three Inertia kits use the same page names (for example `auth/Login`), so their `app`, `routes` and `tests/Feature` folders are identical byte for byte. Hobbiton's own test suite checks that.

## Getting Started

> Requires PHP 8.5+, Composer, Node 22+ and pnpm.

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
```

## The Commands

| Command | What it does |
| --- | --- |
| `php artisan raise --kit=react` | Raise a kit into `raised/react`, keeping its `vendor`, `node_modules`, `.env` and database |
| `composer tend -- --react` | Run the raised kit with `composer dev` and copy every change back into `smials/` |
| `composer tend -- --react --once` | Copy changes back once, without serving or watching |
| `composer survey` | Raise every kit and run its full `composer test` |
| `composer survey -- --api --tend` | Survey only the API kit, then copy lock files and tool fixes back |
| `composer deliver -- --vue` | Mirror a kit into a local checkout of its repository, without committing |

### Tending a Kit

```bash
php artisan raise --kit=react
composer tend -- --react
```

Edit `raised/react` like any Laravel app. Tend copies each change to the most specific smial that already owns the file and puts new files in the kit's top smial. Placeholders such as `{{kit}}` are restored on the way back. To share a file between more kits, move it to a lower smial yourself and raise again.

> [!WARNING]
> Stop `tend` before raising the same kit again. Raising clears the kit's files, and a running tend would copy those deletions into `smials/`.

### Surveying

`composer survey` raises each kit into `raised/<kit>`, installs it, migrates it, builds its assets and runs its own `composer test`. Installs are kept between surveys, so only the first survey of a kit is slow.

### Delivering

`composer deliver -- --vue` mirrors the Vue kit into `../laravel-starter-kit-vue` (or the folder in `HOBBITON_DELIVER_DIR`). It keeps that checkout's `.git`, `.env`, `vendor` and `node_modules`, and never commits or pushes.

## Lock Files and Vet

Each kit keeps its own `composer.lock`, `pnpm-lock.yaml` and `vet.json` in its top smial, since the kits resolve different packages. The Inertia kits share `vet.json` in `inertia` because their PHP dependencies are identical. After changing a `composer.json` or `package.json`, run `composer survey -- --tend` to refresh the lock files.

## The Quick Post

Merging to `main` runs the **quick post** workflow. It raises every kit and pushes the result to the kit's repository, reusing the merged commit message. It needs a `STARTER_KIT_TOKEN` secret with write access to every kit repository. Releases still happen in each kit repository through its own **release** workflow.

## License

Hobbiton and the starter kits are open source software licensed under the [MIT license](smials/common/LICENSE.md).
