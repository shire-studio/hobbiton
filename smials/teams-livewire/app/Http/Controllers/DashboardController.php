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
        $pending = TeamInvitation::query();
        $pending->scopes(['pending', 'joinable']);

        $invitations = $pending
            ->whereRaw('LOWER(email) = ?', [mb_strtolower($user->email)])
            ->with(['team', 'inviter'])
            ->latest()
            ->get();

        return view('pages.dashboard', [
            'pendingInvitations' => $invitations,
        ]);
    }
}
