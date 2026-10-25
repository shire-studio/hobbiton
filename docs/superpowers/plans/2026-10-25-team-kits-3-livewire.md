# Team Kits 3: Livewire Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The Livewire kit gains a `livewire-teams` variant with the same team flow as the Inertia team kits, delivered in the Livewire kit's overlay.

**Architecture:** `livewire-teams` stacks `teams`, `teams-web` and a new `teams-livewire` smial on the Livewire kit. It follows the Livewire kit's own style: controllers return Blade views or redirect with a flashed toast, plain HTML forms submit inside Flux modals and dropdowns, and the layout reads the signed in user directly. Routes, route names, authorisation and redirects match the Inertia team kits. The shared browser test moves into `teams-web`, so all four web team kits pass the same file.

**Tech Stack:** Laravel 13, Livewire 4, Flux (free edition, as the kit already uses), Blade, Pest (including browser tests).

**Spec:** `docs/superpowers/specs/2026-10-25-team-kits-design.md`

Plans 1 and 2 (`docs/superpowers/plans/2026-10-25-team-kits-1-foundation-and-api.md` and `docs/superpowers/plans/2026-10-25-team-kits-2-inertia.md`) built everything this plan reuses: the `teams` domain, `teams-web` (EnsureTeamMembership, SetTeamUrlDefaults, CurrentTeamDashboardController, the web invitation link) and the Inertia team kits as the behavioural reference.

## Global Constraints

- Everything in plans 1 and 2's Global Constraints still applies:
  - edit in `smials/`, and write new team files straight into the right smial;
  - follow `smials/common/.ai/rules/*`;
  - keep 100% code and type coverage, and ledger every override with `composer overrides -- --accept`;
  - authorise team routes with `->can()` route middleware before validation;
  - put team and invitation routes behind `auth` and `verified`;
  - type-hint `Team $team` or `Team $current_team` on every action behind team middleware;
  - never use dashes as punctuation in docs.
- Smial order: `livewire-teams` is `common, auth, web, livewire, teams, teams-web, teams-livewire`, with label `Livewire Teams` and `base` set to `livewire`. It copies the Livewire kit's repository, `node`, `exclude` and `replacements` exactly.
- Routes, route names, URIs, middleware, redirects and toast copy are exactly those of `smials/teams-inertia/routes/web.php` and its controllers. Two differences only:
  - pages are Blade views (`pages.dashboard`, `pages.teams.index`, `pages.teams.edit`), not Inertia pages;
  - toasts are flashed with `->with('toast', ['type' => ..., 'message' => ...])`, the way `smials/livewire/app/Http/Controllers/Settings/SecurityController.php` does it.
- Screens and copy follow the Inertia team screens (`smials/teams-inertia-vue` is the reference). They use the Livewire kit's Flux components and the same `data-test` attributes, so the shared browser test passes unchanged.
- No Flux Pro components and no new dependencies. Plain forms post to the named routes. Alpine is used only where the kit already uses it (modals, dropdowns, toasts).

## Review Focus

1. **The shared browser test fails in only one of the four web team kits.** A maintainer expects one file to guard all four. Pinned in Task 1 (the move to `teams-web` and the kit-agnostic selectors) and Task 4 (`livewire-teams` passes it unchanged).
2. **A Livewire update request (`/livewire/update`) on a team page.** The user expects their current team and URL defaults to stay intact. Pinned in Task 2 (`it keeps the current team on livewire update requests`).
3. **A member submits a form for an action their role does not allow** (forged form, or a stale page after their role changed). They expect a 404, not a 422 or a partial change. Pinned in Task 3 (the `TeamAccessTest` datasets, mirrored from `teams-inertia`).
4. **The flashed toast after a redirect.** The user expects the same message as in the Inertia kits. Pinned in Task 3 (each redirect test asserts `session('toast')`).
5. **A user signing in through two factor or a passkey.** They expect to land on their team dashboard, as in the Inertia kits. Pinned by the base Livewire tests (redirect to `dashboard`) plus Task 2 (`it redirects the dashboard to the current team`).

---

### Task 1: Shared pieces move to `teams-web`, and the kit is added

