<?php

declare(strict_types=1);

use App\Enums\TeamRole;
use App\Models\Team;
use App\Models\TeamInvitation;
use App\Models\User;

it('creates a team and switches to it', function (): void {
    $user = User::factory()->create();

    $this->actingAs($user);

    $page = visit('/settings/teams');

    $page->click('@create-team-button')
        ->type('@create-team-name', 'Acme')
        ->click('@create-team-submit')
        ->assertPathIs('/settings/teams/acme')
        ->click('@team-switcher')
        ->click('[data-test="team-switcher-item"]:has-text("Acme")')
        ->assertPathIs('/acme/dashboard')
        ->assertSee('Dashboard');

    expect($user->refresh()->currentTeam?->slug)->toBe('acme');
});

it('renames a team and keeps navigating', function (): void {
    $user = User::factory()->create();
    $team = Team::factory()->create(['name' => 'Acme']);
    $team->members()->attach($user, ['role' => TeamRole::Owner->value]);

    $this->actingAs($user);

    $page = visit('/settings/teams/'.$team->slug);

    $page->type('@team-name', 'Globex')
        ->click('@team-save')
        ->assertPathIs('/settings/teams/globex')
        ->assertSee('Globex')
        ->click('Teams')
        ->assertPathIs('/settings/teams')
        ->assertSee('Globex');

    expect($team->refresh()->name)->toBe('Globex');
});

it('invites a member and cancels the invitation', function (): void {
    $user = User::factory()->create();
    $team = Team::factory()->create(['name' => 'Acme']);
    $team->members()->attach($user, ['role' => TeamRole::Owner->value]);

    $this->actingAs($user);

    $page = visit('/settings/teams/'.$team->slug);

    $page->click('Invite member')
        ->type('@invite-email', 'colleague@example.com')
        ->click('@invite-submit')
        ->assertSee('colleague@example.com');

    expect($team->invitations()->where('email', 'colleague@example.com')->exists())->toBeTrue();

    $page->click('@cancel-invitation')
        ->click('@cancel-invitation-confirm')
        ->assertDontSee('colleague@example.com');

    expect($team->invitations()->where('email', 'colleague@example.com')->exists())->toBeFalse();
});

it('accepts a pending invitation from the dashboard', function (): void {
    $user = User::factory()->create();
    $team = Team::factory()->create(['name' => 'Acme']);
    TeamInvitation::factory()->create([
        'team_id' => $team->id,
        'email' => $user->email,
        'role' => TeamRole::Member,
    ]);

    $this->actingAs($user);

    $page = visit('/dashboard');

    $page->assertSee('Pending team invitations')
        ->assertSee('Acme')
        ->click('@accept-invitation')
        ->assertDontSee('Pending team invitations');

    expect($user->teams()->whereKey($team->id)->exists())->toBeTrue();
});

it('deletes a team after confirming its name', function (): void {
    $user = User::factory()->create();
    $team = Team::factory()->create(['name' => 'Acme']);
    $team->members()->attach($user, ['role' => TeamRole::Owner->value]);

    $this->actingAs($user);

    $page = visit('/settings/teams/'.$team->slug);

    $page->click('@delete-team')
        ->type('@delete-team-name', 'Acme')
        ->click('@delete-team-submit')
        ->assertPathIs('/settings/teams');

    expect(Team::query()->whereKey($team->id)->exists())->toBeFalse();
});
