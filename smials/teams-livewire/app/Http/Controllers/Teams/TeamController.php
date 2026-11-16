<?php

declare(strict_types=1);

namespace App\Http\Controllers\Teams;

use App\Actions\CreateTeam;
use App\Actions\DeleteTeam;
use App\Actions\UpdateTeam;
use App\Enums\TeamRole;
use App\Http\Requests\DeleteTeamRequest;
use App\Http\Requests\SaveTeamRequest;
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
                    $role = $user->teamRole($team);

                    return [
                        'id' => $team->id,
                        'name' => $team->name,
                        'slug' => $team->slug,
                        'is_personal' => $team->is_personal,
                        'role' => $role?->value,
                        'role_label' => $role?->label(),
                        'is_current' => $user->isCurrentTeam($team),
                        'can_leave' => $user->can('leave', $team),
                        'can_update' => $user->can('update', $team),
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
        $team = $user->teamWithMembership($team);

        $permissions = [
            'can_update_team' => $user->can('update', $team),
            'can_delete_team' => $user->can('delete', $team),
            'can_add_member' => $user->can('addMember', $team),
            'can_update_member' => $user->can('updateMember', $team),
            'can_remove_member' => $user->can('removeMember', $team),
            'can_create_invitation' => $user->can('inviteMember', $team),
            'can_cancel_invitation' => $user->can('cancelInvitation', $team),
        ];

        $invitations = $team->invitations()->oldest();
        $invitations->scopes('pending');

        return view('pages.teams.edit', [
            'team' => $team,
            'members' => $team->members()->orderBy('name')->get()
                ->map(function (User $member) use ($team, $user, $permissions): array {
                    $role = $member->teamRole($team) ?? TeamRole::Member;
                    $canManage = $user->can('manageMember', [$team, $member]);

                    return [
                        'id' => $member->id,
                        'name' => $member->name,
                        'email' => $member->email,
                        'role' => $role->value,
                        'role_label' => $role->label(),
                        'can_update' => $canManage && $permissions['can_update_member'],
                        'can_remove' => $canManage && $permissions['can_remove_member'],
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