**Files:**
- Modify: `hobbiton.json` (add `livewire-teams`)
- Move from `smials/teams-inertia` to `smials/teams-web`: `app/Actions/FindTeamInvitationContext.php` and its unit test. The Inertia controllers keep calling it; the class name is unchanged.
- Move from `smials/teams-inertia` to `smials/teams-web`: `tests/Browser/TeamsTest.php`.
- Modify the shared browser test so it is kit agnostic:
  - replace the `[data-sidebar="menu-button"]...` selector with a `dashboard-link` `data-test` on the sidebar's Dashboard nav link;
  - add that attribute in `smials/teams-inertia-vue`, `-react` and `-svelte`.

**Interfaces:**
- Produces: the `livewire-teams` kit, `FindTeamInvitationContext::handle(?string $code): ?TeamInvitation`, and `smials/teams-web/tests/Browser/TeamsTest.php`, which every web team kit raises.
  - Check the current return type in the moved file and keep it. If it returns `TeamInvitationContextData` (Inertia only), change it to return the `TeamInvitation` model. The Inertia controllers then map that to `TeamInvitationContextData`, so `teams-web` stays free of Inertia and spatie data.

- [ ] **Step 1: Make the change and verify.** Raise and run `composer survey -- --vue-teams --react-teams --svelte-teams`. Expected: PASS at 100% (the moved test and the new attribute must not change the outcome).
- [ ] **Step 2: Run** `composer test` and `composer overrides`. Expected: PASS and 0 problems. `ManifestTest` covers `livewire-teams` automatically.
- [ ] **Step 3: Commit** `feat: share the team browser test across web team kits`.

### Task 2: Livewire team wiring: routes, dashboard, layout and auth pages

**Files (in `smials/teams-livewire` unless noted):**
- Override from `livewire`:
  - `routes/web.php` (the `dashboard` redirect and `team.dashboard`, exactly as in `teams-inertia`);
  - `bootstrap/app.php` (append `SetTeamUrlDefaults` to the web group);
  - `app/Http/Controllers/Auth/LoginController.php` and `RegisterController.php` (pass `teamInvitation` from `FindTeamInvitationContext`);
  - `resources/views/layouts/app/sidebar.blade.php` and `layouts/app/header.blade.php` (the team switcher, Dashboard links built from the current team, `data-test="dashboard-link"`);
  - `resources/views/components/desktop-user-menu.blade.php` (the current team name under the user, like `UserInfo`);
  - `resources/views/pages/dashboard.blade.php` (the pending invitations modal);
  - `resources/views/pages/auth/login.blade.php` and `register.blade.php` (the invitation alert, plus `login-link` and `register-link` carrying `?invitation=`);
  - `resources/views/pages/settings/layout.blade.php` (a Teams item between Security and Appearance).
- Create:
  - `app/Http/Controllers/DashboardController.php` (invokable; type-hints `Team $current_team`; passes `pendingInvitations`);
  - `resources/views/components/team-switcher.blade.php` (the switch forms, and a New team item opening the create modal);
  - `resources/views/components/team-invitation-alert.blade.php`, `components/pending-invitations-modal.blade.php` and `components/create-team-modal.blade.php`.
- Tests:
  - `tests/Feature/Teams/DashboardTest.php` and `tests/Feature/Teams/InvitationContextTest.php`, mirroring `teams-inertia`'s, with `assertViewIs` and `assertViewHas` in place of Inertia assertions;
  - `it keeps the current team on livewire update requests`.

**Interfaces:**
- Consumes: `teams-web` (EnsureTeamMembership, SetTeamUrlDefaults, CurrentTeamDashboardController, FindTeamInvitationContext), the `teams` domain, and `HasTeams::currentTeamOrPersonal()`.
- Produces: Blade components and their props, which Task 3 reuses:
  - `x-team-switcher`;
  - `x-create-team-modal`;
  - `x-pending-invitations-modal :invitations`;
  - `x-team-invitation-alert :team-name`.

- [ ] **Step 1: Write the failing feature tests,** mirroring `smials/teams-inertia/tests/Feature/Teams/DashboardTest.php` and `InvitationContextTest.php` case for case.
- [ ] **Step 2: Raise and run.** The first time, run `composer survey -- --livewire-teams` to install; failures from Task 3 pages are expected. Then run `vendor/bin/pest tests/Feature/Teams` in `raised/livewire-teams`. Expected: FAIL.
- [ ] **Step 3: Implement.** Port the screens and copy from `smials/teams-inertia-vue` (TeamSwitcher, PendingInvitationsModal, TeamInvitationAlert, CreateTeamModal, AppSidebar, AppHeader, UserInfo, Dashboard, Login, Register) into Flux and Blade. Use the same `data-test` attributes and the same sr-only labels.
- [ ] **Step 4: Run** the kit's Pest suite in `raised/livewire-teams`. Expected: PASS for everything except tests needing Task 3's pages. Run `composer overrides -- --accept`.
- [ ] **Step 5: Commit** `feat: route the livewire team kit through the current team`.

