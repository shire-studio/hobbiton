<?php

declare(strict_types=1);

use App\Enums\TeamRole;
use App\Models\Team;
use App\Models\TeamInvitation;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

it('creates a team and switches between teams', function (): void {
    $user = User::factory()->create(['name' => 'Jane']);
    $personal = $user->personalTeam();

    $this->actingAs($user);

    $page = visit('/settings/teams');

    $page->click('@create-team-button')
        ->type('@create-team-name', 'Acme')
        ->click('@create-team-submit')
        ->assertPathIs('/settings/teams/acme');

    expect($user->refresh()->currentTeam?->slug)->toBe('acme');

    $page->click('@team-switcher')
        ->click('[data-test="team-switcher-item"]:has-text("Jane\'s Team")')
        ->assertPathIs('/'.$personal?->slug.'/dashboard');

    expect($user->refresh()->currentTeam?->slug)->toBe($personal?->slug);

    $page->click('@team-switcher')
        ->click('[data-test="team-switcher-item"]:has-text("Acme")')
        ->assertPathIs('/acme/dashboard');

    expect($user->refresh()->currentTeam?->slug)->toBe('acme');
});

it('renames a team and keeps navigating', function (): void {
    $user = User::factory()->create();
    $team = Team::factory()->create(['name' => 'Acme']);
    $team->members()->attach($user, ['role' => TeamRole::Owner->value]);
    $user->forceFill(['current_team_id' => $team->id])->save();

    $page = visit('/login');

    $page->type('email', $user->email)
        ->type('password', 'password')
        ->click('@login-button')
        ->assertPathIs('/'.$team->slug.'/dashboard')
        ->navigate('/settings/teams/'.$team->slug)
        ->type('@team-name', 'Globex')
        ->click('@team-save')
        ->assertPathIs('/settings/teams/globex');

    Auth::forgetGuards();

    $page->navigate('/settings/teams/globex')
        ->click('[data-sidebar="menu-button"][href$="/globex/dashboard"] >> text=Dashboard')
        ->assertPathIs('/globex/dashboard');

    expect($team->refresh()->name)->toBe('Globex');
});

it('invites a member and cancels the invitation', function (): void {
    $user = User::factory()->create();
    $team = Team::factory()->create(['name' => 'Acme']);
    $team->members()->attach($user, ['role' => TeamRole::Owner->value]);

    $this->actingAs($user);

    $page = visit('/settings/teams/'.$team->slug);

    $page->click('@invite-member-button')
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

it('shows the team invitation on the login and register pages', function (): void {
    $team = Team::factory()->create(['name' => 'Acme']);
    $invitation = TeamInvitation::factory()->create(['team_id' => $team->id]);

    $page = visit('/login?invitation='.$invitation->code);

    $page->assertSeeIn('@team-invitation-alert', 'Log in to join the "Acme" team.')
        ->click('@register-link')
        ->assertPathIs('/register')
        ->assertQueryStringHas('invitation', $invitation->code)
        ->assertSeeIn('@team-invitation-alert', 'Register to join the "Acme" team.')
        ->click('@login-link')
        ->assertPathIs('/login')
        ->assertSeeIn('@team-invitation-alert', 'Acme');
});
