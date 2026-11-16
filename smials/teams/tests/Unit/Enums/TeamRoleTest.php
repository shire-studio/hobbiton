<?php

declare(strict_types=1);

use App\Enums\TeamPermission;
use App\Enums\TeamRole;
use Illuminate\Support\Facades\Validator;

it('grants owners every permission', function (): void {
    expect(TeamRole::Owner->permissions())->toBe(TeamPermission::cases())
        ->and(TeamRole::Owner->hasPermission(TeamPermission::DeleteTeam))->toBeTrue();
});

it('grants admins team updates and invitations', function (): void {
    expect(TeamRole::Admin->permissions())->toBe([
        TeamPermission::UpdateTeam,
        TeamPermission::CreateInvitation,
        TeamPermission::CancelInvitation,
    ])
        ->and(TeamRole::Admin->hasPermission(TeamPermission::DeleteTeam))->toBeFalse();
});

it('grants members nothing', function (): void {
    expect(TeamRole::Member->permissions())->toBeEmpty()
        ->and(TeamRole::Member->hasPermission(TeamPermission::UpdateTeam))->toBeFalse();
});

it('compares role levels', function (): void {
    expect(TeamRole::Owner->level())->toBe(3)
        ->and(TeamRole::Admin->level())->toBe(2)
        ->and(TeamRole::Member->level())->toBe(1)
        ->and(TeamRole::Admin->isAtLeast(TeamRole::Member))->toBeTrue()
        ->and(TeamRole::Member->isAtLeast(TeamRole::Admin))->toBeFalse();
});

it('lists assignable roles without the owner', function (): void {
    expect(TeamRole::assignable())->toBe([
        ['value' => 'admin', 'label' => 'Admin'],
        ['value' => 'member', 'label' => 'Member'],
    ]);
});

it('validates assignable roles without the owner', function (string $role, bool $passes): void {
    expect(Validator::make(['role' => $role], ['role' => [TeamRole::assignableRule()]])->passes())->toBe($passes);
})->with([
    'admin' => ['admin', true],
    'member' => ['member', true],
    'owner' => ['owner', false],
    'unknown' => ['guest', false],
]);
