<?php

declare(strict_types=1);

namespace App\Http\Controllers\Teams;

use App\Actions\CreateTeam;
use App\Actions\DeleteTeam;
use App\Actions\UpdateTeam;
use App\Http\Requests\DeleteTeamRequest;
use App\Http\Requests\SaveTeamRequest;
use App\Http\Resources\TeamResource;
use App\Models\Team;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

final readonly class TeamController
{
    public function index(#[CurrentUser] User $user): AnonymousResourceCollection
    {
        return TeamResource::collection(
            $user->teams()->orderByRaw('LOWER(teams.name)')->get()
        );
    }

    public function store(SaveTeamRequest $request, #[CurrentUser] User $user, CreateTeam $createTeam): JsonResponse
    {
        /** @var array{name: string} $attributes */
        $attributes = $request->validated();

        return new TeamResource($createTeam->handle($user, $attributes))
            ->response()
            ->setStatusCode(JsonResponse::HTTP_CREATED);
    }

    public function show(Team $team): TeamResource
    {
        $team->setRelation('members', $team->members()->orderBy('name')->get());

        $invitations = $team->invitations()->with(['team', 'inviter'])->oldest();

        $invitations->scopes('pending');

        $team->setRelation('invitations', Gate::allows('cancelInvitation', $team) ? $invitations->get() : new Collection);

        return new TeamResource($team)->withPermissions([
            'can_update_team' => Gate::allows('update', $team),
            'can_delete_team' => Gate::allows('delete', $team),
            'can_add_member' => Gate::allows('addMember', $team),
            'can_update_member' => Gate::allows('updateMember', $team),
            'can_remove_member' => Gate::allows('removeMember', $team),
            'can_create_invitation' => Gate::allows('inviteMember', $team),
            'can_cancel_invitation' => Gate::allows('cancelInvitation', $team),
        ]);
    }

    public function update(Team $team, SaveTeamRequest $request, UpdateTeam $updateTeam): TeamResource
    {
        /** @var array{name: string} $attributes */
        $attributes = $request->validated();

        return new TeamResource($updateTeam->handle($team, $attributes));
    }

    public function destroy(Team $team, DeleteTeamRequest $request, #[CurrentUser] User $user, DeleteTeam $deleteTeam): Response
    {
        $deleteTeam->handle($team, $user);

        return response()->noContent();
    }
}
