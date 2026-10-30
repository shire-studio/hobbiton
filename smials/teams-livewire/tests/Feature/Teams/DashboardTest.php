<?php

declare(strict_types=1);

use App\Enums\TeamRole;
use App\Models\Team;
use App\Models\TeamInvitation;
use App\Models\User;
use Illuminate\Support\Facades\Blade;
use Illuminate\Support\MessageBag;
use Illuminate\Support\ViewErrorBag;

it('redirects the dashboard to the current team', function (): void {
    $user = User::factory()->create();
    $team = Team::factory()->create();
    $team->members()->attach($user, ['role' => TeamRole::Member->value]);
    $user->update(['current_team_id' => $team->id]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertRedirectToRoute('team.dashboard', ['current_team' => $team->slug]);
});

it('falls back to the personal team when no current team is set', function (): void {
    $user = User::factory()->create();
    $user->update(['current_team_id' => null]);

    $this->actingAs($user->refresh())
        ->get(route('dashboard'))
        ->assertRedirectToRoute('team.dashboard', ['current_team' => $user->personalTeam()?->slug]);
});

it('shows the team dashboard to members', function (): void {
    $user = User::factory()->create(['name' => 'Jane']);
    $slug = $user->personalTeam()?->slug;

    $this->actingAs($user)
        ->get(route('team.dashboard', ['current_team' => $slug]))
        ->assertOk()
        ->assertViewIs('pages.dashboard')
        ->assertViewHas('pendingInvitations', fn ($invitations): bool => $invitations->isEmpty())
        ->assertSee("Jane's Team")
        ->assertSeeHtml(route('teams.switch', ['team' => $slug]))
        ->assertDontSee('Pending team invitations');
});

it('links the dashboard from the current team', function (): void {
    $user = User::factory()->create();
    $slug = $user->personalTeam()?->slug;

    $this->actingAs($user)
        ->get(route('team.dashboard', ['current_team' => $slug]))
        ->assertSeeHtml('data-test="dashboard-link"')
        ->assertSeeHtml(url("/{$slug}/dashboard"))
        ->assertDontSeeHtml('current_team=');
});

it("hides another team's dashboard", function (): void {
    $user = User::factory()->create();
    $other = User::factory()->create();

    $this->actingAs($user)
        ->get(route('team.dashboard', ['current_team' => $other->personalTeam()?->slug]))
        ->assertNotFound();
});

it('switches the current team from the url', function (): void {
    $user = User::factory()->create();
    $team = Team::factory()->create(['name' => 'Acme']);
    $team->members()->attach($user, ['role' => TeamRole::Admin->value]);

    $this->actingAs($user)
        ->get(route('team.dashboard', ['current_team' => $team->slug]))
        ->assertOk()
        ->assertSeeHtml('data-test="team-switcher"')
        ->assertSeeHtml(url("/{$team->slug}/dashboard"));

    expect($user->refresh()->current_team_id)->toBe($team->id);
});

it('lists every team in the switcher with a switch form', function (): void {
    $user = User::factory()->create();
    $team = Team::factory()->create(['name' => 'Acme']);
    $team->members()->attach($user, ['role' => TeamRole::Member->value]);

    $this->actingAs($user)
        ->get(route('team.dashboard', ['current_team' => $user->personalTeam()?->slug]))
        ->assertSeeHtml('data-test="team-switcher"')
        ->assertSeeHtml('data-test="team-switcher-item"')
        ->assertSeeHtml('data-test="team-switcher-new-team"')
        ->assertSeeHtml(route('teams.switch', ['team' => $team->slug]))
        ->assertSeeHtml(route('teams.store'));
});

it('renders the team switcher in the header layout', function (): void {
    $user = User::factory()->create(['name' => 'Jane']);

    $this->actingAs($user);
    view()->share('errors', new ViewErrorBag);

    $html = Blade::render('<x-layouts::app.header>content</x-layouts::app.header>');

    expect($html)
        ->toContain('data-test="team-switcher"')
        ->toContain('data-test="dashboard-link"')
        ->toContain(e("Jane's Team"))
        ->toContain('data-flux-profile')
        ->not->toContain('data-test="current-team-name"');
});

it('shows the current team under the user in the user menu', function (): void {
    $user = User::factory()->create(['name' => 'Jane', 'email' => 'jane@example.com']);
    $team = Team::factory()->create(['name' => 'Acme']);
    $team->members()->attach($user, ['role' => TeamRole::Member->value]);

    $html = $this->actingAs($user)
        ->get(route('team.dashboard', ['current_team' => $team->slug]))
        ->assertOk()
        ->getContent();

    expect($html)->toMatch('/data-test="current-team-name"[^>]*>\s*Acme\s*</')
        ->and($html)->toContain('jane@example.com');
});

it('falls back to the plain dashboard link for a user without a team', function (): void {
    $user = User::factory()->create();
    $user->teams()->detach();
    $user->forceFill(['current_team_id' => null])->save();

    $this->actingAs($user);
    view()->share('errors', new ViewErrorBag);

    foreach (['sidebar', 'header'] as $layout) {
        expect(Blade::render("<x-layouts::app.{$layout}>content</x-layouts::app.{$layout}>"))
            ->toContain('href="'.route('dashboard').'"');
    }
});

it('reopens the create team modal after its own validation error', function (): void {
    $user = User::factory()->create();
    $errors = new ViewErrorBag()->put('default', new MessageBag(['name' => 'The name field is required.']));

    $this->actingAs($user)
        ->withSession(['errors' => $errors, '_old_input' => ['form' => 'create-team']])
        ->get(route('team.dashboard', ['current_team' => $user->personalTeam()?->slug]))
        ->assertSeeHtml('name="form" value="create-team"')
        ->assertSeeHtml('data-test="create-team-reopen"');
});

it('keeps the create team modal closed for name errors from other forms', function (): void {
    $user = User::factory()->create();
    $errors = new ViewErrorBag()->put('default', new MessageBag(['name' => 'The name field is required.']));

    $this->actingAs($user)
        ->withSession(['errors' => $errors])
        ->get(route('team.dashboard', ['current_team' => $user->personalTeam()?->slug]))
        ->assertDontSeeHtml('data-test="create-team-reopen"');
});

it("lists pending invitations for the user's email", function (): void {
    $user = User::factory()->create(['email' => 'Invitee@Example.com']);
    $team = Team::factory()->create(['name' => 'Acme']);
    $inviter = User::factory()->create(['name' => 'Ivy Inviter']);

    TeamInvitation::factory()->create([
        'team_id' => $team->id,
        'invited_by' => $inviter->id,
        'email' => 'invitee@example.com',
        'code' => 'pending-code',
    ]);
    TeamInvitation::factory()->expired()->create(['email' => 'invitee@example.com']);
    TeamInvitation::factory()->accepted()->create(['email' => 'invitee@example.com']);
    TeamInvitation::factory()->create(['team_id' => Team::factory()->personal()->create()->id, 'email' => 'invitee@example.com']);
    TeamInvitation::factory()->create(['email' => 'someone-else@example.com']);

    $this->actingAs($user)
        ->get(route('team.dashboard', ['current_team' => $user->personalTeam()?->slug]))
        ->assertViewHas('pendingInvitations', fn ($invitations): bool => $invitations->count() === 1
            && $invitations->first()->code === 'pending-code')
        ->assertSee('Pending team invitations')
        ->assertSee('Ivy Inviter')
        ->assertSee('Acme')
        ->assertSeeHtml('data-test="pending-invitation"')
        ->assertSeeHtml(route('invitations.accept', ['invitation' => 'pending-code']))
        ->assertSeeHtml(route('invitations.decline', ['invitation' => 'pending-code']));
});

it('shows invitation errors on the dashboard', function (): void {
    $user = User::factory()->create(['email' => 'invitee@example.com']);
    TeamInvitation::factory()->create(['email' => 'invitee@example.com']);

    $this->actingAs($user)
        ->withSession(['errors' => new ViewErrorBag()->put('default', new MessageBag(['invitation' => 'This invitation is invalid or has expired.']))])
        ->get(route('team.dashboard', ['current_team' => $user->personalTeam()?->slug]))
        ->assertSee('This invitation is invalid or has expired.');
});

it('requires a verified email', function (): void {
    $user = User::factory()->unverified()->create();

    $this->actingAs($user)
        ->get(route('team.dashboard', ['current_team' => $user->personalTeam()?->slug]))
        ->assertRedirectToRoute('verification.notice');

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertRedirectToRoute('verification.notice');
});

it('redirects guests to login', function (): void {
    $this->get('/some-team/dashboard')->assertRedirectToRoute('login');
});
