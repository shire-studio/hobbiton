# Team Kits Design

## Intent

Laravel's official starter kits let a developer add teams when they create a project (`laravel new --teams`). We want the same optional flow for every Shire Studio kit that has authentication: Vue, React, Svelte, Livewire and API. Blade has no auth, so it gets no team variant.

The CLI (`shire-studio/laravel-starter-kit-cli`) will later gain `new --teams` and a command that adds teams to an existing project. That CLI work is out of scope here. This project builds the scaffolding in Hobbiton: the team code for every kit, the way it is raised, tested and delivered, and an overlay in each kit release that the CLI can apply without guessing.

The behaviour is a copy of the official teams flow. Where our kits differ in structure (Actions, final classes, Data classes, UUID users, our own auth controllers), the official behaviour is kept and the code follows our conventions.

## Goals

- A team variant of the Vue, React, Svelte, Livewire and API kits, raised from the existing smials plus new team smials.
- Team variants are raised, tended and surveyed like any other kit, and pass the same `composer test` (Pint, Rector, oxlint, PHPStan max, TypeScript, type coverage, 100% code coverage).
- Each kit release ships both variants under one tag. The base kit is the repository's normal content and the team variant is an overlay in `.starter-kit/teams/`.
- Each kit repository's CI tests the base kit and the team variant.

## Non Goals

- The CLI changes (`new --teams`, the add teams command, a `teams` flag in `.starter-kit.json`, `update` on team projects). They are designed for here, built later.
- Teams for the Blade kit.
- WorkOS variants.
- Laravel Chisel or an `install:features` command. The official kits use Chisel to strip features; we are not adopting it.
- A separate `teams` branch or separate tags in the kit repositories.

## Anti Goals

- The base kits change behaviour or gain team code. A developer who does not pick teams must get exactly what they get today.
- The three Inertia team variants drift apart. Their PHP must stay identical, the same rule the base Inertia kits follow today.
- `raised/<kit>` contains the overlay. Tend would copy it back into a smial.
- The overlay needs anything beyond copying files and deleting files to apply. The CLI and kit CI must be able to apply it with a few lines.

## The Behaviour (copied from the official kits)

Reference: the `teams` branch of `laravel/vue-starter-kit`, `laravel/react-starter-kit`, `laravel/svelte-starter-kit` and `laravel/livewire-starter-kit`. Read those branches before building. A builder should treat them as the specification for behaviour and copy, and treat our existing smials as the specification for code style.

### Data

- `teams`: name, unique slug, `is_personal`, timestamps, soft deletes.
- `team_members` (pivot model `Membership`): team, user, role, timestamps, unique per team and user.
- `team_invitations`: unique 64 character code, team, email, role, `invited_by`, `expires_at`, `accepted_at`, timestamps.
- `users.current_team_id`, nullable, null on delete.
- Slugs are generated from the name, unique including soft deleted teams, with a numeric suffix on collision, and regenerated when the name changes.
- A `TeamName` rule rejects names that collide with route prefixes and a reserved list, because slugs appear in URLs.

### Roles and permissions

- `TeamRole`: Owner, Admin, Member, with a level for comparison and an `assignable()` list that excludes Owner.
- `TeamPermission`: update team, delete team, add member, update member, remove member, create invitation, cancel invitation.
- Owner has every permission. Admin can update the team and create and cancel invitations. Member has none.
- `TeamPolicy` enforces them. A personal team cannot be left or deleted. An owner cannot leave their own team.

### Flows

- Registering creates a personal team called "<name>'s Team" in the same transaction as the user and makes it the current team.
- Web kits prefix team pages with the slug: `/{current_team}/dashboard`. `EnsureTeamMembership` returns 403 for non members, optionally checks a minimum role, and switches the current team to the one in the URL. `SetTeamUrlDefaults` fills `current_team` and `team` URL defaults from the current team.
- After login, registration, two factor login, passkey login and email verification, the user lands on the current team's dashboard (falling back to the personal team).
- Team settings live under `settings/teams`: a list of the user's teams with a create modal, and an edit page with rename, members and their roles, pending invitations, invite, cancel invitation, remove member, leave and delete (delete asks for the team name to confirm).
- Switching team: a team switcher in the sidebar and header posts to `settings/teams/{team}/switch`.
- Deleting a team moves every member whose current team it was to their personal team, and moves the deleting user to a fallback team.
- Invitations are emailed (queued notification), expire after 3 days, and link to login with `?invitation=<code>`. Login and register show which team invited the user. Pending invitations for the signed in user's email show on the dashboard with accept and decline. Accepting creates the membership with the invited role and switches to that team.
- Shared Inertia props gain `currentTeam` and `teams`. Livewire layouts read the same data.

