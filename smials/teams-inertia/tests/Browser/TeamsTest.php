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
        ->click('@team-switcher-new-team')
        ->type('@create-team-name', 'Globex')
        ->click('@create-team-submit')
        ->assertPathIs('/settings/teams/globex')
        ->assertValue('@team-name', 'Globex');

    expect($user->refresh()->currentTeam?->slug)->toBe('globex');

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
        ->assertPathIs('/'.$team->slug.'/dashboard')
        ->assertDontSee('Pending team invitations');

    expect($user->teams()->whereKey($team->id)->exists())->toBeTrue();
});

it('declines a pending invitation and shows invitation errors on the dashboard', function (): void {
    $user = User::factory()->create();
    $acme = Team::factory()->create(['name' => 'Acme']);
    $globex = Team::factory()->create(['name' => 'Globex']);
    $initech = Team::factory()->create(['name' => 'Initech']);
    $declined = TeamInvitation::factory()->create([
        'team_id' => $globex->id,
        'email' => $user->email,
        'role' => TeamRole::Member,
    ]);
    $expiring = TeamInvitation::factory()->create([
        'team_id' => $initech->id,
        'email' => $user->email,
        'role' => TeamRole::Member,
    ]);
    TeamInvitation::factory()->create([
        'team_id' => $acme->id,
        'email' => $user->email,
        'role' => TeamRole::Member,
    ]);

    $this->actingAs($user);

    $page = visit('/dashboard')->assertSeeIn('@pending-invitation', 'Initech');

    $expiring->forceFill(['expires_at' => now()->subMinute()])->save();

    $page->click('[data-test="pending-invitation"]:has-text("Initech") [data-test="accept-invitation"]')
        ->assertSee('This invitation is invalid or has expired.')
        ->assertDontSee('Initech');

    expect($user->belongsToTeam($initech))->toBeFalse();

    $page->click('[data-test="pending-invitation"]:has-text("Globex") [data-test="decline-invitation"]')
        ->assertSeeIn('@pending-invitation', 'Acme')
        ->assertDontSee('Globex');

    expect(TeamInvitation::query()->whereKey($declined->id)->exists())->toBeFalse()
        ->and($user->belongsToTeam($globex))->toBeFalse();
});

it('changes a member role, removes a member and leaves a team', function (): void {
    $owner = User::factory()->create();
    $member = User::factory()->create(['email' => 'sam@example.com']);
    $team = Team::factory()->create(['name' => 'Acme']);
    $team->members()->attach($owner, ['role' => TeamRole::Owner->value]);
    $team->members()->attach($member, ['role' => TeamRole::Member->value]);
    $other = Team::factory()->create(['name' => 'Globex']);
    $other->members()->attach($owner, ['role' => TeamRole::Member->value]);

    $this->actingAs($owner);

    $row = '[data-test="member-row"]:has-text("sam@example.com")';

    $page = visit('/settings/teams/'.$team->slug);

    $page->click($row.' [data-test="member-role"]')
        ->click('[data-test="member-role-option"]:has-text("Admin")')
        ->assertSeeIn($row.' [data-test="member-role"]', 'Admin');

    expect($member->teamRole($team))->toBe(TeamRole::Admin);

    $page->click($row.' [data-test="remove-member"]')
        ->click('@remove-member-confirm')
        ->assertDontSee('sam@example.com');

    expect($member->belongsToTeam($team))->toBeFalse();

    $page->navigate('/settings/teams')
        ->click('@leave-team')
        ->click('@leave-team-confirm')
        ->assertPathIs('/settings/teams')
        ->assertDontSee('Globex');

    expect($owner->belongsToTeam($other))->toBeFalse();
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
