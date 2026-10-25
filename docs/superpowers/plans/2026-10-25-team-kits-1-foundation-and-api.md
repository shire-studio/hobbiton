# Team Kits 1: Foundation and API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hobbiton can raise, tend, survey and deliver team variants of kits, the shared `teams` smial holds the whole team domain, and the API kit ships a working `api-teams` variant as an overlay.

**Architecture:** Team kits are ordinary entries in `hobbiton.json` with a `base` key whose smials are the base kit's smials plus team smials appended. A new `pack` command raises a base kit and writes the difference to its team variant into `.starter-kit/teams/`. `deliver` and quick post call `pack` instead of `raise`. Team smials override base files whole, and `team-overrides.json` records the hash of each base file a team smial overrides so a later base change cannot go unnoticed.

**Tech Stack:** Laravel 13 (Hobbiton and kits), Pest, Node scripts (`node:test`), GitHub Actions, Sanctum (API kit).

**Spec:** `docs/superpowers/specs/2026-10-25-team-kits-design.md`

This is plan 1 of 3. Plan 2 adds the Inertia team kits (`teams-web`, `teams-inertia` and the three frontends). Plan 3 adds `livewire-teams`. Plans 2 and 3 are written after this one lands, so they build on real interfaces.

## Global Constraints

- Edit inside `smials/`, never in `raised/` without tending back. Raise a kit with `php artisan raise --kit=<kit>` and run its tests from `raised/<kit>` with `vendor/bin/pest`. New team files are written straight into the right smial, because tend puts new files in the kit's top smial.
- Kit PHP follows `smials/common/.ai/rules/*` and `smials/api/.ai/rules/*`: `declare(strict_types=1)`, `final readonly` Actions with one `handle()`, Form Requests for validation, no `$fillable`, explicit `casts()`, `@property` docs, forward only migrations with no `down()`, no cascade or null on delete in migrations, parent delete actions compose child deletes, policies under `app/Policies`, controller parameter order (route models, request, `#[CurrentUser] User $user`, actions).
- Every raised kit passes `composer test` with 100% code and type coverage. Survey every kit a changed smial feeds.
- Team smials only add or replace files. The base kits must raise byte for byte as before, except the two delivery changes in Task 9.
- Teams and memberships use UUID primary keys (`HasUuids`), matching `User`. API routes bind `{team}` by UUID. Invitations bind by `code`.
- Personal team name: `"{$user->name}'s Team"`. Invitations expire 3 days after creation. Invitation codes are 64 random characters.
- Roles: `owner`, `admin`, `member`. Permissions: `team:update`, `team:delete`, `member:add`, `member:update`, `member:remove`, `invitation:create`, `invitation:cancel`. Owner has all, Admin has `team:update`, `invitation:create` and `invitation:cancel`, Member has none.
- Overlay path `.starter-kit/teams/`, holding `manifest.json` (`{"version": 1, "deleted": [...]}`) and `files/`.
- Docs and README text never use dashes as punctuation.
- No new Composer or npm dependencies.

## Review Focus

1. **A base smial changes after a team smial overrode the same file.** A maintainer expects `composer test` in Hobbiton to fail and name the override. Pinned in Task 2 (`it fails when a base file changed after it was overridden`).
2. **Deleting a file while tending a team kit.** A maintainer expects the base kit to keep its file. Pinned in Task 2 (`deleteTarget refuses base owned files`).
3. **Applying the overlay to the base kit.** A developer expects the result to equal the raised team kit exactly, including executable bits and deleted files. Pinned in Task 7 (`it applies the overlay to reproduce the team kit`).
4. **An existing project with users gets teams later.** Its users expect to keep working with a personal team and a current team. Pinned in Task 5 (`it creates personal teams for existing users`) and Task 6 (`it falls back to the personal team when no current team is set`).
5. **Deleting a user who owns a team with other members.** The members expect to be moved to their personal team, not left pointing at a deleted team. Pinned in Task 5 (`it moves members of deleted teams to their personal team`).

---

### Task 1: Team kits in the manifest

**Files:**
- Modify: `hobbiton.json`
- Modify: `app/Support/Manifest.php`
- Test: `tests/Feature/ManifestTest.php` (create)

**Interfaces:**
- Produces: `Manifest::baseKits(): list<string>` (kits without `base`), `Manifest::teamKitFor(string $name): ?string` (the kit whose `base` is `$name`), and the `base?: string` key in the kit array shape. The `api-teams` kit entry.