### Existing projects

The CLI's later add teams command applies this overlay to projects that already have users and data, so the team layer must work there too:

- Team migrations only add tables and columns. No existing migration is edited by the overlay.
- A data migration creates a personal team for every existing user without one and sets `current_team_id`. On a fresh project it does nothing.
- Code that needs a current team (`EnsureTeamMembership`, `SetTeamUrlDefaults`, the login and registration redirects) falls back to the personal team, as the official kit does, and never fails because `current_team_id` is null.

### API kit (no official equivalent)

The API team variant uses the same `teams` smial for models, enums, policy, rules and actions. It does not use URL prefixes or `EnsureTeamMembership` switching.

- `GET teams`, `POST teams`
- `GET teams/{team}`, `PATCH teams/{team}`, `DELETE teams/{team}`
- `DELETE teams/{team}/leave`
- `PATCH teams/{team}/members/{user}`, `DELETE teams/{team}/members/{user}`
- `POST teams/{team}/invitations`, `DELETE teams/{team}/invitations/{invitation}`
- `GET invitations` (pending invitations for the signed in user), `POST invitations/{invitation}/accept`, `DELETE invitations/{invitation}`
- `PUT user/current-team` sets the current team. `GET user` includes it.
- `{team}` binds by UUID in the API, not by slug, because a slug changes when a team is renamed and an API client would hold a stale URL. `TeamResource` still returns the slug.
- Responses use `TeamResource`, `TeamMemberResource` and `TeamInvitationResource`.
- Registration creates the personal team, as in the web kits.
- The invitation email links to `config('app.frontend_url').'/invitations/'.$code`, the same pattern `ResetPassword::createUrlUsing` uses today.
- Routes sit behind `auth:sanctum` and team routes authorise through `TeamPolicy`.

## Hobbiton Structure

### Smials

New smials, each holding only what teams adds or replaces:

| Smial | Holds |
| --- | --- |
| `teams` | Models, enums, policy, rules, actions, notification, migrations, factories, the `User` and `CreateUser` changes and their unit tests. Shared by every team variant. |
| `teams-web` | Session side changes shared by Inertia and Livewire team variants, if any emerge (for example login response classes). Created only if needed. |
| `teams-inertia` | Controllers, routes, middleware, Data classes, Fortify wiring and feature tests for the Inertia team variants. |
| `teams-inertia-vue`, `teams-inertia-react`, `teams-inertia-svelte` | Team pages, modals, switcher and changed layouts for each frontend. File names, props and copy identical across the three. |
| `teams-livewire` | The same screens with Livewire and Flux. |
| `teams-api` | JSON controllers, resources, routes and API feature tests. |

### Kits in `hobbiton.json`

Each team variant is a kit whose smials are its base kit's smials with the team smials appended at the end, so team files always win:

- `vue-teams`: `common, auth, web, inertia, inertia-vue, teams, teams-inertia, teams-inertia-vue`
- `react-teams`, `svelte-teams`: the same pattern
- `livewire-teams`: `common, auth, web, livewire, teams, teams-livewire`
- `api-teams`: `common, auth, api, teams, teams-api`

Appending at the end means a file that a base smial overrides (for example `smials/api/app/Models/User.php`) is overridden again by the most specific team smial. If `teams` replaces `User.php` and the API kit also overrides it, `teams-api` holds the API version of the team `User.php`.

A team kit entry names its base kit (for example `"base": "vue"`) and has no repository of its own. It inherits `exclude` and `replacements` from its base unless it overrides them. The exact schema is the builder's call.

### Commands and scripts

- `raise`, `tend` and `survey` accept team kits (`--kit=vue-teams`, `composer tend -- --vue-teams`, `composer survey -- --vue-teams`). Raising never writes the overlay.
- Tending a team kit writes only into team smials. When an edit touches a file that only a base smial owns, tend copies it into the kit's most specific team smial for that layer, creating a team override, and prints a warning naming the base file. A fix meant for the base kits is made by tending the base kit. This keeps team code out of the base kits even by accident.
- Delivery (`deliver` and quick post) raises the base kit, raises its team variant into a temporary directory, computes the overlay and writes it into the base kit's tree under `.starter-kit/teams/` before copying to the kit repository. Team kits do not get their own quick post pull request; their changes arrive in the base kit's pull request.
- `harvest` updates base kits only. Team kits are surveyed after the update. See Dependencies.
- Hobbiton's CI tests matrix includes team kits.
- `README.md` and `AGENTS.md` document team smials, team kits and the overlay.

