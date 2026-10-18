<?php

declare(strict_types=1);

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
