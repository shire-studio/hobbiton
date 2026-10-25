<?php

declare(strict_types=1);

namespace App\Http\Controllers\Teams;

use App\Actions\AcceptTeamInvitation;
use App\Http\Requests\RespondToTeamInvitationRequest;
use App\Models\TeamInvitation;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\RedirectResponse;

final readonly class AcceptInvitationController
{
    public function __invoke(TeamInvitation $invitation, RespondToTeamInvitationRequest $request, #[CurrentUser] User $user, AcceptTeamInvitation $acceptTeamInvitation): RedirectResponse
    {
        $acceptTeamInvitation->handle($invitation, $user);

        return to_route('dashboard')->with('toast', ['type' => 'success', 'message' => __('Invitation accepted.')]);
    }
}
