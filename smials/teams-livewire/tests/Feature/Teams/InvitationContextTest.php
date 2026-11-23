<?php

declare(strict_types=1);

use App\Models\Team;
use App\Models\TeamInvitation;

it('shows the inviting team on the login page', function (): void {
    $team = Team::factory()->create(['name' => 'Acme']);
    $invitation = TeamInvitation::factory()->create(['team_id' => $team->id]);

    $this->get(route('login', ['invitation' => $invitation->code]))
        ->assertOk()
        ->assertViewIs('pages.auth.login')
        ->assertViewHas('teamInvitation', fn ($found): bool => $found->code === $invitation->code
            && $found->team->name === 'Acme')
        ->assertSeeHtml('data-test="team-invitation-alert"')
        ->assertSeeHtml('Log in to join the')
        ->assertSee('Acme')
        ->assertSeeHtml(route('register', ['invitation' => $invitation->code]));
});

it('shows the inviting team on the register page', function (): void {
    $team = Team::factory()->create(['name' => 'Acme']);
    $invitation = TeamInvitation::factory()->create(['team_id' => $team->id]);

    $this->get(route('register', ['invitation' => $invitation->code]))
        ->assertOk()
        ->assertViewIs('pages.auth.register')
        ->assertViewHas('teamInvitation', fn ($found): bool => $found->code === $invitation->code
            && $found->team->name === 'Acme')
        ->assertSeeHtml('data-test="team-invitation-alert"')
        ->assertSeeHtml('Register to join the')
        ->assertSee('Acme')
        ->assertSeeHtml(route('login', ['invitation' => $invitation->code]));
});

it('ignores an expired invitation code', function (): void {
    $invitation = TeamInvitation::factory()->expired()->create();

    $login = $this->get(route('login', ['invitation' => $invitation->code]));
    $register = $this->get(route('register', ['invitation' => $invitation->code]));

    expect($login->viewData('teamInvitation'))->toBeNull()
        ->and($register->viewData('teamInvitation'))->toBeNull();

    $login->assertDontSeeHtml('data-test="team-invitation-alert"');
});

it('ignores an invitation code for a personal team', function (): void {
    $invitation = TeamInvitation::factory()->create(['team_id' => Team::factory()->personal()->create()->id]);

    $login = $this->get(route('login', ['invitation' => $invitation->code]));
    $register = $this->get(route('register', ['invitation' => $invitation->code]));

    expect($login->viewData('teamInvitation'))->toBeNull()
        ->and($register->viewData('teamInvitation'))->toBeNull();

    $login->assertDontSeeHtml('data-test="team-invitation-alert"');
});

it('ignores an unknown invitation code', function (): void {
    expect($this->get(route('login', ['invitation' => 'unknown']))->viewData('teamInvitation'))->toBeNull()
        ->and($this->get(route('register', ['invitation' => ['array']]))->viewData('teamInvitation'))->toBeNull()
        ->and($this->get(route('register'))->viewData('teamInvitation'))->toBeNull();
});

it('ignores an accepted invitation code', function (): void {
    $invitation = TeamInvitation::factory()->accepted()->create();

    expect($this->get(route('login', ['invitation' => $invitation->code]))->viewData('teamInvitation'))->toBeNull()
        ->and($this->get(route('register', ['invitation' => $invitation->code]))->viewData('teamInvitation'))->toBeNull();
});

it('keeps plain links without an invitation', function (): void {
    $this->get(route('login'))->assertSeeHtml('href="'.route('register').'"');
    $this->get(route('register'))->assertSeeHtml('href="'.route('login').'"');
});
