<?php

declare(strict_types=1);

use App\Enums\TeamRole;
use App\Models\Membership;
use App\Models\Team;
use App\Models\TeamInvitation;
use App\Models\User;

it('returns the owner', function (): void {
    $team = Team::factory()->create();
    $owner = User::factory()->withoutPersonalTeam()->create();
    $member = User::factory()->withoutPersonalTeam()->create();
    $team->members()->attach($owner, ['role' => TeamRole::Owner->value]);
    $team->members()->attach($member, ['role' => TeamRole::Member->value]);

    expect($team->owner()?->is($owner))->toBeTrue();
});

it('has no owner without members', function (): void {
    expect(Team::factory()->create()->owner())->toBeNull();
});

it('lists members with their roles', function (): void {
    $team = Team::factory()->create();
    $admin = User::factory()->withoutPersonalTeam()->create();
    $team->members()->attach($admin, ['role' => TeamRole::Admin->value]);

    $member = $team->members()->first();

    expect($member?->pivot)->toBeInstanceOf(Membership::class)
        ->and($member?->pivot->role)->toBe(TeamRole::Admin)
        ->and($team->memberships()->count())->toBe(1)
        ->and($team->memberships()->first()?->team->is($team))->toBeTrue()
        ->and($team->memberships()->first()?->user->is($admin))->toBeTrue();
});

it('lists invitations', function (): void {
    $team = Team::factory()->create();
    $invitation = TeamInvitation::factory()->for($team)->create();

    expect($team->invitations()->first()?->is($invitation))->toBeTrue();
});

it('soft deletes', function (): void {
    $team = Team::factory()->create();

    $team->delete();

    expect(Team::query()->find($team->id))->toBeNull()
        ->and(Team::withTrashed()->find($team->id)?->deleted_at)->not->toBeNull();
});