- [ ] **Step 1: Write the failing tests** in `tests/Feature/ManifestTest.php`:
  - `it pairs every team kit with a base kit`: for each kit with `base`, the base exists, has no `base` itself, and `teamKitFor($base)` returns the team kit.
  - `it raises team kits from their base smials followed by team smials`: `array_slice($team['smials'], 0, count($base['smials']))` equals the base smials, and every remaining smial starts with `teams`.
  - `it gives team kits their base kit's repository, node, exclude and replacements`: the four keys are equal.
  - `it lists base kits`: `baseKits()` is `['vue', 'react', 'svelte', 'livewire', 'api', 'blade']`.
- [ ] **Step 2: Run** `vendor/bin/pest tests/Feature/ManifestTest.php`. Expected: FAIL, `baseKits` undefined.
- [ ] **Step 3: Add `api-teams` to `hobbiton.json`** with label `API Teams`, `"base": "api"`, the API kit's repository, `node`, `exclude` and `replacements` copied exactly, and smials `common, auth, api, teams, teams-api`. Add the two methods and the `base?: string` shape key to `Manifest`.
- [ ] **Step 4: Run** `vendor/bin/pest tests/Feature/ManifestTest.php tests/Feature/RaiseCommandTest.php`. Expected: PASS (raise skips smials that do not exist yet).
- [ ] **Step 5: Commit** `feat: add team kits to the manifest`.

### Task 2: Tend team kits into team smials and record overrides

**Files:**
- Modify: `scripts/helpers.js`, `scripts/tend.js`
- Create: `scripts/overrides.js`, `team-overrides.json` (starts as `{}`), `tests/scripts/tend.test.js`, `tests/Feature/TeamOverridesTest.php`
- Modify: `composer.json` (add `"overrides": "node scripts/overrides.js"`)

**Interfaces:**
- Produces in `helpers.js`:
  - `teamSmialFor(baseSmial: string, smials: string[]): string` returns `teams-${baseSmial}` when the kit lists it, otherwise `teams`.
  - `tendTarget(relativePath: string, kit: object, root = smialsDir): { smial: string, overrides: string | null }`. For a kit without `base` it returns `owningSmial` and `overrides: null`. For a team kit, when the owner is a team smial it returns that. When the owner is a base smial it returns `teamSmialFor(owner)` and `overrides: owner`. New files go to the top smial.
  - `deleteTarget(relativePath, kit, root = smialsDir): string | null` returns `null` for a team kit when the owner is a base smial.
  - `loadOverrides(): Record<string, { base: string, sha1: string }>`, `recordOverride(teamSmial, relativePath, baseSmial): void`, both keyed `"<teamSmial>/<relativePath>"`. `sha1` is the hex SHA1 of `smials/<base>/<relativePath>`.
  - `owningSmial` gains the same optional `root` parameter.
- Produces: `composer overrides` lists stale entries and exits 1, and `composer overrides -- --accept` rewrites every `sha1` to the current base file and removes entries whose files no longer exist.

- [ ] **Step 1: Write failing node tests** in `tests/scripts/tend.test.js` against a temporary smials root built in the test:
  - `teamSmialFor maps a base smial to its team smial`: `('api', ['common','auth','api','teams','teams-api'])` gives `teams-api`, `('auth', …)` gives `teams`, `('web', …)` gives `teams`.
  - `tendTarget overrides base owned files in the team smial`: a file only in `auth` gives `{ smial: 'teams', overrides: 'auth' }`.
  - `tendTarget keeps team owned files in place`: a file in `auth` and `teams-api` gives `{ smial: 'teams-api', overrides: null }`.
  - `tendTarget leaves base kits unchanged`: for `{ smials: [...] }` without `base`, the result equals `owningSmial`.
  - `deleteTarget refuses base owned files`: returns `null` for a team kit and a base owned file.
- [ ] **Step 2: Run** `node --test tests/scripts/tend.test.js`. Expected: FAIL.
- [ ] **Step 3: Implement the helpers.** In `tend.js`, `syncFile` uses `tendTarget`. When `overrides` is set it writes the file, calls `recordOverride` and logs in yellow `Overrode smials/<base>/<path> in smials/<team>`. `deleteFile` uses `deleteTarget` and, on `null`, logs in yellow `<path> belongs to smials/<base>. Add it to exclude in hobbiton.json to drop it from <kit>.` without deleting. Write `scripts/overrides.js` with a `--accept` flag.
- [ ] **Step 4: Run** `node --test tests/scripts/*.test.js`. Expected: PASS.
- [ ] **Step 5: Write failing Pest tests** in `tests/Feature/TeamOverridesTest.php` against fixture smials and ledger in a temporary directory (put the check in `App\Support\TeamOverrides::problems(Manifest $manifest, string $smialsPath, array $ledger): list<string>` so it is testable), plus one test against the real repository:
  - `it accepts an override whose base file is unchanged`.
  - `it fails when a base file changed after it was overridden`: the problem names `teams/app/Models/User.php` and `auth`.
  - `it fails when an override is missing from the ledger`.
  - `it fails when the ledger lists a file that no longer exists`.
  - `the repository's overrides are up to date`: `problems(Manifest::load(), base_path('smials'), json_decode(team-overrides.json))` is empty.
  For each team kit and each file in its team smials, the base owner is the last base smial in the kit's order that has the file.
