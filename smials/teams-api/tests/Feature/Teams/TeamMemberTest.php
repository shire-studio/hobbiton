<?php

declare(strict_types=1);

use App\Enums\TeamRole;
use App\Models\Team;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

function memberSetup(TeamRole $actorRole = TeamRole::Owner): array
{
    $team = Team::factory()->create();
    $actor = User::factory()->create();
    $team->members()->attach($actor, ['role' => $actorRole->value]);
    $member = User::factory()->create(['name' => 'Mike Member']);
    $team->members()->attach($member, ['role' => TeamRole::Member->value]);

    Sanctum::actingAs($actor);

    return [$team, $actor, $member];
}

it("lets owners change a member's role", function (): void {
    [$team, , $member] = memberSetup();

    $this->patchJson(route('teams.members.update', [$team, $member]), ['role' => 'admin'])
        ->assertOk()
        ->assertExactJson(['data' => [
            'id' => $member->id,
            'name' => 'Mike Member',
            'email' => $member->email,
            'role' => 'admin',
        ]]);

    expect($member->teamRole($team))->toBe(TeamRole::Admin);
});

it('forbids admins changing roles', function (): void {
    [$team, , $member] = memberSetup(TeamRole::Admin);

    $this->patchJson(route('teams.members.update', [$team, $member]), ['role' => 'admin'])->assertNotFound();

    expect($member->teamRole($team))->toBe(TeamRole::Member);
});

it('rejects assigning the owner role', function (): void {
    [$team, , $member] = memberSetup();

    $this->patchJson(route('teams.members.update', [$team, $member]), ['role' => 'owner'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('role');
});

it("forbids changing the owner's role", function (): void {
    [$team, $owner] = memberSetup();

    $this->patchJson(route('teams.members.update', [$team, $owner]), ['role' => 'member'])->assertNotFound();

    expect($owner->teamRole($team))->toBe(TeamRole::Owner);
});

it('returns 404 when updating a user who is not a member', function (): void {
    [$team] = memberSetup();

    $this->patchJson(route('teams.members.update', [$team, User::factory()->create()]), ['role' => 'admin'])
        ->assertNotFound();
});

it('lets owners remove a member', function (): void {
    [$team, , $member] = memberSetup();

    $this->deleteJson(route('teams.members.destroy', [$team, $member]))->assertNoContent();

    expect($member->belongsToTeam($team))->toBeFalse();
});

it('forbids removing the owner', function (): void {
    [$team, $owner] = memberSetup();

    $this->deleteJson(route('teams.members.destroy', [$team, $owner]))->assertNotFound();

    expect($owner->belongsToTeam($team))->toBeTrue();
});

it('forbids admins removing a member', function (): void {
    [$team, , $member] = memberSetup(TeamRole::Admin);

    $this->deleteJson(route('teams.members.destroy', [$team, $member]))->assertNotFound();

    expect($member->belongsToTeam($team))->toBeTrue();
});
