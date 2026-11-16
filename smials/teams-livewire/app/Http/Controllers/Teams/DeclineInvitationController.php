<?php

declare(strict_types=1);

namespace App\Http\Controllers\Teams;

use App\Actions\DeclineTeamInvitation;
use App\Http\Requests\DeclineTeamInvitationRequest;
use App\Models\TeamInvitation;
use Illuminate\Http\RedirectResponse;

final readonly class DeclineInvitationController
{
    public function __invoke(TeamInvitation $invitation, DeclineTeamInvitationRequest $request, DeclineTeamInvitation $declineTeamInvitation): RedirectResponse
    {
        $declineTeamInvitation->handle($invitation);

        return to_route('dashboard')->with('toast', ['type' => 'success', 'message' => __('Invitation declined.')]);
    }
}