- [ ] **Step 6: Implement `App\Support\TeamOverrides`.** Run `vendor/bin/pest tests/Feature/TeamOverridesTest.php`. Expected: PASS.
- [ ] **Step 7: Commit** `feat: tend team kits into team smials and track overrides`.

### Task 3: The team data layer

**Files (all in `smials/teams` unless noted):**
- Create: `database/migrations/2026_10_25_000000_create_teams_table.php` (`teams`, `team_members`, `team_invitations`), `database/migrations/2026_10_25_000001_add_current_team_id_to_users_table.php`
- Create: `app/Enums/TeamRole.php`, `app/Enums/TeamPermission.php`, `app/Models/Team.php`, `app/Models/Membership.php`, `app/Models/TeamInvitation.php`, `app/Concerns/HasTeams.php`
- Create: `database/factories/TeamFactory.php`, `database/factories/TeamInvitationFactory.php`
- Override: `app/Models/User.php` (from `auth`), `database/factories/UserFactory.php` (from `auth`), and in `smials/teams-api`: `app/Models/User.php` and `database/factories/UserFactory.php` (from `api`)
- Test: `tests/Unit/Enums/TeamRoleTest.php`, `tests/Unit/Models/TeamTest.php`, `tests/Unit/Models/MembershipTest.php`, `tests/Unit/Models/TeamInvitationTest.php`, `tests/Unit/Concerns/HasTeamsTest.php`
- Modify: `team-overrides.json` (via tend or `composer overrides -- --accept`)

**Interfaces:**
- Consumes: nothing from earlier tasks beyond raising `api-teams`.
- Produces:
  - Schema as the spec's Data section, with `uuid` keys, `foreignIdFor(...)->constrained()` and no cascades. `teams.slug` is unique, `team_members` is unique on `(team_id, user_id)`, `team_invitations.code` is unique, and `teams` has soft deletes.
  - `TeamRole` with `label(): string`, `permissions(): list<TeamPermission>`, `hasPermission(TeamPermission): bool`, `level(): int` (3, 2, 1), `isAtLeast(TeamRole): bool` and `static assignable(): list<array{value: string, label: string}>`.
  - `Team`: `members(): BelongsToMany<User>` using `Membership` with pivot `role`, `memberships(): HasMany`, `invitations(): HasMany`, `owner(): ?User`. No `getRouteKeyName` override; web routes bind `{team:slug}`.
  - `TeamInvitation`: `team()`, `inviter()`, `isAccepted()`, `isExpired()`, `isPending()`, and `scopePending(Builder)` (not accepted, and not expired or no expiry).
  - `HasTeams` on `User`: `teams()`, `ownedTeams()`, `teamMemberships()`, `currentTeam()`, `personalTeam(): ?Team`, `belongsToTeam(Team): bool`, `isCurrentTeam(Team): bool`, `ownsTeam(Team): bool`, `teamRole(Team): ?TeamRole`, `hasTeamPermission(Team, TeamPermission): bool`, `fallbackTeam(?Team $excluding = null): ?Team` (alphabetical by lower case name) and `currentTeamOrPersonal(): ?Team`. It has no URL side effects.
  - `TeamFactory` with a `personal()` state. `TeamInvitationFactory` with `expired()` and `accepted()` states and a 64 character `code`. `UserFactory` with an `afterCreating` hook that creates and switches to a personal team, and a `withoutPersonalTeam()` state that skips it.

- [ ] **Step 1: Write the failing unit tests** with these names and assertions:
  - `TeamRoleTest`: `it grants owners every permission`, `it grants admins team updates and invitations` (exactly `UpdateTeam`, `CreateInvitation`, `CancelInvitation`), `it grants members nothing`, `it compares role levels` (`Admin->isAtLeast(Member)` is true and `Member->isAtLeast(Admin)` is false), `it lists assignable roles without the owner` (`[['value' => 'admin', 'label' => 'Admin'], ['value' => 'member', 'label' => 'Member']]`).
  - `TeamTest`: `it returns the owner`, `it lists members with their roles`, `it soft deletes`.
  - `TeamInvitationTest`: `it is pending until accepted or expired`, `it scopes pending invitations`.
  - `HasTeamsTest`: `it creates a personal team for factory users`, `it knows team membership and roles`, `it checks permissions through the role`, `it picks a fallback team alphabetically` (teams named `b`, `A` and `c` give `A`), `it falls back to the personal team when no current team is set`.
