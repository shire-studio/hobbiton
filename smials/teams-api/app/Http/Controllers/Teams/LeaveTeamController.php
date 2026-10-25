<?php

declare(strict_types=1);

namespace App\Http\Controllers\Teams;

use App\Actions\LeaveTeam;
use App\Models\Team;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\Response;

final readonly class LeaveTeamController
{
    public function __invoke(Team $team, #[CurrentUser] User $user, LeaveTeam $leaveTeam): Response
    {
        $leaveTeam->handle($team, $user);

        return response()->noContent();
    }
}
