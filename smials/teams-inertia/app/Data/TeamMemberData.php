<?php

declare(strict_types=1);

namespace App\Data;

use App\Enums\TeamRole;
use App\Models\User;
use Spatie\LaravelData\Data;

final class TeamMemberData extends Data
{
    public function __construct(
        public readonly string $id,
        public readonly string $name,
        public readonly string $email,
        public readonly string $role,
        public readonly string $role_label,
    ) {}

    public static function fromMember(User $member, TeamRole $role): self
    {
        return new self(
            id: $member->id,
            name: $member->name,
            email: $member->email,
            role: $role->value,
            role_label: $role->label(),
        );
    }
}
