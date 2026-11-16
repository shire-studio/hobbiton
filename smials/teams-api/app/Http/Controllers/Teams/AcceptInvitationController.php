<?php

declare(strict_types=1);

namespace App\Http\Controllers\Teams;

use App\Actions\AcceptTeamInvitation;
use App\Http\Requests\AcceptTeamInvitationRequest;
use App\Http\Resources\TeamResource;
use App\Models\TeamInvitation;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;

final readonly class AcceptInvitationController
{
    public function __invoke(TeamInvitation $invitation, AcceptTeamInvitationRequest $request, #[CurrentUser] User $user, AcceptTeamInvitation $acceptTeamInvitation): TeamResource
    {
        return new TeamResource($acceptTeamInvitation->handle($invitation, $user));
    }
}
