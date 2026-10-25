<?php

declare(strict_types=1);

use App\Enums\TeamRole;
use App\Models\Team;
use App\Models\TeamInvitation;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

it('returns 404 before validating for non members', function (string $method, string $route, array $body): void {
    $team = Team::factory()->create(['name' => 'Acme']);
    $member = User::factory()->create();
    $team->members()->attach($member, ['role' => TeamRole::Member->value]);
    $invitation = TeamInvitation::factory()->create(['team_id' => $team->id]);

    Sanctum::actingAs(User::factory()->create());

    $parameters = match ($route) {
        'teams.members.update', 'teams.members.destroy' => [$team, $member],
        'teams.invitations.destroy' => [$team, $invitation],
        default => [$team],
    };

    $this->json($method, route($route, $parameters), $body)->assertNotFound();
})->with([
    'update' => ['PATCH', 'teams.update', ['name' => '']],
    'destroy' => ['DELETE', 'teams.destroy', ['name' => 'Acme']],
    'leave' => ['DELETE', 'teams.leave', []],
    'member update' => ['PATCH', 'teams.members.update', ['role' => 'owner']],
    'member destroy' => ['DELETE', 'teams.members.destroy', []],
    'invitation store' => ['POST', 'teams.invitations.store', ['email' => 'bad', 'role' => 'owner']],
    'invitation destroy' => ['DELETE', 'teams.invitations.destroy', []],
]);

it('returns 404 not 422 when a member without the permission probes invitations', function (): void {
    $team = Team::factory()->create();
    $user = User::factory()->create();
    $other = User::factory()->create();
    $team->members()->attach($user, ['role' => TeamRole::Member->value]);
    $team->members()->attach($other, ['role' => TeamRole::Member->value]);

    Sanctum::actingAs($user);

    $this->postJson(route('teams.invitations.store', $team), ['email' => $other->email, 'role' => 'member'])
        ->assertNotFound();
});