### Task 3: Livewire team management

**Files (in `smials/teams-livewire`):**
- Modify: `routes/web.php` (the team routes, copied exactly from `smials/teams-inertia/routes/web.php`).
- Create in `app/Http/Controllers/Teams`: the same controllers as `teams-inertia` (`TeamController`, `SwitchTeamController`, `LeaveTeamController`, `TeamMemberController`, `TeamInvitationController`, `AcceptInvitationController`, `DeclineInvitationController`).
  - They use the same actions, requests, redirects and toast copy.
  - They return `view('pages.teams.index', ...)` and `view('pages.teams.edit', ...)`, and redirect with `->with('toast', ...)`.
  - View data are plain arrays or models, not spatie Data classes. The edit page gets:
    - `team`;
    - `members` (id, name, email, role, role label);
    - pending `invitations` (empty without `inviteMember`);
    - `permissions` (the seven booleans, with the role resolved once as in `TeamPermissionsData`);
    - `availableRoles`.
- Create views:
  - `resources/views/pages/teams/index.blade.php` and `pages/teams/edit.blade.php`;
  - components `delete-team-modal`, `invite-member-modal`, `leave-team-modal`, `cancel-invitation-modal` and `remove-member-modal`.
- Tests in `tests/Feature/Teams`: `TeamTest.php`, `TeamMemberTest.php`, `TeamInvitationTest.php`, `InvitationResponseTest.php` and `TeamAccessTest.php`, mirroring `teams-inertia` case for case with view and session toast assertions.

**Interfaces:**
- Consumes: Task 2's components and layout, plus the `teams` requests, actions and policy.

- [ ] **Step 1: Write the failing feature tests** (mirrored, each validation scenario its own test, `fromRoute()` before redirects).
- [ ] **Step 2: Raise `livewire-teams` and run** `vendor/bin/pest tests/Feature/Teams`. Expected: FAIL.
- [ ] **Step 3: Implement the controllers and views.** Port `pages/teams/Index.vue` and `Edit.vue` and the five modals from `smials/teams-inertia-vue`:
  - same copy, permission gating, sr-only labels and `data-test` attributes;
  - error messages shown under the inputs (`@error`), including the invitation and role errors;
  - the edit form keyed so it never shows another team's name;
  - role changes as a form with a select that submits on change.
- [ ] **Step 4: Run** the kit's full Pest suite. Expected: PASS at 100% coverage. Run `composer overrides -- --accept`.
- [ ] **Step 5: Commit** `feat: add team management to the livewire team kit`.

### Task 4: Browser parity, docs and final verification

**Files:**
- Modify: `README.md` (kit table, smial table with `teams-livewire`, and the `teams-web` row now used by Livewire Teams) and `AGENTS.md` (Livewire team screens mirror the Inertia ones and pass `smials/teams-web/tests/Browser/TeamsTest.php`).
- Override from `livewire`: `README.md` in `smials/teams-livewire`, if the Livewire README lists features (add a Teams section like the `teams-inertia` one).

- [ ] **Step 1: Run the shared browser test.** Build `raised/livewire-teams` (`pnpm install`, `pnpm run build`) and run `tests/Browser/TeamsTest.php` unchanged. Fix the Livewire views until it passes. Never edit the test. If a step truly cannot work in Livewire, report NEEDS_CONTEXT with the reason.
- [ ] **Step 2: Write the docs,** with no dashes as punctuation.
- [ ] **Step 3: Verify.** Run `composer survey -- --livewire --livewire-teams --vue-teams --react-teams --svelte-teams`. Expected: every kit passes at 100%.
- [ ] **Step 4: Check the overlay.** Pack `livewire` with the overlay applied, using the Prepare Variant snippet from `smials/common/.github/workflows/tests.yml`. Make an initial commit, then install, build, migrate and run `composer test`. Expected: PASS. Delete the temp directory.
- [ ] **Step 5: Run** `composer test` and `composer overrides` (expect 0 problems), then check that `git status` is clean.
- [ ] **Step 6: Commit** `docs: document the livewire team kit`.
