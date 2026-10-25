# Team Kits 2: Inertia Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vue, React and Svelte kits gain `vue-teams`, `react-teams` and `svelte-teams` variants with the official teams flow, delivered as part of each base kit's overlay.

**Architecture:** Three new team kits stack `teams`, `teams-web`, `teams-inertia` and a per frontend team smial on top of their base kit. `teams-web` holds what Inertia and Livewire share (team URL middleware, the dashboard redirect, the web invitation link). `teams-inertia` holds identical PHP for the three Inertia team kits. The frontend team smials hold the same screens, file names, props and copy in Vue, React and Svelte.

**Tech Stack:** Laravel 13, Inertia, Wayfinder, spatie/laravel-data with the TypeScript transformer, Vue 3 with shadcn-vue, React 19 with shadcn/ui, Svelte 5 with shadcn-svelte, Pest (including browser tests).

**Spec:** `docs/superpowers/specs/2026-10-25-team-kits-design.md`

Plan 1 (`docs/superpowers/plans/2026-10-25-team-kits-1-foundation-and-api.md`) built the tooling, the `teams` smial and `api-teams`. Plan 3 adds `livewire-teams` on top of `teams-web`.

## Global Constraints

- Everything in plan 1's Global Constraints still applies. In particular, edit in `smials/`, write new team files straight into the right smial, follow `smials/common/.ai/rules/*`, keep 100% code and type coverage, and never use dashes as punctuation in docs.
- Smial order for the new kits: `vue-teams` is `common, auth, web, inertia, inertia-vue, teams, teams-web, teams-inertia, teams-inertia-vue`. `react-teams` and `svelte-teams` follow the same pattern. Each copies its base kit's repository, `node`, `exclude` and `replacements` exactly.
- The three Inertia team kits raise identical `app`, `routes` and `tests/Feature` (the existing identity check extends to them). Their frontend team smials use identical file names, props, `data-test` attributes and copy.
- Tend rule from plan 1 (Ruling 10): an override of a base file goes into `teams-<base>` when the kit has it, into `teams` only when every team kit raises the base smial, and is refused otherwise. `web`, `inertia` and `inertia-<fw>` files therefore override into `teams-web`, `teams-inertia` and `teams-inertia-<fw>`. `auth` and `common` files override into `teams`.
- Every override of a base file is recorded in `team-overrides.json` (`composer overrides -- --accept`). `composer overrides` must report 0 problems at the end of every task.
- URLs: the team dashboard is `GET {current_team:slug}/dashboard`, named `team.dashboard`. `GET dashboard`, named `dashboard`, stays and redirects an authenticated, verified user to their current team's dashboard (falling back to the personal team). Team settings live under `settings/teams`. Web routes bind `{team:slug}`, `{current_team:slug}` and `{invitation:code}`.
- Authorisation: team scoped routes use `->can('<ability>', 'team')` route middleware (plan 1 Ruling 5), so a denial happens before validation and returns 404 through the kits' default denial response. Team and invitation routes sit behind `auth` and `verified`.
- Personal team name `"{$user->name}'s Team"`. Invitations expire after 3 days. Copy, toasts and screens follow the official `teams` branches of `laravel/vue-starter-kit`, `laravel/react-starter-kit` and `laravel/svelte-starter-kit`.
- No new Composer or npm dependencies. Every UI component the screens need already exists in the kits (`components/ui/*`).

## Review Focus

1. **Someone who isn't a member opens `/{slug}/dashboard` or a team settings URL.** They expect a 404, not the team's data. Pinned in Task 4 (`it hides another team's dashboard`) and Task 5 (`it hides team settings from non members`).
2. **A user logs in, registers, verifies their email or passes a two factor or passkey challenge.** They expect to land on their current team's dashboard. Pinned in Task 4 (`it redirects the dashboard to the current team`) and by the unchanged base login, register and verification tests, which redirect to `dashboard`.
3. **A team is renamed while a member has its old URL open.** The next navigation should still work, because links are built from the shared `currentTeam` prop, not a cached slug. Pinned in Task 5 (`it redirects to the renamed team`) and Task 6 (browser test `it renames a team and keeps navigating`).
4. **The three frontends drift apart.** A maintainer expects one browser test to pass unchanged in all three kits. Pinned in Task 6 (`tests/Browser/TeamsTest.php` in `teams-inertia`), with Tasks 7 and 8 required to pass it.
5. **A team name that produces an empty slug (`"!!!"`).** The team should still get a usable URL. Pinned in Task 2 (`it falls back when the name has no slug characters`).

