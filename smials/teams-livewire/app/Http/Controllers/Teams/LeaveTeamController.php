<?php

declare(strict_types=1);

namespace App\Http\Controllers\Teams;

use App\Actions\LeaveTeam;
use App\Models\Team;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\RedirectResponse;

final readonly class LeaveTeamController
{
    public function __invoke(Team $team, #[CurrentUser] User $user, LeaveTeam $leaveTeam): RedirectResponse
    {
        $leaveTeam->handle($team, $user);

        return to_route('teams.index')->with('toast', ['type' => 'success', 'message' => __('You left the team ":name"', ['name' => $team->name])]);
    }
}
