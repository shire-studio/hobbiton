# Harvest: Weekly Dependency Updates for Every Kit

## Why

Dependencies are bumped every week. Before Hobbiton there was one Vue kit and the routine was done by hand inside it:

1. `composer update`, approving each new release through Laravel Vet.
2. `pnpx taze` to see what is out of date, then `pnpx taze -w` to write the minor and patch bumps.
3. Check the majors, then upgrade each major npm dependency by hand, working through any code changes it needs.

There are now six kits raised from shared smials, plus Hobbiton's own dependencies. Done by hand, the mechanical part runs six times, every update has to go through raise and tend, and the same PHP release is reviewed in Vet up to five times. `composer survey -- --tend` does not help here because it only refreshes lock hashes and never moves a version.

Harvest is one command that does the mechanical part for every kit and leaves only the judgement calls: reviewing new PHP releases in Vet (once each), and deciding on majors (one at a time, by hand).

## Goals

- One command, `composer harvest`, that updates every kit and Hobbiton itself.
- Each new PHP release is reviewed in Vet once per run, not once per kit.
- npm patch and minor updates are written to `package.json` ranges the way `taze -w` does today.
- Majors are never applied. They are reported once, across Composer and npm, with the kits each one affects.
- Every updated kit is surveyed, and its lock files, `package.json` and `vet.json` end up in `smials/`. The working tree looks like PR #8 (`62b500e`).

## Non-goals

- Applying majors, or helping with them. The user does each major by hand, one at a time.
- Committing, pushing or opening a pull request. The user reviews the working tree and commits.
- Running in CI or on a schedule. Vet approvals are interactive, so this runs on the user's machine.
- Changing the CI pnpm version or the Playwright install step.

## Anti-goals

These would make Harvest a failure even if it technically works:

- **Skipping or weakening Vet review.** Every release that is new to the run must still stop for the user. Carrying an approval forward is only acceptable for the exact same version and hash the user already approved in this run.
- **Writing a version that pnpm or Vet would refuse.** Harvest must honour the release age holdbacks (Vet's `minimum-release-age` of 2 days, and pnpm's own holdback with its `minimumReleaseAgeExclude` lists). A range bumped to a release that is too new breaks the next install.
- **Losing work in `smials/`.** The update runs in `raised/<kit>` and must be tended back before anything raises that kit again (raising clears the kit's files).
- **Leaving the Inertia kits out of step.** Vue, React and Svelte share `smials/inertia/composer.json` and `smials/inertia/vet.json` but each keeps its own `composer.lock`. They must resolve the same PHP versions.

## How It Works

The user's decisions are marked as theirs. Everything marked "my call" was decided while writing this and can be changed.

### The command

- `composer harvest`, a Node script at `scripts/harvest.js` beside `raise`, `tend`, `survey` and `deliver`, wired up in `composer.json` and `package.json` the same way (with `Composer\\Config::disableProcessTimeout`). The name fits the Shire naming (my call).
- Takes the same kit flags as `survey` through `parseArgs` in `scripts/helpers.js`, so `composer harvest -- --vue --api` updates only those kits.
- Hobbiton's own dependencies are updated only on a full run with no kit flags (my call).

### Two phases

All the interactive work comes first, so the user answers every Vet prompt up front and can walk away while the kits are tested (theirs).

**Phase 1: update.** For each selected kit, in the order of `hobbiton.json`:

1. Raise it and install it, as `survey` does today.
2. Seed the raised kit's `vet.json` with every approval given earlier in this run (see below).
3. Run `composer update` in `raised/<kit>` with a TTY, so Vet can stop and ask about anything new. Any package rejected earlier in the run is held at its current version (see below).
4. Run `composer bump` so the lower bounds in `composer.json` follow the locked versions, as the user does by hand today (theirs). This is what moved `laravel/wayfinder` from `^0.1.21` to `^0.1.23` in PR #8.
5. For kits with `node: true`, run taze in write mode for patches and minors, with a maturity period that matches the release holdback. Then run `pnpm update` so transitive packages inside existing ranges move too, as `composer update` does for PHP (my call, the old routine did not include this step).
6. Run `tend --once` for the kit so the updated files reach `smials/`.
7. Collect the kit's majors and held packages for the final report.

**Phase 2: survey.** Run `survey --tend` for every kit updated in phase 1, so each is raised again from the updated smials, fully tested, and any tool fixes come back. No prompts happen here.

If one kit fails, carry on with the rest and report the failures at the end with a non zero exit, as `survey` does (my call). If the run is interrupted part way through a kit in phase 1, nothing from that kit is tended, so its smials stay as they were (my call).

### Rejecting a release in Vet

When the user rejects a release, Harvest holds that one package at its currently locked version and keeps every other update for the kit (theirs). The rejection carries forward for the rest of the run: every later kit holds the same package at its current version without asking again, so the Inertia kits never end up with a release one of them rejected.

Rejected packages appear in the final report so the user can look at them again next week. How Harvest learns which package was rejected and how it retries the update with that package held (for example Composer's `--with vendor/package:version` temporary constraint) is left to the builder.

### Deliberate holds

Constraints the user has pinned on purpose stay as they are: `laravel/framework ~13.34.0`, the exact pins on `nesbot/carbon`, `phpstan/phpdoc-parser`, `spatie/laravel-package-tools` and `fidry/cpu-core-counter`, and the `vite-plus` catalog entry and `tinypool` override in each `pnpm-workspace.yaml` (theirs). Harvest never edits them, and `composer bump` must not loosen or move them. The final report lists each one as "held at X, Y available" so the user can decide when to move it by hand.

### Guards

- Before raising a kit, stop if `raised/<kit>` has changes since its last raise or survey commit, since raising would destroy them. Every raised kit is its own git repository, so this is a `git status` check (my call).
- If `smials/` or the root has uncommitted changes, warn that they will mix into the result, then carry on (my call).

### What counts as a major

Semver majors, plus a minor bump of a `0.x` package (for example `^0.4.5` to `0.5.0`). Both are reported and never applied (my call).

### Vet approvals carry forward

A Vet entry is a version plus a `tree-v2` content hash, so the same release has the same entry in every trust file. Harvest keeps every entry approved during the run and adds it to each later kit's trust file before that kit's `composer update`. Vet then only stops on releases the user has not seen in this run.

After the update, each trust file must list exactly the packages that kit installs. Seeded entries for packages a kit does not use must not be left behind.

The Inertia kits get carry forward for free between themselves, because they share `smials/inertia/vet.json` and each is raised after the previous one is tended. The same goes for `composer bump` on the shared `smials/inertia/composer.json`: once the three kits are in step, bumping it from any of them gives the same result.

### The Inertia kits stay in step

After Vue, React and Svelte are updated, Harvest checks that their three `composer.lock` files resolve the same versions. If they differ (for example a release landed between runs), it reports the difference clearly. Fixing it automatically is left to the builder.

### Hobbiton itself

On a full run, before the kits: `composer update` at the root (with Vet, its approvals and rejections joining the run's pool), `composer bump`, and the same taze and `pnpm update` steps for the root `package.json`. Hobbiton's own `composer test` runs at the end of phase 2.

### The final report

One list across every kit and Hobbiton, grouped by package:

```
@inertiajs/vue3     2.3.1 → 3.0.0   vue
vitest              3.2.4 → 4.0.1   vue, react, svelte, livewire, blade
laravel/sanctum     4.1.0 → 5.0.0   api, vue, react, svelte
```

Then the deliberate holds with what is available, the packages rejected in Vet this run, the kits that failed their survey, any Inertia lock mismatch, and any `minimumReleaseAgeExclude` entries in a `pnpm-workspace.yaml` whose pinned version is no longer in that kit's lock (reported, not removed, my call).

## Constraints

- Node script using only what `scripts/helpers.js` and the root `package.json` already provide, plus taze (run with `pnpx`, as the user does today, or added as a root dev dependency, builder's choice).
- Runs on macOS locally. Vet needs an interactive terminal.
- Follow the repo rules in `AGENTS.md`: edits land in `smials/` through tend, never only in `raised/`.
- Documentation (README section for the new command) must not use dashes as punctuation.

## Left to the Builder

- How the run's Vet approvals are stored and merged, and how unused seeded entries are pruned. Check how Vet treats trust entries for packages that are not installed before choosing.
- Confirming pnpm 11's default `minimumReleaseAge` and picking the taze `--maturity-period` from it and Vet's 2 days.
- Whether taze should also bump GitHub Actions and `.node-version` files (taze 21 does both by default). My call is to turn both off, since the user did not mention them.
- How majors are detected (for example `composer outdated --direct --major-only --format=json` and `taze major --json`).
- Whether to test the pure logic (merging Vet entries, grouping majors) and how. Hobbiton has no JS test runner today.
- README wording and where the section goes.
