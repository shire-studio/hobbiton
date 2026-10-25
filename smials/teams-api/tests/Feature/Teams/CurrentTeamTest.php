<?php

declare(strict_types=1);

use App\Enums\TeamRole;
use App\Models\Team;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

it('switches the current team', function (): void {
    $user = User::factory()->create();
    $team = Team::factory()->create();
    $team->members()->attach($user, ['role' => TeamRole::Member->value]);

    Sanctum::actingAs($user);

    $this->putJson(route('user.current-team.update'), ['team_id' => $team->id])
        ->assertOk()
        ->assertJsonPath('data.id', $team->id)
        ->assertJsonPath('data.is_current', true);

    expect($user->fresh()->current_team_id)->toBe($team->id);
});

it('rejects a team the user does not belong to', function (): void {
    $user = User::factory()->create();
    $current = $user->current_team_id;

    Sanctum::actingAs($user);

    $this->putJson(route('user.current-team.update'), ['team_id' => Team::factory()->create()->id])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('team_id');

    expect($user->fresh()->current_team_id)->toBe($current);
});

it('requires a team id', function (): void {
    Sanctum::actingAs(User::factory()->create());

    $this->putJson(route('user.current-team.update'), [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('team_id');
});

it('falls back to the personal team when no current team is set', function (): void {
    $user = User::factory()->create();
    $personal = $user->personalTeam();
    $user->forceFill(['current_team_id' => null])->save();

    Sanctum::actingAs($user);

    $this->getJson(route('user.show'))
        ->assertOk()
        ->assertJsonPath('data.current_team.id', $personal->id)
        ->assertJsonPath('data.current_team.is_current', true);
});

it('returns a null current team when the user has no teams', function (): void {
    $user = User::factory()->withoutPersonalTeam()->create();

    Sanctum::actingAs($user);

    $this->getJson(route('user.show'))
        ->assertOk()
        ->assertJsonPath('data.current_team', null);
});
