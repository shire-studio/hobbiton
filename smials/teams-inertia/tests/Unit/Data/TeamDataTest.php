<?php

declare(strict_types=1);

use App\Data\TeamData;
use App\Enums\TeamRole;
use App\Models\Team;
use App\Models\User;

it('can be created from a team and viewer', function (): void {
    $user = User::factory()->create();
    $team = Team::factory()->create(['name' => 'Acme', 'slug' => 'acme']);
    $team->members()->attach($user, ['role' => TeamRole::Admin->value]);

    expect(TeamData::fromTeam($team, $user)->toArray())->toBe([
        'id' => $team->id,
        'name' => 'Acme',
        'slug' => 'acme',
        'is_personal' => false,
        'role' => 'admin',
        'role_label' => 'Admin',
        'is_current' => false,
    ]);
});

it('has no role for a non member', function (): void {
    $team = Team::factory()->create();

    $data = TeamData::fromTeam($team, User::factory()->create());

    expect($data->role)->toBeNull()
        ->and($data->role_label)->toBeNull();
});
