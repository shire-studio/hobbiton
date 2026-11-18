<?php

declare(strict_types=1);

use App\Enums\TeamRole;
use App\Models\Team;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

it('deletes the account with the correct password', function (): void {
    $user = User::factory()->create();

    Sanctum::actingAs($user);

    $this->deleteJson(route('user.destroy'), ['password' => 'password'])
        ->assertNoContent();

    expect($user->fresh())->toBeNull();
});

it('requires the current password to delete the account', function (): void {
    $user = User::factory()->create();

    Sanctum::actingAs($user);

    $this->deleteJson(route('user.destroy'), ['password' => 'wrong-password'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('password');

    expect($user->fresh())->not->toBeNull();
});

it('refuses to delete an account that owns a team with other members', function (): void {
    $user = User::factory()->create();
    $team = Team::factory()->create();
    $team->members()->attach($user, ['role' => TeamRole::Owner->value]);
    $team->members()->attach(User::factory()->create(), ['role' => TeamRole::Member->value]);

    Sanctum::actingAs($user);

    $this->deleteJson(route('user.destroy'), ['password' => 'password'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors([
            'password' => 'Remove the other members or delete the teams you own before deleting your account.',
        ]);

    expect($user->fresh())->not->toBeNull()
        ->and($team->fresh()?->deleted_at)->toBeNull();
});

it('deletes the teams the account owns when no one else belongs to them', function (): void {
    $user = User::factory()->create();
    $personal = $user->personalTeam();
    $team = Team::factory()->create();
    $team->members()->attach($user, ['role' => TeamRole::Owner->value]);

    Sanctum::actingAs($user);

    $this->deleteJson(route('user.destroy'), ['password' => 'password'])
        ->assertNoContent();

    expect($user->fresh())->toBeNull()
        ->and(Team::query()->find($team->id))->toBeNull()
        ->and(Team::query()->find($personal?->id))->toBeNull();
});
