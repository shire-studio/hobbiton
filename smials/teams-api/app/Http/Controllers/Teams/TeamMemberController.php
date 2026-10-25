<?php

declare(strict_types=1);

namespace App\Http\Controllers\Teams;

use App\Actions\RemoveTeamMember;
use App\Actions\UpdateTeamMember;
use App\Enums\TeamRole;
use App\Http\Requests\UpdateTeamMemberRequest;
use App\Http\Resources\TeamMemberResource;
use App\Models\Team;
use App\Models\User;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

final readonly class TeamMemberController
{
    public function update(Team $team, User $user, UpdateTeamMemberRequest $request, UpdateTeamMember $updateTeamMember): TeamMemberResource
    {
        Gate::authorize('updateMember', $team);

        $this->ensureManageable($team, $user);

        /** @var array{role: string} $attributes */
        $attributes = $request->validated();

        $updateTeamMember->handle($team, $user, $attributes);

        return new TeamMemberResource($team->members()->findOrFail($user->id));
    }

    public function destroy(Team $team, User $user, RemoveTeamMember $removeTeamMember): Response
    {
        Gate::authorize('removeMember', $team);

        $this->ensureManageable($team, $user);

        $removeTeamMember->handle($team, $user);

        return response()->noContent();
    }

    private function ensureManageable(Team $team, User $member): void
    {
        $role = $member->teamRole($team);

        abort_if(! $role instanceof TeamRole || $role === TeamRole::Owner, 404);
    }
}
