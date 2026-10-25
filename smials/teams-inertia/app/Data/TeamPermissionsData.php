<?php

declare(strict_types=1);

namespace App\Data;

use App\Enums\TeamPermission;
use App\Models\Team;
use App\Models\User;
use Spatie\LaravelData\Data;

final class TeamPermissionsData extends Data
{
    public function __construct(
        public readonly bool $can_update_team,
        public readonly bool $can_delete_team,
        public readonly bool $can_add_member,
        public readonly bool $can_update_member,
        public readonly bool $can_remove_member,
        public readonly bool $can_create_invitation,
        public readonly bool $can_cancel_invitation,
    ) {}

    public static function fromTeam(Team $team, User $viewer): self
    {
        $role = $viewer->teamRole($team);
        $can = fn (TeamPermission $permission): bool => $role?->hasPermission($permission) ?? false;

        return new self(
            can_update_team: $can(TeamPermission::UpdateTeam),
            can_delete_team: ! $team->is_personal && $can(TeamPermission::DeleteTeam),
            can_add_member: $can(TeamPermission::AddMember),
            can_update_member: $can(TeamPermission::UpdateMember),
            can_remove_member: $can(TeamPermission::RemoveMember),
            can_create_invitation: $can(TeamPermission::CreateInvitation),
            can_cancel_invitation: $can(TeamPermission::CancelInvitation),
        );
    }
}
