<?php

declare(strict_types=1);

use App\Enums\TeamRole;
use App\Models\Team;
use App\Models\User;

function teamFor(User $user, TeamRole $role, array $attributes = []): Team
{
    $team = Team::factory()->create($attributes);
    $team->members()->attach($user, ['role' => $role->value]);

    return $team;
}

it("lists the user's teams", function (): void {
    $user = User::factory()->create(['name' => 'Test User']);
    $personal = $user->personalTeam();
    $team = teamFor($user, TeamRole::Member, ['name' => 'Acme']);
    Team::factory()->create();

    $this->actingAs($user)
        ->get(route('teams.index'))
        ->assertOk()
        ->assertViewIs('pages.teams.index')
        ->assertViewHas('teams', fn (array $teams): bool => count($teams) === 2
            && $teams[0]['id'] === $team->id
            && $teams[0]['name'] === 'Acme'
            && $teams[0]['role'] === 'member'
            && $teams[0]['is_current'] === false
            && $teams[1]['id'] === $personal->id
            && $teams[1]['is_personal'] === true
            && $teams[1]['role'] === 'owner'
            && $teams[1]['is_current'] === true);
});

it('creates a team', function (): void {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('teams.store'), ['name' => 'Acme'])
        ->assertSessionHasNoErrors();

    $team = Team::query()->where('name', 'Acme')->firstOrFail();

    expect($user->fresh()->current_team_id)->toBe($team->id)
        ->and($user->ownsTeam($team))->toBeTrue()
        ->and($team->is_personal)->toBeFalse();
});

it('redirects to the new team after creating it', function (): void {
    $this->actingAs(User::factory()->create())
        ->fromRoute('teams.index')
        ->post(route('teams.store'), ['name' => 'Acme'])
        ->assertRedirectToRoute('teams.edit', ['team' => Team::query()->where('name', 'Acme')->firstOrFail()->slug])
        ->assertSessionHas('toast', ['type' => 'success', 'message' => 'Team created.']);
});

it('rejects a reserved team name', function (): void {
    $this->actingAs(User::factory()->create())
        ->fromRoute('teams.index')
        ->post(route('teams.store'), ['name' => 'teams'])
        ->assertRedirectToRoute('teams.index')
        ->assertSessionHasErrors('name');
});

it('requires a team name', function (): void {
    $this->actingAs(User::factory()->create())
        ->fromRoute('teams.index')
        ->post(route('teams.store'), ['name' => ''])
        ->assertRedirectToRoute('teams.index')
        ->assertSessionHasErrors('name');
});

it('shows a team to members', function (): void {
    $owner = User::factory()->create(['name' => 'Olivia Owner']);
    $team = teamFor($owner, TeamRole::Owner, ['name' => 'Acme']);
    $member = User::factory()->create(['name' => 'Mike Member']);
    $team->members()->attach($member, ['role' => TeamRole::Member->value]);
    $invitation = $team->invitations()->create([
        'code' => str_repeat('a', 64),
        'email' => 'new@example.com',
        'role' => TeamRole::Admin,
        'invited_by' => $owner->id,
        'expires_at' => now()->addDays(3),
    ]);
    $team->invitations()->create([
        'code' => str_repeat('b', 64),
        'email' => 'old@example.com',
        'role' => TeamRole::Admin,
        'invited_by' => $owner->id,
        'expires_at' => now()->subDay(),
    ]);

    $this->actingAs($owner)
        ->get(route('teams.edit', $team))
        ->assertOk()
        ->assertViewIs('pages.teams.edit')
        ->assertViewHas('team', fn (Team $viewed): bool => $viewed->is($team))
        ->assertViewHas('members', fn (array $members): bool => count($members) === 2
            && $members[0]['id'] === $member->id
            && $members[0]['role'] === 'member'
            && $members[0]['role_label'] === 'Member'
            && $members[1]['id'] === $owner->id
            && $members[1]['role'] === 'owner')
        ->assertViewHas('invitations', fn (array $invitations): bool => count($invitations) === 1
            && $invitations[0]->code === $invitation->code
            && $invitations[0]->email === 'new@example.com'
            && $invitations[0]->role === TeamRole::Admin)
        ->assertViewHas('permissions', [
            'can_update_team' => true,
            'can_delete_team' => true,
            'can_add_member' => true,
            'can_update_member' => true,
            'can_remove_member' => true,
            'can_create_invitation' => true,
            'can_cancel_invitation' => true,
        ])
        ->assertViewHas('availableRoles', [
            ['value' => 'admin', 'label' => 'Admin'],
            ['value' => 'member', 'label' => 'Member'],
        ]);
});

it('hides invitations from members without the invitation permission', function (): void {
    $owner = User::factory()->create();
    $team = teamFor($owner, TeamRole::Owner);
    $member = User::factory()->create();
    $team->members()->attach($member, ['role' => TeamRole::Member->value]);
    $team->invitations()->create([
        'code' => str_repeat('a', 64),
        'email' => 'new@example.com',
        'role' => TeamRole::Admin,
        'invited_by' => $owner->id,
        'expires_at' => now()->addDays(3),
    ]);

    $this->actingAs($member)
        ->get(route('teams.edit', $team))
        ->assertOk()
        ->assertViewHas('invitations', [])
        ->assertViewHas('permissions', [
            'can_update_team' => false,
            'can_delete_team' => false,
            'can_add_member' => false,
            'can_update_member' => false,
            'can_remove_member' => false,
            'can_create_invitation' => false,
            'can_cancel_invitation' => false,
        ]);
});