- [ ] **Step 2: Raise and run.** `php artisan raise --kit=api-teams` then, in `raised/api-teams`, run `vendor/bin/pest tests/Unit`. Expected: FAIL.
- [ ] **Step 3: Implement** the files above. Port behaviour from the official `teams` branch (`app/Models/*`, `app/Enums/*`, `app/Concerns/HasTeams.php`, `database/factories/*`) and apply our conventions. `UserFactory` creates the personal team directly with `TeamFactory`, not through an action.
- [ ] **Step 4: Raise and run again.** Expected: PASS. Then run `composer overrides -- --accept` and check the four new ledger entries.
- [ ] **Step 5: Commit** `feat: add the team data layer`.

### Task 4: Team policy and validation rules

**Files (in `smials/teams`):**
- Create: `app/Policies/TeamPolicy.php`, `app/Rules/TeamName.php`, `app/Rules/UniqueTeamInvitation.php`, `app/Rules/ValidTeamInvitation.php`
- Test: `tests/Unit/Policies/TeamPolicyTest.php`, `tests/Unit/Rules/TeamNameTest.php`, `tests/Unit/Rules/UniqueTeamInvitationTest.php`, `tests/Unit/Rules/ValidTeamInvitationTest.php`

**Interfaces:**
- Produces:
  - `TeamPolicy`: `view`, `update`, `delete`, `leave`, `addMember`, `updateMember`, `removeMember`, `inviteMember` and `cancelInvitation`, each `(User $user, Team $team): bool`.
  - `new TeamName()`, `new UniqueTeamInvitation(Team $team)` and `new ValidTeamInvitation(User $user)`. Their failure messages are full English sentences: `This team name is reserved and cannot be used.`, `This user has already been invited to the team.`, `This user is already a member of the team.` and `This invitation is invalid or has expired.`

- [ ] **Step 1: Write the failing tests.**
  - Policy, one test per ability. Cover the role matrix (owner, admin, member, non member) and the personal team rules: `it forbids leaving a personal team`, `it forbids owners leaving their team`, `it forbids deleting a personal team`.
  - `TeamNameTest`: `it rejects route prefixes` (`settings`, `login`, `teams`), `it rejects reserved names` (`admin`, `404`), `it ignores case and whitespace` (`' Settings '`), `it accepts other names`.
  - `UniqueTeamInvitationTest`: `it rejects an email with a pending invitation`, `it rejects an email of an existing member` (case insensitive), `it accepts an email whose invitation expired`.
  - `ValidTeamInvitationTest`: `it accepts a pending invitation for the user's email` (case insensitive), `it rejects an invitation for another email`, `it rejects an expired invitation`, `it rejects an accepted invitation`.
- [ ] **Step 2: Raise `api-teams` and run the four test files.** Expected: FAIL.
- [ ] **Step 3: Implement**, porting the official reserved names list from `app/Rules/TeamName.php` on the official `teams` branch.
- [ ] **Step 4: Run again.** Expected: PASS.
- [ ] **Step 5: Commit** `feat: add the team policy and rules`.

### Task 5: Team actions and invitation notification

**Files (in `smials/teams` unless noted):**
- Create in `app/Actions`: `CreateTeamSlug`, `CreateTeam`, `UpdateTeam`, `DeleteTeam`, `LeaveTeam`, `SwitchTeam`, `CreateTeamInvitation`, `CancelTeamInvitation`, `AcceptTeamInvitation`, `DeclineTeamInvitation`, `UpdateTeamMember`, `RemoveTeamMember`, `DeleteUserTeams`
- Create: `app/Notifications/TeamInvitationNotification.php`
- Create: `database/migrations/2026_10_25_000002_create_personal_teams_for_existing_users.php`, tested in `tests/Unit/Migrations/CreatePersonalTeamsForExistingUsersTest.php`
- Create in `smials/teams-api`: `app/Actions/CreateTeamInvitationUrl.php`
- Override: `app/Actions/CreateUser.php` (from `auth`), `app/Actions/DeleteUser.php` (from `auth`), and in `smials/teams-api`: `app/Actions/DeleteUser.php` (from `api`)
- Test: one `tests/Unit/Actions/<Action>Test.php` per action (the `CreateTeamInvitationUrl` test goes in `smials/teams-api`), and `tests/Unit/Notifications/TeamInvitationNotificationTest.php` in `smials/teams-api`, since its URL is layer specific

