<?php

declare(strict_types=1);

use App\Enums\TeamRole;
use App\Models\Team;
use App\Models\User;

it('switches teams', function (): void {
    $user = User::factory()->create();
    $team = Team::factory()->create();
    $team->members()->attach($user, ['role' => TeamRole::Member->value]);

    $this->actingAs($user)
        ->post(route('teams.switch', ['team' => $team->slug]))
        ->assertRedirectToRoute('team.dashboard', ['current_team' => $team->slug]);

    expect($user->fresh()->current_team_id)->toBe($team->id);
});

it('forbids switching to a team the user does not belong to', function (): void {
    $user = User::factory()->create();
    $team = Team::factory()->create();

    $this->actingAs($user)
        ->post(route('teams.switch', ['team' => $team->slug]))
        ->assertNotFound();

    expect($user->fresh()->current_team_id)->not->toBe($team->id);
});
