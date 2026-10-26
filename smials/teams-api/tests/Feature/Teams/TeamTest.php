<?php

declare(strict_types=1);

use App\Enums\TeamRole;
use App\Models\Team;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

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

    Sanctum::actingAs($user);

    $this->getJson(route('teams.index'))
        ->assertOk()
        ->assertExactJson(['data' => [
            [
                'id' => $team->id,
                'name' => 'Acme',
                'slug' => $team->slug,
                'is_personal' => false,
                'role' => 'member',
                'is_current' => false,
            ],
            [
                'id' => $personal->id,
                'name' => "Test User's Team",
                'slug' => $personal->slug,
                'is_personal' => true,
                'role' => 'owner',
                'is_current' => true,
            ],
        ]]);
});

it('creates a team', function (): void {
    $user = User::factory()->create();

    Sanctum::actingAs($user);

    $response = $this->postJson(route('teams.store'), ['name' => 'Acme'])
        ->assertCreated()
        ->assertJsonPath('data.name', 'Acme')
        ->assertJsonPath('data.is_personal', false)
        ->assertJsonPath('data.role', 'owner')
        ->assertJsonPath('data.is_current', true);

    $team = Team::query()->findOrFail($response->json('data.id'));

    expect($user->fresh()->current_team_id)->toBe($team->id)
        ->and($user->ownsTeam($team))->toBeTrue();
});

it('rejects a reserved team name', function (): void {
    Sanctum::actingAs(User::factory()->create());

    $this->postJson(route('teams.store'), ['name' => 'teams'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('name');
});

it('requires a team name', function (): void {
    Sanctum::actingAs(User::factory()->create());

    $this->postJson(route('teams.store'), ['name' => ''])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('name');
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

    Sanctum::actingAs($owner);

    $this->getJson(route('teams.show', $team))
        ->assertOk()
        ->assertExactJson(['data' => [
            'id' => $team->id,
            'name' => 'Acme',
            'slug' => $team->slug,
            'is_personal' => false,
            'role' => 'owner',
            'is_current' => false,
            'members' => [
                ['id' => $member->id, 'name' => 'Mike Member', 'email' => $member->email, 'role' => 'member'],
                ['id' => $owner->id, 'name' => 'Olivia Owner', 'email' => $owner->email, 'role' => 'owner'],
            ],
            'invitations' => [[
                'code' => $invitation->code,
                'email' => 'new@example.com',
                'role' => 'admin',
                'team' => [
                    'id' => $team->id,
                    'name' => 'Acme',
                    'slug' => $team->slug,
                    'is_personal' => false,
                ],
                'inviter_name' => 'Olivia Owner',
                'expires_at' => $invitation->expires_at->toIso8601String(),
                'created_at' => $invitation->created_at->toIso8601String(),
            ]],
            'permissions' => [
                'can_update_team' => true,
                'can_delete_team' => true,
                'can_add_member' => true,
                'can_update_member' => true,
                'can_remove_member' => true,
                'can_create_invitation' => true,
                'can_cancel_invitation' => true,
            ],
        ]]);
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

    Sanctum::actingAs($member);

    $this->getJson(route('teams.show', $team))
        ->assertOk()
        ->assertJsonPath('data.invitations', [])
        ->assertJsonPath('data.permissions', [
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
    Sanctum::actingAs(User::factory()->create());

    $this->getJson(route('teams.show', Team::factory()->create()))->assertNotFound();
});

it('lets admins rename a team', function (): void {
    $user = User::factory()->create();
    $team = teamFor($user, TeamRole::Admin, ['name' => 'Acme']);

    Sanctum::actingAs($user);

    $this->patchJson(route('teams.update', $team), ['name' => 'Globex'])
        ->assertOk()
        ->assertJsonPath('data.name', 'Globex')
        ->assertJsonPath('data.role', 'admin');

    expect($team->fresh()->name)->toBe('Globex');
});

it('forbids members renaming a team', function (): void {
    $user = User::factory()->create();
    $team = teamFor($user, TeamRole::Member, ['name' => 'Acme']);

    Sanctum::actingAs($user);

    $this->patchJson(route('teams.update', $team), ['name' => 'Globex'])->assertNotFound();

    expect($team->fresh()->name)->toBe('Acme');
});

it('deletes a team when the name matches', function (): void {
    $user = User::factory()->create();
    $team = teamFor($user, TeamRole::Owner, ['name' => 'Acme']);

    Sanctum::actingAs($user);

    $this->deleteJson(route('teams.destroy', $team), ['name' => 'Acme'])->assertNoContent();

    expect(Team::query()->find($team->id))->toBeNull();
});

it('rejects deleting with a different name', function (): void {
    $user = User::factory()->create();
    $team = teamFor($user, TeamRole::Owner, ['name' => 'Acme']);

    Sanctum::actingAs($user);

    $this->deleteJson(route('teams.destroy', $team), ['name' => 'Other'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name' => 'The team name does not match.']);

    expect(Team::query()->find($team->id))->not->toBeNull();
});

it('forbids deleting a personal team', function (): void {
    $user = User::factory()->create();
    $personal = $user->personalTeam();

    Sanctum::actingAs($user);

    $this->deleteJson(route('teams.destroy', $personal), ['name' => $personal->name])->assertNotFound();
});

it('lets members leave a team', function (): void {
    $user = User::factory()->create();
    $team = teamFor($user, TeamRole::Member);

    Sanctum::actingAs($user);

    $this->deleteJson(route('teams.leave', $team))->assertNoContent();

    expect($user->belongsToTeam($team))->toBeFalse();
});

it('forbids owners leaving their team', function (): void {
    $user = User::factory()->create();
    $team = teamFor($user, TeamRole::Owner);

    Sanctum::actingAs($user);

    $this->deleteJson(route('teams.leave', $team))->assertNotFound();

    expect($user->belongsToTeam($team))->toBeTrue();
});

it('requires authentication to list teams', function (): void {
    $this->getJson(route('teams.index'))->assertUnauthorized();
});

it('does not offer adding or inviting on a personal team', function (): void {
    $user = User::factory()->create();
    $team = $user->personalTeam();
    $team->invitations()->create([
        'code' => str_repeat('b', 64),
        'email' => 'old@example.com',
        'role' => TeamRole::Member,
        'invited_by' => $user->id,
        'expires_at' => now()->addDays(3),
    ]);

    Sanctum::actingAs($user);

    $this->getJson(route('teams.show', $team))
        ->assertOk()
        ->assertJsonCount(1, 'data.invitations')
        ->assertJsonPath('data.permissions.can_add_member', false)
        ->assertJsonPath('data.permissions.can_create_invitation', false)
        ->assertJsonPath('data.permissions.can_cancel_invitation', true);
});