**Interfaces:**
- Produces (each a `final readonly` class with `handle`):
  - `CreateTeamSlug::handle(string $name, ?Team $ignoring = null): string`: `Str::slug($name)`, unique across teams including soft deleted ones, with `-<n>` one above the highest existing suffix on collision.
  - `CreateTeam::handle(User $user, array $attributes, bool $personal = false): Team` creates the team and the owner membership, and switches the user to it, in one transaction.
  - `UpdateTeam::handle(Team $team, array $attributes): Team` regenerates the slug when the name changes.
  - `DeleteTeam::handle(Team $team, User $user): void` switches every other user whose current team it is to `currentTeamOrPersonal` after detaching, switches `$user` to `fallbackTeam($team)` if it was current, deletes invitations and memberships, and soft deletes the team, in one transaction.
  - `LeaveTeam::handle(Team $team, User $user): void` removes the membership and switches to `fallbackTeam($team)` if the team was current.
  - `SwitchTeam::handle(User $user, Team $team): void` sets `current_team_id`.
  - `CreateTeamInvitation::handle(Team $team, User $inviter, array $attributes): TeamInvitation` (attributes `email` and `role`) sets a 64 character code and `expires_at = now()->addDays(3)`, and notifies `Notification::route('mail', $email)`.
  - `CancelTeamInvitation::handle(TeamInvitation $invitation): void`.
  - `AcceptTeamInvitation::handle(TeamInvitation $invitation, User $user): Team` creates the membership with the invited role (or keeps an existing one), sets `accepted_at` and switches the user.
  - `DeclineTeamInvitation::handle(TeamInvitation $invitation): void` deletes it.
  - `UpdateTeamMember::handle(Team $team, User $member, array $attributes): void` (attribute `role`).
  - `RemoveTeamMember::handle(Team $team, User $member): void` switches the member to their personal team if the team was current.
  - `DeleteUserTeams::handle(User $user): void` runs `DeleteTeam` for every team the user owns, deletes the user's remaining memberships and the invitations they sent, and clears `current_team_id`.
  - `CreateUser` gains a `CreateTeam` dependency and creates the personal team in the same transaction.
  - Both `DeleteUser` overrides call `DeleteUserTeams` first, inside their existing flow.
  - `CreateTeamInvitationUrl::handle(TeamInvitation $invitation): string`. The API version returns `config()->string('app.frontend_url').'/invitations/'.$invitation->code`. Plan 2 adds the web version.
  - `TeamInvitationNotification` (queued, mail only). Subject: `You've been invited to join :team`. Lines: `:inviter has invited you to join the :team team.` and `Log in and visit your dashboard to accept or decline this invitation.` Action `Log in` uses the URL from `CreateTeamInvitationUrl`.