---

### Task 1: Inertia team kits in the manifest, and tend refusals fail

**Files:**
- Modify: `hobbiton.json`, `tests/Feature/RaiseCommandTest.php`, `scripts/tend.js`, `tests/scripts/tend.test.js`

**Interfaces:**
- Produces: kits `vue-teams`, `react-teams` and `svelte-teams` (labels `Vue Teams`, `React Teams` and `Svelte Teams`, `base` set to `vue`, `react` and `svelte`).

- [ ] **Step 1: Write the failing test.** Extend `it shares the php application between the inertia kits` (or add `it shares the php application between the inertia team kits`) so that `vue-teams`, `react-teams` and `svelte-teams` raise identical `app`, `routes` and `tests/Feature`. Add a node test `tend --once exits 1 when it refuses a file`. Put the decision in a helper that returns the refused count, so it is testable without spawning tend.
- [ ] **Step 2: Run** `vendor/bin/pest tests/Feature` and `node --test tests/scripts/*.test.js`. Expected: FAIL.
- [ ] **Step 3: Implement.** Add the three kits to `hobbiton.json` in the smial order from Global Constraints. In `tend.js`, `--once` exits 1 when any file was refused, and `--check` keeps counting refusals as untended.
- [ ] **Step 4: Run** `composer test`. Expected: PASS. `ManifestTest` covers the new kits automatically.
- [ ] **Step 5: Commit** `feat: add the inertia team kits to the manifest`.

### Task 2: Shared team code for web kits in `teams`

**Files (in `smials/teams` unless noted):**
- Override from `auth`: `app/Models/User.php`, `database/factories/UserFactory.php`, `app/Actions/DeleteUser.php`, `tests/Unit/Models/UserTest.php`, `tests/Unit/Actions/DeleteUserTest.php`. Each is the `auth` file plus the same team additions `teams-api` made to its `api` copy (`HasTeams`, the personal team `afterCreating` hook, `withoutPersonalTeam()`, `DeleteUserTeams` first).
- Move from `smials/teams-api` to `smials/teams`: `app/Http/Requests/SaveTeamRequest.php`, `DeleteTeamRequest.php`, `CreateTeamInvitationRequest.php`, `UpdateTeamMemberRequest.php`, `RespondToTeamInvitationRequest.php` (they are pure validation and both layers need them). `UpdateCurrentTeamRequest` stays in `teams-api`.
- Modify: `app/Actions/CreateTeamSlug.php` and its test.
- Modify: `app/Policies/TeamPolicy.php` and its test, `smials/teams-api/app/Http/Controllers/Teams/TeamMemberController.php`, `smials/teams-api/routes/api.php`.

**Interfaces:**
- Produces:
  - `TeamPolicy::manageMember(User $user, Team $team, User $member): bool`. It is true when `$member` belongs to `$team` and does not own it. The ability check for the action itself (`updateMember` or `removeMember`) stays separate.
  - `CreateTeamSlug` returns `team` (then `team-1` and so on) when `Str::slug($name)` is empty.
  - The moved requests keep their class names, so `teams-api` controllers keep working.

- [ ] **Step 1: Write the failing tests.**
  - `CreateTeamSlugTest`: `it falls back when the name has no slug characters` (`'!!!'` gives `team`, and `team-1` once `team` is taken).
  - `TeamPolicyTest`: `it lets owners manage other members`, `it forbids managing the owner`, `it forbids managing a non member`.
  - The `teams` `UserTest` and `DeleteUserTest` overrides: the `auth` assertions plus `it has a personal team` and `it deletes the user's teams`.
- [ ] **Step 2: Raise and run.** Raise `api-teams` and run the policy and slug tests. Expected: FAIL.
- [ ] **Step 3: Implement.** In `teams-api`, replace `ensureManageable` in `TeamMemberController` with route middleware `->can('manageMember', ['team', 'user'])` on `teams.members.update` and `teams.members.destroy`, next to the existing ability middleware. The API behaviour stays the same (404).
- [ ] **Step 4: Verify.** Run `composer survey -- --api-teams --tend`, then `composer overrides -- --accept` (the new `teams` overrides pair with `auth` only in kits where they win, so `api-teams` is unaffected), then `composer test`. Expected: PASS at 100%.
- [ ] **Step 5: Commit** `feat: share team requests and owner protection across kits`.

