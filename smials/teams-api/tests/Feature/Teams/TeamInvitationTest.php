<?php

declare(strict_types=1);

use App\Enums\TeamRole;
use App\Models\Team;
use App\Models\TeamInvitation;
use App\Models\User;
use App\Notifications\TeamInvitationNotification;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;

function inviterSetup(TeamRole $role = TeamRole::Owner): array
{
    $team = Team::factory()->create(['name' => 'Acme']);
    $user = User::factory()->create(['name' => 'Olivia Owner']);
    $team->members()->attach($user, ['role' => $role->value]);

    Sanctum::actingAs($user);

    return [$team, $user];
}

it('invites a member by email', function (): void {
    Notification::fake();

    [$team] = inviterSetup();

    $response = $this->postJson(route('teams.invitations.store', $team), [
        'email' => 'new@example.com',
        'role' => 'admin',
    ])->assertCreated()
        ->assertJsonPath('data.email', 'new@example.com')
        ->assertJsonPath('data.role', 'admin')
        ->assertJsonPath('data.inviter_name', 'Olivia Owner')
        ->assertJsonPath('data.team.name', 'Acme');

    $invitation = TeamInvitation::query()->where('code', $response->json('data.code'))->firstOrFail();

    $response->assertJsonPath('data.expires_at', $invitation->expires_at->toIso8601String())
        ->assertJsonPath('data.created_at', $invitation->created_at->toIso8601String());

    Notification::assertSentOnDemand(
        TeamInvitationNotification::class,
        fn (TeamInvitationNotification $notification, array $channels, object $notifiable): bool => $notifiable->routes['mail'] === 'new@example.com',
    );
});

it('rejects inviting an existing member', function (): void {
    [$team, $user] = inviterSetup();

    $this->postJson(route('teams.invitations.store', $team), ['email' => $user->email, 'role' => 'member'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('email');
});

it('rejects a duplicate pending invitation', function (): void {
    [$team, $user] = inviterSetup();

    TeamInvitation::factory()->create([
        'team_id' => $team->id,
        'invited_by' => $user->id,
        'email' => 'new@example.com',
    ]);

    $this->postJson(route('teams.invitations.store', $team), ['email' => 'new@example.com', 'role' => 'member'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('email');
});

it('rejects an invalid invitation email', function (): void {
    [$team] = inviterSetup();

    $this->postJson(route('teams.invitations.store', $team), ['email' => 'not-an-email', 'role' => 'member'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('email');
});

it('rejects inviting with the owner role', function (): void {
    [$team] = inviterSetup();

    $this->postJson(route('teams.invitations.store', $team), ['email' => 'new@example.com', 'role' => 'owner'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('role');
});

it('forbids members inviting', function (): void {
    [$team] = inviterSetup(TeamRole::Member);

    $this->postJson(route('teams.invitations.store', $team), ['email' => 'new@example.com', 'role' => 'member'])
        ->assertNotFound();
});

it('cancels an invitation', function (): void {
    [$team, $user] = inviterSetup();

    $invitation = TeamInvitation::factory()->create(['team_id' => $team->id, 'invited_by' => $user->id]);

    $this->deleteJson(route('teams.invitations.destroy', [$team, $invitation]))->assertNoContent();

    expect(TeamInvitation::query()->find($invitation->id))->toBeNull();
});

it('forbids members cancelling an invitation', function (): void {
    [$team, $user] = inviterSetup(TeamRole::Member);

    $invitation = TeamInvitation::factory()->create(['team_id' => $team->id, 'invited_by' => $user->id]);

    $this->deleteJson(route('teams.invitations.destroy', [$team, $invitation]))->assertNotFound();
});

it('returns 404 for an invitation from another team', function (): void {
    [$team] = inviterSetup();

    $invitation = TeamInvitation::factory()->create();

    $this->deleteJson(route('teams.invitations.destroy', [$team, $invitation]))->assertNotFound();

    expect(TeamInvitation::query()->find($invitation->id))->not->toBeNull();
});