- [ ] **Step 1: Write the failing action tests.** Each test resolves the action and calls `handle()`. Required cases:
  - `CreateTeamSlugTest`: `it slugs the name`, `it suffixes a taken slug` (`acme`, `acme-1`, `acme-2` taken gives `acme-3`), `it counts soft deleted teams`, `it ignores the given team`.
  - `CreateTeamTest`: `it creates a team owned by the user and switches to it`, `it creates a personal team`.
  - `UpdateTeamTest`: `it renames the team and its slug`.
  - `DeleteTeamTest`: `it deletes the team, its memberships and invitations`, `it moves members whose current team it was to their personal team`, `it switches the deleting user to a fallback team`.
  - `LeaveTeamTest`, `SwitchTeamTest`, `CancelTeamInvitationTest`, `DeclineTeamInvitationTest`, `UpdateTeamMemberTest`: the main case each.
  - `RemoveTeamMemberTest`: `it removes the member`, `it moves the member to their personal team when it was current`.
  - `CreateTeamInvitationTest`: `it creates an invitation that expires in three days` (frozen time, `expires_at` equals `now()->addDays(3)`), `it notifies the invited email` (`Notification::fake()`, `assertSentOnDemand`).
  - `AcceptTeamInvitationTest`: `it joins the team with the invited role and switches to it`, `it keeps an existing membership`.
  - `DeleteUserTeamsTest`: `it deletes owned teams`, `it moves members of deleted teams to their personal team`, `it removes memberships and sent invitations`.
  - `CreateUserTest` (override of the `auth` test): the existing assertions plus `it creates a personal team for the user`.
  - `DeleteUserTest` (both overrides): the existing assertions plus `it deletes the user's teams`.
  - `CreatePersonalTeamsForExistingUsersTest`: `it creates personal teams for existing users` (two users created `withoutPersonalTeam()`; after running the migration's `up()` each owns one personal team named `"<name>'s Team"`, which is their current team) and `it leaves users who already have a team alone`.
  - `CreateTeamInvitationUrlTest` (API): `it links to the frontend invitation page`.
  - `TeamInvitationNotificationTest` (API): `it mails the invitation` (subject, lines and action URL are exact).
- [ ] **Step 2: Raise `api-teams` and run `vendor/bin/pest tests/Unit`.** Expected: FAIL.
- [ ] **Step 3: Implement.** Port behaviour from the official `TeamController`, `TeamMemberController`, `TeamInvitationController` and `CreateNewUser`, moved into actions. The backfill migration calls `CreateTeam` with `personal: true` for every user with no membership, chunked by id.
- [ ] **Step 4: Run again.** Expected: PASS. Run `composer overrides -- --accept` and check the ledger.
- [ ] **Step 5: Commit** `feat: add team actions and invitations`.

### Task 6: The API team endpoints

**Files (in `smials/teams-api`):**
- Override: `routes/api.php`, `app/Http/Resources/UserResource.php`, `tests/Feature/Settings/ProfileTest.php` (from `api`)
- Create in `app/Http/Controllers/Teams`: `TeamController` (`index`, `store`, `show`, `update`, `destroy`), `LeaveTeamController` (invokable), `TeamMemberController` (`update`, `destroy`), `TeamInvitationController` (`store`, `destroy`), `InvitationController` (`index`, `accept`, `decline`)
- Create: `app/Http/Controllers/Settings/CurrentTeamController.php` (invokable)
- Create in `app/Http/Requests`: `SaveTeamRequest` (`name`: required, string, max 255, `new TeamName()`), `DeleteTeamRequest` (`name` must equal the team name, message `The team name does not match.`), `CreateTeamInvitationRequest` (`email` with `ValidEmail` and `UniqueTeamInvitation`, `role` in `assignable` values), `UpdateTeamMemberRequest` (`role` in `assignable`), `RespondToTeamInvitationRequest` (`ValidTeamInvitation` on the route invitation), `UpdateCurrentTeamRequest` (`team_id` exists and the user belongs to it)
- Create in `app/Http/Resources`: `TeamResource` (`id`, `name`, `slug`, `is_personal`, `role`, `is_current`), `TeamMemberResource` (`id`, `name`, `email`, `role`), `TeamInvitationResource` (`code`, `email`, `role`, `team` (a `TeamResource` without `role` and `is_current`), `inviter_name`, `expires_at`, `created_at`)
- Test in `tests/Feature/Teams`: `TeamTest.php`, `TeamMemberTest.php`, `TeamInvitationTest.php`, `InvitationTest.php`, `CurrentTeamTest.php`, plus the override `tests/Feature/Auth/RegisterTest.php` (from `api`)

**Interfaces:**
- Consumes: every action from Task 5, `TeamPolicy`, the rules.
- Produces these routes inside the existing `auth:sanctum` group:

| Method | URI | Name |
| --- | --- | --- |
| GET | `teams` | `teams.index` |
| POST | `teams` | `teams.store` |
| GET | `teams/{team}` | `teams.show` |
| PATCH | `teams/{team}` | `teams.update` |
| DELETE | `teams/{team}` | `teams.destroy` |
| DELETE | `teams/{team}/leave` | `teams.leave` |
| PATCH | `teams/{team}/members/{user}` | `teams.members.update` |
| DELETE | `teams/{team}/members/{user}` | `teams.members.destroy` |
| POST | `teams/{team}/invitations` | `teams.invitations.store` |
| DELETE | `teams/{team}/invitations/{invitation:code}` | `teams.invitations.destroy` |
| GET | `invitations` | `invitations.index` |
| POST | `invitations/{invitation:code}/accept` | `invitations.accept` |
| DELETE | `invitations/{invitation:code}` | `invitations.decline` |
| PUT | `user/current-team` | `user.current-team.update` |

- `GET user` adds `current_team` (a `TeamResource` or `null`). `GET teams/{team}` returns the team with `members`, pending `invitations` (for members with `invitation:create`), and `permissions` (an object of seven booleans keyed `can_update_team`, `can_delete_team`, `can_add_member`, `can_update_member`, `can_remove_member`, `can_create_invitation`, `can_cancel_invitation`). Authorisation uses `TeamPolicy` through `Gate::authorize` in controllers, never a form request's `authorize()`, so every denial is a 404 under the API's `Gate::defaultDenialResponse(Response::denyAsNotFound())`. The "forbids" tests below therefore expect 404. Creates return 201, deletes return 204.

- [ ] **Step 1: Write the failing feature tests.** Each validation scenario gets its own test, per the feature test rules, and responses are asserted with `assertExactJson` or `assertJsonPath`, including nulls. Required cases:
  - `RegisterTest` (override): the existing tests plus `it creates a personal team on registration`.
  - `TeamTest`: `it lists the user's teams`, `it creates a team`, `it rejects a reserved team name`, `it shows a team to members`, `it hides a team from non members` (404), `it lets admins rename a team`, `it forbids members renaming a team`, `it deletes a team when the name matches`, `it rejects deleting with a different name`, `it forbids deleting a personal team`, `it lets members leave a team`, `it forbids owners leaving their team`.
  - `TeamMemberTest`: `it lets owners change a member's role`, `it forbids admins changing roles`, `it rejects assigning the owner role`, `it lets owners remove a member`, `it forbids removing the owner`.
  - `TeamInvitationTest`: `it invites a member by email` (201 and notification sent), `it rejects inviting an existing member`, `it rejects a duplicate pending invitation`, `it forbids members inviting`, `it cancels an invitation`, `it returns 404 for an invitation from another team`.
  - `InvitationTest`: `it lists pending invitations for the user's email`, `it accepts an invitation` (membership created and current team switched), `it declines an invitation`, `it rejects an invitation for another email`, `it rejects an expired invitation`.
  - `CurrentTeamTest`: `it switches the current team`, `it rejects a team the user does not belong to`, `it falls back to the personal team when no current team is set` (`GET user` returns the personal team when `current_team_id` is null).
  - `ProfileTest` (override): the existing `assertExactJson` gains `current_team`.
- [ ] **Step 2: Raise `api-teams` and run `vendor/bin/pest tests/Feature`.** Expected: FAIL.
- [ ] **Step 3: Implement** the routes, controllers, requests and resources. `UserResource` uses `currentTeamOrPersonal()`.
- [ ] **Step 4: Run** `composer survey -- --api-teams --tend`. Expected: PASS with 100% code and type coverage. Then run `composer overrides -- --accept`.
- [ ] **Step 5: Run** `composer survey -- --api` and `composer test` in Hobbiton. Expected: PASS.
- [ ] **Step 6: Commit** `feat: add team endpoints to the api kit`.

### Task 7: Pack a kit with its team overlay

**Files:**
- Create: `app/Support/Overlay.php`, `app/Console/Commands/PackCommand.php`, `tests/Feature/OverlayTest.php`, `tests/Feature/PackCommandTest.php`
- Modify: `app/Console/Commands/RaiseCommand.php` (make `KEEP` public)

**Interfaces:**
- Consumes: `Manifest::teamKitFor()` (Task 1), `RaiseCommand::KEEP`.
- Produces:
  - `Overlay::diff(string $basePath, string $variantPath): array{files: list<string>, deleted: list<string>}`, sorted relative paths. It ignores `RaiseCommand::KEEP` paths and `.starter-kit`. A file is listed in `files` when it is missing from the base or its bytes differ.
  - `Overlay::write(string $basePath, string $variantPath): void` writes `files/<path>` (copied, mode kept) and `manifest.json` (`JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES`, trailing newline) under `$basePath/.starter-kit/teams/`. It writes nothing when the diff is empty.
  - Artisan `pack {--kit=} {--to=}` raises the kit into `--to` (required), raises its team kit into a temporary directory under `storage/framework/pack`, writes the overlay and removes the temporary directory. It fails with `Pack the base kit [api] instead.` when given a team kit. A kit without a team kit is packed with no `.starter-kit`.

- [ ] **Step 1: Write failing tests** in `tests/Feature/OverlayTest.php` with fixture trees:
  - `it lists added and changed files`: `files` holds the added and changed paths, not the unchanged one.
  - `it lists files the variant deletes`.
  - `it ignores kept paths`: `.git/config`, `vendor/x`, `node_modules/x`, `.env` and `database/database.sqlite` never appear.
  - `it keeps the executable bit`: an executable file in the variant is executable in `files/`.
  - `it writes nothing when the trees match`: `.starter-kit` does not exist.
  - `it writes the manifest`: decoded `manifest.json` equals `['version' => 1, 'deleted' => [...]]`.
- [ ] **Step 2: Write failing tests** in `tests/Feature/PackCommandTest.php`:
  - `it packs the api kit with its team overlay`: `.starter-kit/teams/files/app/Models/Team.php` and `.starter-kit/teams/manifest.json` exist, and the packed tree outside `.starter-kit` equals a plain raise of `api`.
  - `it applies the overlay to reproduce the team kit`: pack `api`, apply the overlay in PHP (copy `files/`, delete `deleted`, remove `.starter-kit`), raise `api-teams` to another directory, and assert both trees have the same paths, file hashes and executable bits, excluding `.git`.
  - `it packs kits without a team variant unchanged`: packing `blade` leaves no `.starter-kit`.
  - `it refuses to pack a team kit`.
- [ ] **Step 3: Run** `vendor/bin/pest tests/Feature/OverlayTest.php tests/Feature/PackCommandTest.php`. Expected: FAIL.
- [ ] **Step 4: Implement `Overlay` and `PackCommand`** in Hobbiton's existing style (`RaiseCommand` is the model). Raise by calling the `raise` command (`$this->call('raise', [...])`).
- [ ] **Step 5: Run the same tests.** Expected: PASS.
- [ ] **Step 6: Commit** `feat: pack kits with their team overlay`.

### Task 8: Deliver, quick post, survey and harvest handle team kits

**Files:**
- Modify: `scripts/deliver.js`, `scripts/harvest.js`, `.github/workflows/quick-post.yml`, `README.md`, `AGENTS.md`

**Interfaces:**
- Consumes: `pack` (Task 7), the `base` key (Task 1).

- [ ] **Step 1: `deliver.js`** runs `php artisan pack` instead of `raise`. Given a team kit flag it logs in red `<kit> is delivered with <base>. Deliver --<base> instead.` and exits 1. With no flags it delivers base kits only.
- [ ] **Step 2: `quick-post.yml`.** The `Read Kits` jq filter adds `select(.value.base == null)`, and the raise step becomes `php artisan pack --kit=… --to=…`.
- [ ] **Step 3: `harvest.js`.** The update phase covers only kits without `base`. The survey phase also surveys the team kit of every harvested base kit. Team kits share their base kit's lock files, so they are surveyed with `--tend` like the rest.
- [ ] **Step 4: Verify** `composer deliver -- --api` with `HOBBITON_DELIVER_DIR` set to a scratch directory produces a checkout with `.starter-kit/teams/manifest.json`, and `composer deliver -- --api-teams` exits 1 with the message above.
- [ ] **Step 5: Docs.** In `README.md`, add the team smials and `api-teams` to the smial and kit tables, add a "Team Kits" section (team kits, the overlay, `pack`, tending rules, `composer overrides`), and update the Delivering and Quick Post sections. In `AGENTS.md`, add rules: team code goes in the lowest team smial every affected team kit shares; overriding a base file records it in `team-overrides.json`; run `composer overrides` after changing a base file a team smial overrides; survey the team kit with its base kit. Use no dashes as punctuation.
- [ ] **Step 6: Run** `composer test`. Expected: PASS.
- [ ] **Step 7: Commit** `feat: deliver team kits as an overlay of their base kit`.

### Task 9: Kit repositories test both variants and clean plain installs

**Files:**
- Modify: `smials/common/.github/workflows/tests.yml`, `smials/api/.github/workflows/tests.yml`
- Modify: `smials/inertia/composer.json`, `smials/livewire/composer.json`, `smials/api/composer.json`
- Test: `tests/Feature/RaiseCommandTest.php`

- [ ] **Step 1: Write the failing test** `it removes the overlay first when a project is created` in `RaiseCommandTest`, using a dataset of `vue`, `react`, `svelte`, `livewire` and `api`. It asserts that `scripts.post-create-project-cmd[0]` of the raised `composer.json` equals `@php -r "require 'vendor/autoload.php'; (new Illuminate\Filesystem\Filesystem)->deleteDirectory('.starter-kit');"`.
- [ ] **Step 2: Run it.** Expected: FAIL. Add that entry first in the three `composer.json` files (JSON escaped). Run it. Expected: PASS.
- [ ] **Step 3: Workflows.** In both `tests.yml` files, add a `variants` job that checks out and outputs `variants=["base","teams"]` when `.starter-kit/teams/manifest.json` exists, otherwise `["base"]`. The `ci` job gains `needs: variants`, `strategy.fail-fast: false`, `matrix.variant: ${{ fromJson(needs.variants.outputs.variants) }}` and the name `ci (${{ matrix.variant }})`. A first step after checkout prepares the variant:

```bash
if [ "$VARIANT" = "teams" ]; then
  cp -R .starter-kit/teams/files/. .
  jq -r '.deleted[]' .starter-kit/teams/manifest.json | while IFS= read -r file; do rm -f -- "$file"; done
fi
rm -rf .starter-kit
```

  Projects created from a kit have no `.starter-kit`, so they run only the base variant.
- [ ] **Step 4: Verify.** Run `composer test` in Hobbiton and `composer survey -- --api --vue`. Expected: PASS.
- [ ] **Step 5: Commit** `feat: test team overlays in kit repositories`.

### Task 10: Final verification

- [ ] **Step 1:** Run `composer test`. Expected: PASS.
- [ ] **Step 2:** Run `composer survey -- --vue --react --svelte --livewire --api --blade --api-teams`. Expected: every kit passes. The base kits only changed in Task 9.
- [ ] **Step 3:** Run `php artisan pack --kit=api --to=<scratch>`. Apply the overlay with the shell snippet from Task 9, then run `composer install && composer test` in that directory. Expected: PASS. This is what the kit repository's `ci (teams)` job will do.
- [ ] **Step 4:** Use `git status` to confirm nothing under `raised/` is staged and `team-overrides.json` is committed.
