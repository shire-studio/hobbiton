<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Team;
use App\Models\TeamInvitation;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Contracts\View\View;

final readonly class DashboardController
{
    public function __invoke(Team $current_team, #[CurrentUser] User $user): View
    {
        $invitations = TeamInvitation::query();
        $invitations->scopes(['pendingFor' => [$user]]);

        return view('pages.dashboard', [
            'pendingInvitations' => $invitations->get(),
        ]);
    }
}
