<?php

declare(strict_types=1);

use App\Enums\TeamPermission;
use App\Enums\TeamRole;
use App\Models\Team;
use App\Models\User;

it('creates a personal team for factory users', function (): void {
    $user = User::factory()->create(['name' => 'Frodo']);

    $team = $user->personalTeam();

    expect($team?->name)->toBe("Frodo's Team")
        ->and($team?->is_personal)->toBeTrue()
        ->and($user->refresh()->current_team_id)->toBe($team?->id)
        ->and($user->currentTeam->is($team))->toBeTrue()
        ->and($user->ownsTeam($team))->toBeTrue()
        ->and($user->ownedTeams()->count())->toBe(1);
});

it('skips the personal team when asked', function (): void {
    $user = User::factory()->withoutPersonalTeam()->create();

    expect($user->personalTeam())->toBeNull()
        ->and($user->current_team_id)->toBeNull()
        ->and($user->currentTeamOrPersonal())->toBeNull();
});

it('keeps skipping the personal team through further states', function (): void {
    $user = User::factory()->withoutPersonalTeam()->unverified()->create();

    expect($user->teams()->count())->toBe(0);
});

it('knows team membership and roles', function (): void {
    $user = User::factory()->create();
    $team = Team::factory()->create();
    $other = Team::factory()->create();
    $team->members()->attach($user, ['role' => TeamRole::Admin->value]);

    expect($user->belongsToTeam($team))->toBeTrue()
        ->and($user->belongsToTeam($other))->toBeFalse()
        ->and($user->teamRole($team))->toBe(TeamRole::Admin)
        ->and($user->teamRole($other))->toBeNull()
        ->and($user->ownsTeam($team))->toBeFalse()
        ->and($user->isCurrentTeam($team))->toBeFalse()
        ->and($user->isCurrentTeam($user->personalTeam()))->toBeTrue()
        ->and($user->teamMemberships()->count())->toBe(2);
});

it('checks permissions through the role', function (): void {
    $user = User::factory()->create();
    $team = Team::factory()->create();
    $team->members()->attach($user, ['role' => TeamRole::Admin->value]);

    expect($user->hasTeamPermission($team, TeamPermission::UpdateTeam))->toBeTrue()
        ->and($user->hasTeamPermission($team, TeamPermission::DeleteTeam))->toBeFalse()
        ->and($user->hasTeamPermission(Team::factory()->create(), TeamPermission::UpdateTeam))->toBeFalse();
});

it('picks a fallback team alphabetically', function (): void {
    $user = User::factory()->withoutPersonalTeam()->create();
    $teams = collect(['b', 'A', 'c'])->map(fn (string $name) => Team::factory()->create(['name' => $name]));
    $teams->each(fn (Team $team) => $team->members()->attach($user, ['role' => TeamRole::Member->value]));

    expect($user->fallbackTeam()?->name)->toBe('A')
        ->and($user->fallbackTeam($teams[1])?->name)->toBe('b');
});

it('falls back to the personal team when no current team is set', function (): void {
    $user = User::factory()->create();
    $personal = $user->personalTeam();
    $user->forceFill(['current_team_id' => null])->save();
    $user->unsetRelation('currentTeam');

    expect($user->currentTeamOrPersonal()?->is($personal))->toBeTrue();

    $other = Team::factory()->create();
    $other->members()->attach($user, ['role' => TeamRole::Member->value]);
    $user->forceFill(['current_team_id' => $other->id])->save();
    $user->unsetRelation('currentTeam');

    expect($user->currentTeamOrPersonal()?->is($other))->toBeTrue();
});
