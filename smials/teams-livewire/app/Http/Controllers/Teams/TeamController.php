<?php

declare(strict_types=1);

namespace App\Http\Controllers\Teams;

use App\Actions\CreateTeam;
use App\Actions\DeleteTeam;
use App\Actions\UpdateTeam;
use App\Enums\TeamPermission;
use App\Enums\TeamRole;
use App\Http\Requests\DeleteTeamRequest;
use App\Http\Requests\SaveTeamRequest;
use App\Models\Membership;
use App\Models\Team;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;

final readonly class TeamController
{
    public function index(#[CurrentUser] User $user): View
    {
        return view('pages.teams.index', [
            'teams' => $user->teams()->orderByRaw('LOWER(teams.name)')->get()
                ->map(function (Team $team) use ($user): array {
                    $role = ($pivot = $team->getRelation('pivot')) instanceof Membership ? $pivot->role : null;

                    return [
                        'id' => $team->id,
                        'name' => $team->name,
                        'slug' => $team->slug,
                        'is_personal' => $team->is_personal,
                        'role' => $role?->value,
                        'role_label' => $role?->label(),
                        'is_current' => $user->isCurrentTeam($team),
                    ];
                })
                ->all(),
        ]);
    }

    public function store(SaveTeamRequest $request, #[CurrentUser] User $user, CreateTeam $createTeam): RedirectResponse
    {
        /** @var array{name: string} $attributes */
        $attributes = $request->validated();

        $team = $createTeam->handle($user, $attributes);

        return to_route('teams.edit', ['team' => $team->slug])
            ->with('toast', ['type' => 'success', 'message' => __('Team created.')]);
    }

    public function edit(Team $team, #[CurrentUser] User $user): View
    {
        $role = $user->teamRole($team);
        $can = fn (TeamPermission $permission): bool => $role?->hasPermission($permission) ?? false;

        $permissions = [
            'can_update_team' => $can(TeamPermission::UpdateTeam),
            'can_delete_team' => ! $team->is_personal && $can(TeamPermission::DeleteTeam),
            'can_add_member' => ! $team->is_personal && $can(TeamPermission::AddMember),
            'can_update_member' => $can(TeamPermission::UpdateMember),
            'can_remove_member' => $can(TeamPermission::RemoveMember),
            'can_create_invitation' => ! $team->is_personal && $can(TeamPermission::CreateInvitation),
            'can_cancel_invitation' => $can(TeamPermission::CancelInvitation),
        ];

        $invitations = $team->invitations()->oldest();
        $invitations->scopes('pending');

        return view('pages.teams.edit', [
            'team' => $team,
            'members' => $team->members()->orderBy('name')->get()
                ->map(function (User $member): array {
                    $role = ($pivot = $member->getRelation('pivot')) instanceof Membership ? $pivot->role : TeamRole::Member;

                    return [
                        'id' => $member->id,
                        'name' => $member->name,
                        'email' => $member->email,
                        'role' => $role->value,
                        'role_label' => $role->label(),
                    ];
                })
                ->all(),
            'invitations' => $permissions['can_cancel_invitation']
                ? $invitations->get()->all()
                : [],
            'permissions' => $permissions,
            'availableRoles' => TeamRole::assignable(),
        ]);
    }

    public function update(Team $team, SaveTeamRequest $request, UpdateTeam $updateTeam): RedirectResponse
    {
        /** @var array{name: string} $attributes */
        $attributes = $request->validated();

        $team = $updateTeam->handle($team, $attributes);

        return to_route('teams.edit', ['team' => $team->slug])
            ->with('toast', ['type' => 'success', 'message' => __('Team updated.')]);
    }

    public function destroy(Team $team, DeleteTeamRequest $request, #[CurrentUser] User $user, DeleteTeam $deleteTeam): RedirectResponse
    {
        $deleteTeam->handle($team, $user);

        return to_route('teams.index')
            ->with('toast', ['type' => 'success', 'message' => __('Team deleted.')]);
    }
}
