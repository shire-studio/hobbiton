<?php

declare(strict_types=1);

use App\Actions\SwitchTeam;
use App\Models\Team;
use App\Models\User;

it('switches the current team', function (): void {
    $user = User::factory()->create();
    $team = Team::factory()->create();

    resolve(SwitchTeam::class)->handle($user, $team);

    expect($user->fresh()?->current_team_id)->toBe($team->id);
});
