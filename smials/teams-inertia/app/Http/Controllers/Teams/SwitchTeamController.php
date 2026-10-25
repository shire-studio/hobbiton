<?php

declare(strict_types=1);

namespace App\Http\Controllers\Teams;

use App\Actions\SwitchTeam;
use App\Models\Team;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\RedirectResponse;

final readonly class SwitchTeamController
{
    public function __invoke(Team $team, #[CurrentUser] User $user, SwitchTeam $switchTeam): RedirectResponse
    {
        $switchTeam->handle($user, $team);

        return to_route('team.dashboard', ['current_team' => $team->slug]);
    }
}
