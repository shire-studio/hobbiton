<?php

declare(strict_types=1);

use App\Enums\TeamRole;
use App\Models\Team;
use App\Models\TeamInvitation;
use App\Models\User;

it('renders the teams index with leave and edit actions', function (): void {
    $user = User::factory()->create();
    $owned = Team::factory()->create(['name' => 'Owned Team']);
    $owned->members()->attach($user, ['role' => TeamRole::Owner->value]);
    $joined = Team::factory()->create(['name' => 'Joined Team']);
    $joined->members()->attach($user, ['role' => TeamRole::Member->value]);

    $this->actingAs($user)
        ->get(route('teams.index'))
        ->assertOk()
        ->assertSeeHtml('data-test="create-team-button"')
        ->assertSee('Personal')
        ->assertSee('Owned Team')
        ->assertSee('Joined Team')
        ->assertSee('View team')
        ->assertSee('Edit team')
        ->assertSeeHtml(route('teams.leave', ['team' => $joined->slug]))
        ->assertDontSeeHtml(route('teams.leave', ['team' => $owned->slug]))
        ->assertSeeHtml('data-test="leave-team"')
        ->assertSeeHtml('data-test="leave-team-confirm"');
});

it('renders the team edit page with every control for an owner', function (): void {
    $owner = User::factory()->create();
    $member = User::factory()->create(['email' => 'sam@example.com']);
    $team = Team::factory()->create(['name' => 'Acme']);
    $team->members()->attach($owner, ['role' => TeamRole::Owner->value]);
    $team->members()->attach($member, ['role' => TeamRole::Member->value]);
    TeamInvitation::factory()->create(['team_id' => $team->id, 'email' => 'new@example.com']);

    $this->actingAs($owner)
        ->get(route('teams.edit', $team))
        ->assertOk()
        ->assertSee('Edit Acme')
        ->assertSee('sam@example.com')
        ->assertSee('new@example.com')
        ->assertSeeHtml('data-test="team-name"')
        ->assertSeeHtml('data-test="team-save"')
        ->assertSeeHtml('data-test="invite-member-button"')
        ->assertSeeHtml('data-test="invite-email"')
        ->assertSeeHtml('data-test="invite-submit"')
        ->assertSeeHtml('data-test="member-row"')
        ->assertSeeHtml('data-test="member-role"')
        ->assertSeeHtml('data-test="member-role-option"')
        ->assertSeeHtml('data-test="remove-member"')
        ->assertSeeHtml('data-test="remove-member-confirm"')
        ->assertSeeHtml('data-test="cancel-invitation"')
        ->assertSeeHtml('data-test="cancel-invitation-confirm"')
        ->assertSeeHtml('data-test="delete-team"')
        ->assertSeeHtml('data-test="delete-team-name"')
        ->assertSeeHtml('data-test="delete-team-submit"');
});

it('renders a read only team page for members', function (): void {
    $owner = User::factory()->create();
    $member = User::factory()->create();
    $team = Team::factory()->create(['name' => 'Acme']);
    $team->members()->attach($owner, ['role' => TeamRole::Owner->value]);
    $team->members()->attach($member, ['role' => TeamRole::Member->value]);
    TeamInvitation::factory()->create(['team_id' => $team->id, 'email' => 'new@example.com']);

    $this->actingAs($member)
        ->get(route('teams.edit', $team))
        ->assertOk()
        ->assertSee('View Acme')
        ->assertDontSee('new@example.com')
        ->assertDontSeeHtml('data-test="team-name"')
        ->assertDontSeeHtml('data-test="invite-member-button"')
        ->assertDontSeeHtml('data-test="member-role"')
        ->assertDontSeeHtml('data-test="remove-member"')
        ->assertDontSeeHtml('data-test="delete-team"');
});

it('hides the delete controls on a personal team', function (): void {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('teams.edit', $user->personalTeam()))
        ->assertOk()
        ->assertDontSeeHtml('data-test="delete-team"');
});

it('reopens only the modal whose form failed', function (string $form, string $marker, array $body): void {
    $user = User::factory()->create();
    $team = Team::factory()->create(['name' => 'Acme']);
    $team->members()->attach($user, ['role' => TeamRole::Owner->value]);

    $this->actingAs($user)
        ->from(route('teams.edit', $team))
        ->followingRedirects()
        ->call($form === 'delete-team' ? 'DELETE' : 'POST', route($form === 'delete-team' ? 'teams.destroy' : 'teams.invitations.store', $team), $body + ['form' => $form])
        ->assertSeeHtml($marker);
})->with([
    'delete' => ['delete-team', 'data-test="delete-team-reopen"', ['name' => 'Other']],
    'invite' => ['invite-member', 'data-test="invite-member-reopen"', ['email' => 'bad', 'role' => 'member']],
]);

it('shows rename errors only under the rename form', function (): void {
    $user = User::factory()->create();
    $team = Team::factory()->create(['name' => 'Acme']);
    $team->members()->attach($user, ['role' => TeamRole::Owner->value]);

    $this->actingAs($user)
        ->from(route('teams.edit', $team))
        ->followingRedirects()
        ->patch(route('teams.update', $team), ['name' => '', 'form' => 'rename-team'])
        ->assertSee('The name field is required.')
        ->assertDontSeeHtml('data-test="delete-team-reopen"');
});
