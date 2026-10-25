<?php

declare(strict_types=1);

namespace App\Data;

use App\Models\Team;
use App\Models\User;
use Spatie\LaravelData\Data;

final class TeamData extends Data
{
    public function __construct(
        public readonly string $id,
        public readonly string $name,
        public readonly string $slug,
        public readonly bool $is_personal,
        public readonly ?string $role,
        public readonly ?string $role_label,
        public readonly bool $is_current,
    ) {}

    public static function fromTeam(Team $team, User $viewer): self
    {
        $role = $viewer->teamRole($team);

        return new self(
            id: $team->id,
            name: $team->name,
            slug: $team->slug,
            is_personal: $team->is_personal,
            role: $role?->value,
            role_label: $role?->label(),
            is_current: $viewer->isCurrentTeam($team),
        );
    }
}
