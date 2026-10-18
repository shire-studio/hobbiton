<?php

declare(strict_types=1);

use App\Models\User;

it('revokes the current token', function (): void {
    $user = User::factory()->create();
    $token = $user->createToken('api')->plainTextToken;
    $user->createToken('other');

    $this->withToken($token)
        ->postJson(route('logout'))
        ->assertNoContent();

    expect($user->tokens()->pluck('name')->all())->toBe(['other']);
});

it('requires authentication to log out', function (): void {
    $this->postJson(route('logout'))
        ->assertUnauthorized()
        ->assertJson(['message' => 'Unauthenticated.']);
});
