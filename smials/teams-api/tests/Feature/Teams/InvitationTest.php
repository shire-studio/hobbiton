<?php

declare(strict_types=1);

use App\Enums\TeamRole;
use App\Models\Team;
use App\Models\TeamInvitation;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

it("lists pending invitations for the user's email", function (): void {
    $user = User::factory()->create(['email' => 'me@example.com']);
    $team = Team::factory()->create(['name' => 'Acme']);
    $inviter = User::factory()->create(['name' => 'Olivia Owner']);

    $invitation = TeamInvitation::factory()->create([
        'team_id' => $team->id,
        'invited_by' => $inviter->id,
        'email' => 'ME@example.com',
        'role' => TeamRole::Admin,
    ]);
    TeamInvitation::factory()->expired()->create(['email' => 'me@example.com']);
    TeamInvitation::factory()->create(['email' => 'other@example.com']);

    Sanctum::actingAs($user);

    $this->getJson(route('invitations.index'))
        ->assertOk()
        ->assertExactJson(['data' => [[
            'code' => $invitation->code,
            'email' => 'ME@example.com',
            'role' => 'admin',
            'team' => [
                'id' => $team->id,
                'name' => 'Acme',
                'slug' => $team->slug,
                'is_personal' => false,
            ],
            'inviter_name' => 'Olivia Owner',
            'expires_at' => $invitation->expires_at->toIso8601String(),
            'created_at' => $invitation->created_at->toIso8601String(),
        ]]]);
});

it('accepts an invitation', function (): void {
    $user = User::factory()->create(['email' => 'me@example.com']);
    $invitation = TeamInvitation::factory()->create(['email' => 'me@example.com', 'role' => TeamRole::Admin]);

    Sanctum::actingAs($user);

    $this->postJson(route('invitations.accept', $invitation))
        ->assertOk()
        ->assertJsonPath('data.id', $invitation->team_id)
        ->assertJsonPath('data.role', 'admin')
        ->assertJsonPath('data.is_current', true);

    expect($user->teamRole($invitation->team))->toBe(TeamRole::Admin)
        ->and($user->fresh()->current_team_id)->toBe($invitation->team_id)
        ->and($invitation->fresh()->accepted_at)->not->toBeNull();
});

it('declines an invitation', function (): void {
    $user = User::factory()->create(['email' => 'me@example.com']);
    $invitation = TeamInvitation::factory()->create(['email' => 'me@example.com']);

    Sanctum::actingAs($user);

    $this->deleteJson(route('invitations.decline', $invitation))->assertNoContent();

    expect(TeamInvitation::query()->find($invitation->id))->toBeNull()
        ->and($user->belongsToTeam($invitation->team))->toBeFalse();
});

it('rejects an invitation for another email', function (): void {
    $invitation = TeamInvitation::factory()->create(['email' => 'other@example.com']);

    Sanctum::actingAs(User::factory()->create(['email' => 'me@example.com']));

    $this->postJson(route('invitations.accept', $invitation))
        ->assertUnprocessable()
        ->assertJsonValidationErrors('invitation');
});

it('rejects declining an invitation for another email', function (): void {
    $invitation = TeamInvitation::factory()->create(['email' => 'other@example.com']);

    Sanctum::actingAs(User::factory()->create(['email' => 'me@example.com']));

    $this->deleteJson(route('invitations.decline', $invitation))
        ->assertUnprocessable()
        ->assertJsonValidationErrors('invitation');
});

it('rejects an expired invitation', function (): void {
    $invitation = TeamInvitation::factory()->expired()->create(['email' => 'me@example.com']);

    Sanctum::actingAs(User::factory()->create(['email' => 'me@example.com']));

    $this->postJson(route('invitations.accept', $invitation))
        ->assertUnprocessable()
        ->assertJsonValidationErrors('invitation');
});
