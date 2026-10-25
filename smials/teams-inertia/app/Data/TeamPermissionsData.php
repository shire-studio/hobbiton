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
        return new self(
            can_update_team: $viewer->hasTeamPermission($team, TeamPermission::UpdateTeam),
            can_delete_team: $viewer->can('delete', $team),
            can_add_member: $viewer->hasTeamPermission($team, TeamPermission::AddMember),
            can_update_member: $viewer->hasTeamPermission($team, TeamPermission::UpdateMember),
            can_remove_member: $viewer->hasTeamPermission($team, TeamPermission::RemoveMember),
            can_create_invitation: $viewer->hasTeamPermission($team, TeamPermission::CreateInvitation),
            can_cancel_invitation: $viewer->hasTeamPermission($team, TeamPermission::CancelInvitation),
        );
    }
}
