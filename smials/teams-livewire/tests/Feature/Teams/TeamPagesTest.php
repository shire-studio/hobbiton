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

function ownedTeam(): Team
{
    $user = User::factory()->create();
    $team = Team::factory()->create(['name' => 'Acme']);
    $team->members()->attach($user, ['role' => TeamRole::Owner->value]);

    test()->actingAs($user);

    return $team;
}

it('reopens only the delete modal after a failed delete', function (): void {
    $team = ownedTeam();

    $this->fromRoute('teams.edit', $team)
        ->followingRedirects()
        ->delete(route('teams.destroy', $team), ['name' => 'Other', 'form' => 'delete-team'])
        ->assertSeeHtml('data-test="delete-team-reopen"')
        ->assertSee('The team name does not match.')
        ->assertDontSeeHtml('data-test="invite-member-reopen"')
        ->assertDontSeeHtml('data-test="create-team-reopen"');
});

it('reopens only the invite modal after a failed invitation', function (): void {
    $team = ownedTeam();

    $this->fromRoute('teams.edit', $team)
        ->followingRedirects()
        ->post(route('teams.invitations.store', $team), ['email' => 'bad', 'role' => 'member', 'form' => 'invite-member'])
        ->assertSeeHtml('data-test="invite-member-reopen"')
        ->assertSee('valid email address')
        ->assertDontSeeHtml('data-test="delete-team-reopen"')
        ->assertDontSeeHtml('data-test="create-team-reopen"');
});

it('shows the invitation role error inside the invite modal', function (): void {
    $team = ownedTeam();

    $this->fromRoute('teams.edit', $team)
        ->followingRedirects()
        ->post(route('teams.invitations.store', $team), ['email' => 'new@example.com', 'role' => 'owner', 'form' => 'invite-member'])
        ->assertSeeHtml('data-test="invite-member-reopen"')
        ->assertSee('The selected role is invalid.');
});

it('shows the member role error under the members list', function (): void {
    $team = ownedTeam();
    $member = User::factory()->create();
    $team->members()->attach($member, ['role' => TeamRole::Member->value]);

    $this->fromRoute('teams.edit', $team)
        ->followingRedirects()
        ->patch(route('teams.members.update', [$team, $member]), ['role' => 'owner', 'form' => 'member-role'])
        ->assertSee('The selected role is invalid.')
        ->assertDontSeeHtml('data-test="invite-member-reopen"');
});

it('keeps rename errors out of the other forms', function (): void {
    $team = ownedTeam();

    $response = $this->fromRoute('teams.edit', $team)
        ->followingRedirects()
        ->patch(route('teams.update', $team), ['name' => '', 'form' => 'rename-team'])
        ->assertSee('The name field is required.')
        ->assertDontSeeHtml('data-test="delete-team-reopen"')
        ->assertDontSeeHtml('data-test="create-team-reopen"');

    expect(mb_substr_count($response->getContent(), 'The name field is required.'))->toBe(1);
});

it('keeps delete errors out of the rename and create team forms', function (): void {
    $team = ownedTeam();

    $response = $this->fromRoute('teams.edit', $team)
        ->followingRedirects()
        ->delete(route('teams.destroy', $team), ['name' => 'Other', 'form' => 'delete-team']);

    expect(mb_substr_count($response->getContent(), 'The team name does not match.'))->toBe(1)
        ->and($response->getContent())->not->toContain('value="Other"');
});

it('reopens the create team modal only for its own errors', function (): void {
    ownedTeam();

    $this->fromRoute('teams.index')
        ->followingRedirects()
        ->post(route('teams.store'), ['name' => '', 'form' => 'create-team'])
        ->assertSeeHtml('data-test="create-team-reopen"')
        ->assertSee('The name field is required.');
});

it('compares the delete confirmation with the team name as a javascript string', function (): void {
    $team = ownedTeam();
    $team->forceFill(['name' => 'Bob\'s "Team"'])->save();

    $content = $this->get(route('teams.edit', $team))->getContent();

    expect($content)->toContain('x-bind:disabled="confirmation !== \'Bob\u0027s \u0022Team\u0022\'"')
        ->and($content)->not->toContain('@js(');
});