it('hides a team from non members', function (): void {
    $this->actingAs(User::factory()->create())
        ->get(route('teams.edit', Team::factory()->create()))
        ->assertNotFound();
});

it('lets admins rename a team', function (): void {
    $user = User::factory()->create();
    $team = teamFor($user, TeamRole::Admin, ['name' => 'Acme']);

    $this->actingAs($user)
        ->fromRoute('teams.edit', $team)
        ->patch(route('teams.update', $team), ['name' => 'Globex'])
        ->assertSessionHasNoErrors()
        ->assertSessionHas('toast', ['type' => 'success', 'message' => 'Team updated.']);

    expect($team->fresh()->name)->toBe('Globex');
});

it('redirects to the renamed team', function (): void {
    $user = User::factory()->create();
    $team = teamFor($user, TeamRole::Owner, ['name' => 'Acme']);

    $this->actingAs($user)
        ->fromRoute('teams.edit', $team)
        ->patch(route('teams.update', $team), ['name' => 'Globex'])
        ->assertRedirectToRoute('teams.edit', ['team' => $team->fresh()->slug]);

    expect($team->fresh()->slug)->not->toBe($team->slug);
});

it('requires a team name when renaming', function (): void {
    $user = User::factory()->create();
    $team = teamFor($user, TeamRole::Owner, ['name' => 'Acme']);

    $this->actingAs($user)
        ->fromRoute('teams.edit', $team)
        ->patch(route('teams.update', $team), ['name' => ''])
        ->assertRedirectToRoute('teams.edit', $team)
        ->assertSessionHasErrors('name');

    expect($team->fresh()->name)->toBe('Acme');
});

it('forbids members renaming a team', function (): void {
    $user = User::factory()->create();
    $team = teamFor($user, TeamRole::Member, ['name' => 'Acme']);

    $this->actingAs($user)
        ->patch(route('teams.update', $team), ['name' => 'Globex'])
        ->assertNotFound();

    expect($team->fresh()->name)->toBe('Acme');
});

it('deletes a team when the name matches', function (): void {
    $user = User::factory()->create();
    $team = teamFor($user, TeamRole::Owner, ['name' => 'Acme']);

    $this->actingAs($user)
        ->fromRoute('teams.edit', $team)
        ->delete(route('teams.destroy', $team), ['name' => 'Acme'])
        ->assertRedirectToRoute('teams.index')
        ->assertSessionHas('toast', ['type' => 'success', 'message' => 'Team deleted.']);

    expect(Team::query()->find($team->id))->toBeNull();
});

it('rejects deleting with a different name', function (): void {
    $user = User::factory()->create();
    $team = teamFor($user, TeamRole::Owner, ['name' => 'Acme']);

    $this->actingAs($user)
        ->fromRoute('teams.edit', $team)
        ->delete(route('teams.destroy', $team), ['name' => 'Other'])
        ->assertRedirectToRoute('teams.edit', $team)
        ->assertSessionHasErrors(['name' => 'The team name does not match.']);

    expect(Team::query()->find($team->id))->not->toBeNull();
});

it('forbids deleting a personal team', function (): void {
    $user = User::factory()->create();
    $personal = $user->personalTeam();

    $this->actingAs($user)
        ->delete(route('teams.destroy', $personal), ['name' => $personal->name])
        ->assertNotFound();
});

it('switches teams', function (): void {
    $user = User::factory()->create();
    $team = teamFor($user, TeamRole::Member);

    $this->actingAs($user)
        ->fromRoute('teams.index')
        ->post(route('teams.switch', $team))
        ->assertRedirectToRoute('team.dashboard', ['current_team' => $team->slug]);

    expect($user->fresh()->current_team_id)->toBe($team->id);
});

it('forbids switching to a team the user does not belong to', function (): void {
    $user = User::factory()->create();
    $team = Team::factory()->create();

    $this->actingAs($user)
        ->post(route('teams.switch', $team))
        ->assertNotFound();

    expect($user->fresh()->current_team_id)->not->toBe($team->id);
});

it('lets members leave a team', function (): void {
    $user = User::factory()->create();
    $team = teamFor($user, TeamRole::Member, ['name' => 'Acme']);

    $this->actingAs($user)
        ->fromRoute('teams.edit', $team)
        ->delete(route('teams.leave', $team))
        ->assertRedirectToRoute('teams.index')
        ->assertSessionHas('toast', ['type' => 'success', 'message' => 'You left the team "Acme"']);

    expect($user->belongsToTeam($team))->toBeFalse();
});

it('forbids owners leaving their team', function (): void {
    $user = User::factory()->create();
    $team = teamFor($user, TeamRole::Owner);

    $this->actingAs($user)
        ->delete(route('teams.leave', $team))
        ->assertNotFound();

    expect($user->belongsToTeam($team))->toBeTrue();
});

it('redirects guests to login', function (): void {
    $this->get(route('teams.index'))->assertRedirectToRoute('login');
});
