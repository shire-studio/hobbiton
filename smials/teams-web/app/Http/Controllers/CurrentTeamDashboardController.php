<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Team;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\RedirectResponse;

final readonly class CurrentTeamDashboardController
{
    public function __invoke(#[CurrentUser] User $user): RedirectResponse
    {
        $team = $user->currentTeamOrPersonal();

        abort_if(! $team instanceof Team, 404);

        return to_route('team.dashboard', ['current_team' => $team->slug]);
    }
}
