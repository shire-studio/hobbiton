<?php

declare(strict_types=1);

namespace App\Http\Controllers\Teams;

use App\Actions\DeclineTeamInvitation;
use App\Http\Requests\RespondToTeamInvitationRequest;
use App\Models\TeamInvitation;
use Illuminate\Http\Response;

final readonly class DeclineInvitationController
{
    public function __invoke(TeamInvitation $invitation, RespondToTeamInvitationRequest $request, DeclineTeamInvitation $declineTeamInvitation): Response
    {
        $declineTeamInvitation->handle($invitation);

        return response()->noContent();
    }
}
