<?php

declare(strict_types=1);

use App\Data\TeamPermissionsData;
use App\Enums\TeamRole;
use App\Models\Team;
use App\Models\User;

it('reflects owner permissions', function (): void {
    $user = User::factory()->create();
    $team = Team::factory()->create();
    $team->members()->attach($user, ['role' => TeamRole::Owner->value]);

    expect(TeamPermissionsData::fromTeam($team, $user)->toArray())->toBe([
        'can_update_team' => true,
        'can_delete_team' => true,
        'can_add_member' => true,
        'can_update_member' => true,
        'can_remove_member' => true,
        'can_create_invitation' => true,
        'can_cancel_invitation' => true,
    ]);
});

it('reflects admin permissions', function (): void {
    $user = User::factory()->create();
    $team = Team::factory()->create();
    $team->members()->attach($user, ['role' => TeamRole::Admin->value]);

    expect(TeamPermissionsData::fromTeam($team, $user)->toArray())->toBe([
        'can_update_team' => true,
        'can_delete_team' => false,
        'can_add_member' => false,
        'can_update_member' => false,
        'can_remove_member' => false,
        'can_create_invitation' => true,
        'can_cancel_invitation' => true,
    ]);
});

it('gives members no permissions', function (): void {
    $user = User::factory()->create();
    $team = Team::factory()->create();
    $team->members()->attach($user, ['role' => TeamRole::Member->value]);

    expect(array_filter(TeamPermissionsData::fromTeam($team, $user)->toArray()))->toBeEmpty();
});