### Overlay format

```
.starter-kit/teams/
    manifest.json
    files/<path>   every file the team variant adds or whose content differs from the base kit
```

`manifest.json`:

```json
{
    "version": 1,
    "deleted": ["path/the/team/variant/does/not/ship.php"]
}
```

Applying it: copy `files/` over the project root (keeping file modes), delete each path in `deleted`, then delete `.starter-kit/`. Not applying it: delete `.starter-kit/`. The `version` field lets the CLI reject a format it does not understand.

The overlay is computed from the two raised trees, after replacements, so it is exactly the difference a developer would see. It ignores the same paths raise keeps (`.git`, `vendor`, `node_modules`, `.env`, the SQLite database).

### Projects that never apply the overlay

- Each base kit's `post-create-project-cmd` deletes `.starter-kit/` as its first step, so a plain `composer create-project` gives a clean project. (The kit, not the CLI, owns this. Raise adds it to the base kits' `composer.json`.)
- The released CLI cannot handle the overlay yet. `new` runs composer scripts, so the overlay would be deleted before it could be applied, and `update` would show every overlay file as added. The CLI fix is a separate pull request on `shire-studio/laravel-starter-kit-cli`, opened after this work's pull request. It makes `new` run `create-project --no-scripts`, apply or drop the overlay, then run the scripts, and makes `update` ignore `.starter-kit/`.
- Release order: Hobbiton can merge, but no kit release containing an overlay is tagged until that CLI release is out. Quick post pull requests that add the overlay wait unmerged on the kit repositories until then.

### Kit repository CI

`smials/common/.github/workflows/tests.yml` gains a second job (or a matrix dimension) that applies the overlay, then runs the same steps. The base job deletes `.starter-kit/` first, or the kit's tooling ignores it, so Pint, Rector, PHPStan and oxlint never see overlay files twice. The Blade kit has no overlay, so the team job is skipped when `.starter-kit/teams` is absent.

### Dependencies

Teams adds no Composer or npm dependency, so the team variants share their base kit's lock files and `vet.json`, and lock files never appear in the overlay. If a later change needs a new dependency, that team smial must hold its own lock files, and harvest must update it. That is out of scope now.

### Tests

- Every team kit reaches 100% code and type coverage on its own.
- The existing check that the Inertia kits share identical `app`, `routes` and `tests/Feature` runs for the team variants too.
- Base kit tests whose expectations change under teams (for example registration redirecting to `/{slug}/dashboard`) are overridden in the team smials, not made conditional.
- New Hobbiton tests: raising a team kit stacks team smials last, and the overlay generator produces the expected `files/` and `deleted` for a small fixture.

## Decided by Josh

- Copy the official teams flow.
- Team variants for every kit with auth, including API.
- Team code lives in separate smials.
- One release per kit carries both variants. The team variant is an overlay in the kit repository, not a branch.
- The API shape above.
- The CLI changes stay a separate pull request on the CLI repository, opened once this work is in a pull request.

## My Calls (check these)

- Overlay location `.starter-kit/teams/` with `files/` and `manifest.json`. It sits next to the CLI's `.starter-kit.json`.
- Team smials appended after all base smials, rather than interleaved per layer.
- Team kits named `<kit>-teams` in `hobbiton.json`.
- Teams use UUID primary keys to match `User`, unlike the official integer ids. Routes still bind by slug.
- No new dependencies, so lock files are shared.
- The overlay must work on existing projects: additive migrations, a backfill of personal teams, null safe current team handling.
- Tend for a team kit writes only into team smials and warns when it creates an override of a base file.
- The API binds `{team}` by UUID; the web kits bind by slug.
- A `teams-web` smial only if shared session code actually emerges.

## Left to the Builder

- Class and file layout inside the smials, following the existing `.ai/rules` and `AGENTS.md` (Actions for business logic, final readonly classes, Data classes for Inertia props, form requests).
- How to split the official controllers' logic into Actions.
- The `hobbiton.json` schema for team kits, and whether overlay generation lives in a PHP command or the Node scripts.
- How the kit CI workflow is restructured to run both variants.
- Seeder changes for team kits.
