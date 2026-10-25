<?php

declare(strict_types=1);

namespace App\Http\Controllers\Teams;

use App\Actions\CancelTeamInvitation;
use App\Actions\CreateTeamInvitation;
use App\Http\Requests\CreateTeamInvitationRequest;
use App\Http\Resources\TeamInvitationResource;
use App\Models\Team;
use App\Models\TeamInvitation;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

final readonly class TeamInvitationController
{
    public function store(Team $team, CreateTeamInvitationRequest $request, #[CurrentUser] User $user, CreateTeamInvitation $createTeamInvitation): JsonResponse
    {
        Gate::authorize('inviteMember', $team);

        /** @var array{email: string, role: string} $attributes */
        $attributes = $request->validated();

        $invitation = $createTeamInvitation->handle($team, $user, $attributes);

        return new TeamInvitationResource($invitation->load(['team', 'inviter']))
            ->response()
            ->setStatusCode(JsonResponse::HTTP_CREATED);
    }

    public function destroy(Team $team, TeamInvitation $invitation, CancelTeamInvitation $cancelTeamInvitation): Response
    {
        Gate::authorize('cancelInvitation', $team);

        $cancelTeamInvitation->handle($invitation);

        return response()->noContent();
    }
}