### Task 3: `teams-web`, shared by the Inertia and Livewire team kits

**Files (in `smials/teams-web`):**
- Create: `app/Actions/CreateTeamInvitationUrl.php` (returns `route('login', ['invitation' => $invitation->code])`), `app/Http/Middleware/EnsureTeamMembership.php`, `app/Http/Middleware/SetTeamUrlDefaults.php`, `app/Http/Controllers/CurrentTeamDashboardController.php` (invokable)
- Test: `tests/Unit/Actions/CreateTeamInvitationUrlTest.php`, `tests/Unit/Notifications/TeamInvitationNotificationTest.php`, `tests/Unit/Middleware/EnsureTeamMembershipTest.php`, `tests/Unit/Middleware/SetTeamUrlDefaultsTest.php`

**Interfaces:**
- Produces:
  - `EnsureTeamMembership::handle(Request $request, Closure $next, ?string $minimumRole = null)`. It reads `current_team` or `team` from the route (a bound `Team`), returns 404 through `abort(404)` for missing teams or non members, checks `$minimumRole` with `TeamRole::isAtLeast` (404 when below), and calls `SwitchTeam` when `current_team` differs from the user's current team.
  - `SetTeamUrlDefaults` calls `URL::defaults(['current_team' => $slug, 'team' => $slug])` from `currentTeamOrPersonal()` when a user is signed in.
  - `CurrentTeamDashboardController` redirects to `route('team.dashboard', ['current_team' => $team->slug])`, using `currentTeamOrPersonal()`.
  - The web `CreateTeamInvitationUrl` and its notification test are the counterparts of the `teams-api` versions.

- [ ] **Step 1: Write the failing unit tests:**
  - `it links to login with the invitation code`.
  - `it mails the invitation` (exact subject, lines and action URL).
  - `it rejects non members`.
  - `it rejects members below the minimum role`.
  - `it switches to the team in the url`.
  - `it leaves the current team alone when it matches`.
  - `it sets url defaults to the current team`.
  - `it sets no defaults for guests`.
  Middleware tests use a test route registered in the test.
