<?php

declare(strict_types=1);

namespace App\Http\Controllers\Teams;

use App\Actions\DeclineTeamInvitation;
use App\Http\Requests\DeclineTeamInvitationRequest;
use App\Models\TeamInvitation;
use Illuminate\Http\Response;

final readonly class DeclineInvitationController
{
    public function __invoke(TeamInvitation $invitation, DeclineTeamInvitationRequest $request, DeclineTeamInvitation $declineTeamInvitation): Response
    {
        $declineTeamInvitation->handle($invitation);

        return response()->noContent();
    }
}
