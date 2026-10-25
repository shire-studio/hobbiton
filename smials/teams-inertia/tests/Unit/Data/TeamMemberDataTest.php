<?php

declare(strict_types=1);

use App\Data\TeamMemberData;
use App\Enums\TeamRole;
use App\Models\User;

it('can be created from a member and role', function (): void {
    $user = User::factory()->create(['name' => 'Jo', 'email' => 'jo@example.com']);

    expect(TeamMemberData::fromMember($user, TeamRole::Member)->toArray())->toBe([
        'id' => $user->id,
        'name' => 'Jo',
        'email' => 'jo@example.com',
        'role' => 'member',
        'role_label' => 'Member',
    ]);
});