- [ ] **Step 2: Raise `vue-teams`** (the first survey installs it: `composer survey -- --vue-teams` may fail on later tasks' gaps; use it for installation, then `php artisan raise --kit=vue-teams`) **and run** these tests. Expected: FAIL.
- [ ] **Step 3: Implement.** Port the behaviour from the official `app/Http/Middleware/EnsureTeamMembership.php` and `SetTeamUrlDefaults.php`, using our conventions and `SwitchTeam`.
- [ ] **Step 4: Run them again.** Expected: PASS.
- [ ] **Step 5: Commit** `feat: add the shared web team layer`.

### Task 4: Inertia team wiring: routes, dashboard, shared props and auth pages

**Files (in `smials/teams-inertia`):**
- Override from `inertia`: `routes/web.php`, `bootstrap/app.php` (append `SetTeamUrlDefaults` to the web group, after `HandleInertiaRequests`), `app/Http/Middleware/HandleInertiaRequests.php`, `app/Http/Controllers/Auth/LoginController.php`, `app/Http/Controllers/Auth/RegisterController.php`, `tests/Unit/Middleware/HandleInertiaRequestsTest.php`
- Create: `app/Data/TeamData.php`, `app/Data/TeamPermissionsData.php`, `app/Data/TeamMemberData.php`, `app/Data/TeamInvitationData.php`, `app/Data/PendingTeamInvitationData.php`, `app/Data/TeamInvitationContextData.php`, `app/Http/Controllers/DashboardController.php` (invokable)
- Test: `tests/Feature/Teams/DashboardTest.php`, `tests/Feature/Teams/InvitationContextTest.php`, `tests/Unit/Data/*Test.php` for each Data class

**Interfaces:**
- Consumes: Task 3's middleware and redirect controller. `HasTeams` from plan 1.
- Produces:
  - Data classes, following `UserData` and `PasskeyData` (final, readonly promoted properties, snake case keys):
    - `TeamData` (`id`, `name`, `slug`, `is_personal`, `role`, `role_label`, `is_current`) with `static fromTeam(Team $team, User $viewer): self`.
    - `TeamPermissionsData` (`can_update_team`, `can_delete_team`, `can_add_member`, `can_update_member`, `can_remove_member`, `can_create_invitation`, `can_cancel_invitation`).
    - `TeamMemberData` (`id`, `name`, `email`, `role`, `role_label`).
    - `TeamInvitationData` (`code`, `email`, `role`, `role_label`, `created_at`).
    - `PendingTeamInvitationData` (`code`, `inviter_name`, `team_name`, `team_slug`).
    - `TeamInvitationContextData` (`code`, `team_name`).
  - Shared props: `currentTeam` (`TeamData|null`, lazy) and `teams` (`list<TeamData>`, lazy).
  - The Inertia page `Dashboard` receives `pendingInvitations: list<PendingTeamInvitationData>`. The pages `auth/Login` and `auth/Register` receive `teamInvitation: TeamInvitationContextData|null`, from `?invitation=<code>` when that code is pending.
  - `routes/web.php` is the `inertia` file with the dashboard routes from Global Constraints. `dashboard` points to `CurrentTeamDashboardController` (`auth`, `verified`). `team.dashboard` points to `DashboardController` (`auth`, `verified`, `EnsureTeamMembership`). Task 5's team routes are added in Task 5.
  - Login and Register controllers change only `index()` (the extra prop). Their redirects keep `route('dashboard')`, which now redirects to the team.

- [ ] **Step 1: Write the failing tests.**
  - `DashboardTest`:
    - `it redirects the dashboard to the current team`.
    - `it falls back to the personal team when no current team is set`.
    - `it shows the team dashboard to members`.
    - `it hides another team's dashboard` (404).
    - `it switches the current team from the url`.
    - `it lists pending invitations for the user's email` (case insensitive, excluding expired and accepted).
    - `it requires a verified email`.
  - `InvitationContextTest`:
    - `it shows the inviting team on the login page`.
    - `it shows the inviting team on the register page`.
    - `it ignores an expired invitation code`.
    - `it ignores an unknown invitation code`.
  - The `HandleInertiaRequestsTest` override: the existing assertions, plus `currentTeam` and `teams` for a signed in user and `null` and `[]` for guests.
  - Data tests: one `fromTeam` or construction test each.
- [ ] **Step 2: Raise `vue-teams` and run** `vendor/bin/pest tests/Feature/Teams tests/Unit`. Expected: FAIL.
- [ ] **Step 3: Implement.** Run `php artisan typescript:transform` (or the kit's equivalent; check `composer.json` scripts) so the generated types include the new Data classes.
- [ ] **Step 4: Run** the kit's full Pest suite in `raised/vue-teams`. The base login, register, verification and settings tests must still pass unchanged. Expected: PASS. Run `composer overrides -- --accept`.
- [ ] **Step 5: Commit** `feat: route inertia team kits through the current team`.

### Task 5: Inertia team management

**Files (in `smials/teams-inertia`):**
- Modify: `routes/web.php` (adds the team routes)
- Create in `app/Http/Controllers/Teams`: `TeamController` (`index`, `store`, `edit`, `update`, `destroy`), `SwitchTeamController`, `LeaveTeamController`, `TeamMemberController` (`update`, `destroy`), `TeamInvitationController` (`store`, `destroy`), `AcceptInvitationController`, `DeclineInvitationController` (invokable controllers wherever the Pest arch preset rejects non resource methods)
- Test in `tests/Feature/Teams`: `TeamTest.php`, `TeamMemberTest.php`, `TeamInvitationTest.php`, `InvitationResponseTest.php`, `TeamAccessTest.php`

**Interfaces:**
- Consumes: the moved requests, `TeamPolicy` (including `manageMember`), the plan 1 actions, Task 4's Data classes.
- Produces these routes inside `auth` and `verified`:

| Method | URI | Name | Middleware |
| --- | --- | --- | --- |
| GET | `settings/teams` | `teams.index` | |
| POST | `settings/teams` | `teams.store` | |
| GET | `settings/teams/{team:slug}` | `teams.edit` | `can:view,team` |
| PATCH | `settings/teams/{team:slug}` | `teams.update` | `can:update,team` |
| DELETE | `settings/teams/{team:slug}` | `teams.destroy` | `can:delete,team` |
| POST | `settings/teams/{team:slug}/switch` | `teams.switch` | `can:view,team` |
| DELETE | `settings/teams/{team:slug}/leave` | `teams.leave` | `can:leave,team` |
| PATCH | `settings/teams/{team:slug}/members/{user}` | `teams.members.update` | `can:updateMember,team`, `can:manageMember,team,user` |
| DELETE | `settings/teams/{team:slug}/members/{user}` | `teams.members.destroy` | `can:removeMember,team`, `can:manageMember,team,user` |
| POST | `settings/teams/{team:slug}/invitations` | `teams.invitations.store` | `can:inviteMember,team` |
| DELETE | `settings/teams/{team:slug}/invitations/{invitation:code}` | `teams.invitations.destroy` | `can:cancelInvitation,team` |
| POST | `invitations/{invitation:code}/accept` | `invitations.accept` | |
| DELETE | `invitations/{invitation:code}` | `invitations.decline` | |

- Pages and props: `teams/Index` receives `teams: list<TeamData>`. `teams/Edit` receives:
  - `team: TeamData`
  - `members: list<TeamMemberData>`
  - `invitations: list<TeamInvitationData>` (pending only, empty unless `inviteMember`)
  - `permissions: TeamPermissionsData`
  - `availableRoles: TeamRole::assignable()`
- Redirects and toasts follow the official controllers, flashing with `Inertia::flash('toast', ...)` like `ProfileController`:
  - store and update go to `teams.edit` with the new slug;
  - leave and destroy go to `teams.index`;
  - accept and decline go to `dashboard`;
  - member and invitation changes go to `teams.edit`.
- Toast copy: `Team created.`, `Team updated.`, `Team deleted.`, `You left the team ":name"`, `Member role updated.`, `Member removed.`, `Invitation sent.`, `Invitation cancelled.`, `Invitation accepted.`, `Invitation declined.`

- [ ] **Step 1: Write the failing feature tests.** Mirror `smials/teams-api/tests/Feature/Teams/*` case for case, using Inertia assertions and redirects, plus:
  - `it redirects to the renamed team`;
  - `it hides team settings from non members` (a dataset over every team scoped route returns 404 with a probing body);
  - `it requires a verified email` (a dataset over every team and invitation route).
  Write each validation scenario as its own test, and use `fromRoute()` before redirects.
- [ ] **Step 2: Raise `vue-teams` and run** `vendor/bin/pest tests/Feature/Teams`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the kit's full Pest suite in `raised/vue-teams`. Expected: PASS. Run `composer overrides -- --accept`.
- [ ] **Step 5: Commit** `feat: add team management to the inertia team kits`.

### Task 6: Vue team screens and the shared browser test

**Files (in `smials/teams-inertia-vue/resources/js` unless noted):**
- Create in `components`: `TeamSwitcher.vue`, `CreateTeamModal.vue`, `DeleteTeamModal.vue`, `InviteMemberModal.vue`, `LeaveTeamModal.vue`, `CancelInvitationModal.vue`, `RemoveMemberModal.vue`, `PendingInvitationsModal.vue`, `TeamInvitationAlert.vue`.
- Create pages: `pages/teams/Index.vue`, `pages/teams/Edit.vue`.
- Override from `inertia-vue`: `components/AppSidebar.vue`, `components/AppHeader.vue`, `components/NavUser.vue`, `components/UserInfo.vue`, `layouts/settings/SettingsLayout.vue` (a `Teams` item between Security and Appearance), `lib/navigation.ts`, `pages/Dashboard.vue`, `pages/auth/Login.vue`, `pages/auth/Register.vue`, `types/global.d.ts` (shared props `currentTeam` and `teams`), and `lib/inertiaApp.ts` or `app.ts` (whichever chooses layouts) so `teams/*` pages get the settings layout.
- Create: `smials/teams-inertia/tests/Browser/TeamsTest.php`

**Interfaces:**
- Consumes: Wayfinder routes `@/routes/team` (`dashboard`), `@/routes/teams/*` and `@/routes/invitations/*`; the generated `App.Data.*` types from Task 4; the page props from Tasks 4 and 5.
- Produces: the component file names and props above, and these `data-test` attributes, which React and Svelte must reuse:
  - `team-switcher`, `team-switcher-item`;
  - `create-team-button`, `create-team-name`, `create-team-submit`;
  - `team-name`, `team-save`;
  - `invite-email`, `invite-role`, `invite-submit`;
  - `member-row`, `member-role`, `remove-member`;
  - `invitation-row`, `cancel-invitation`;
  - `leave-team`, `delete-team`, `delete-team-name`, `delete-team-submit`;
  - `pending-invitation`, `accept-invitation`, `decline-invitation`.

- [ ] **Step 1: Write the failing browser test** `smials/teams-inertia/tests/Browser/TeamsTest.php`. Follow `smials/common/tests/Browser/WelcomeTest.php` for setup. Tests:
  - `it creates a team and switches to it`;
  - `it renames a team and keeps navigating`;
  - `it invites a member and cancels the invitation`;
  - `it accepts a pending invitation from the dashboard`;
  - `it deletes a team after confirming its name`.
- [ ] **Step 2: Run the test** in `raised/vue-teams` after `pnpm run build`. Expected: FAIL.
- [ ] **Step 3: Implement.** Port the official Vue `teams` branch screens into our structure and conventions: our component auto imports, our `lib/navigation.ts`, `SettingsLayout` and `flashToast`, and generated types instead of hand written ones. Links to the dashboard use `currentTeam.slug` from shared props.
- [ ] **Step 4: Verify.** Run `composer survey -- --vue-teams --tend` (oxlint, TypeScript, PHPStan, Pest including browser tests, 100% coverage). Expected: PASS. Then run `composer overrides -- --accept`.
- [ ] **Step 5: Commit** `feat: add vue team screens`.

### Task 7: React team screens

**Files:** the same list as Task 6 under `smials/teams-inertia-react/resources/js`, with `.tsx` components and pages and React's equivalents of the overridden files (`components/AppSidebar.tsx` and so on, plus `app.tsx` or `lib/inertiaApp.ts` for layouts).

**Interfaces:**
- Consumes: Task 6's file names, props, copy and `data-test` attributes, and the official React `teams` branch.

- [ ] **Step 1: Raise `react-teams` and build.** Then run `tests/Browser/TeamsTest.php`. Expected: FAIL (the React screens do not exist yet).
- [ ] **Step 2: Implement** the React screens with the same file names, props, copy and `data-test` attributes as Task 6.
- [ ] **Step 3: Verify.** Run `composer survey -- --react-teams --tend`. Expected: PASS, with the shared browser test unchanged. Then run `composer overrides -- --accept`.
- [ ] **Step 4: Commit** `feat: add react team screens`.

### Task 8: Svelte team screens

**Files:** the same list as Task 6 under `smials/teams-inertia-svelte/resources/js`, with `.svelte` components and pages and Svelte's equivalents of the overridden files.

**Interfaces:**
- Consumes: Task 6's file names, props, copy and `data-test` attributes, and the official Svelte `teams` branch.

- [ ] **Step 1: Raise `svelte-teams` and build.** Then run `tests/Browser/TeamsTest.php`. Expected: FAIL.
- [ ] **Step 2: Implement.**
- [ ] **Step 3: Verify.** Run `composer survey -- --svelte-teams --tend`. Expected: PASS. Then run `composer overrides -- --accept`.
- [ ] **Step 4: Commit** `feat: add svelte team screens`.

### Task 9: Docs and final verification

**Files:**
- Modify: `README.md` (the kit table gains the three team kits, and the smial table gains `teams-web`, `teams-inertia` and `teams-inertia-vue`, `teams-inertia-react` and `teams-inertia-svelte`), `AGENTS.md` (team frontend changes go in all three `teams-inertia-*` smials with identical names, props, copy and `data-test` attributes, and `tests/Browser/TeamsTest.php` is the shared check)
- Override from `inertia`: `README.md` in `smials/teams-inertia`, if the Inertia README documents routes or features (add a short Teams section in the same style as the `teams-api` README)

- [ ] **Step 1: Write the docs.** Use no dashes as punctuation.
- [ ] **Step 2: Run** `composer test`. Expected: PASS.
- [ ] **Step 3: Survey everything.** Run `composer survey -- --vue --react --svelte --livewire --api --blade --api-teams --vue-teams --react-teams --svelte-teams`. Expected: every kit passes at 100%.
- [ ] **Step 4: Check the overlay.** Run `php artisan pack --kit=vue --to=<scratch>`. Apply the overlay with the Prepare Variant snippet from `smials/common/.github/workflows/tests.yml`. Make an initial commit (Pest TIA needs one), then run `composer install`, `pnpm install`, `pnpm run build`, migrate, and `composer test`. Expected: PASS.
- [ ] **Step 5: Check the tree.** Run `composer overrides` (expect 0 problems) and `git status` (expect it clean, with nothing under `raised/`).
- [ ] **Step 6: Commit** `docs: document the inertia team kits`.
