<?php

declare(strict_types=1);

use App\Actions\CreateUserToken;
use App\Models\User;
use Laravel\Sanctum\PersonalAccessToken;

it('creates a named token for the user', function (): void {
    $user = User::factory()->create();

    $plainTextToken = resolve(CreateUserToken::class)->handle($user, 'Laptop');

    expect(PersonalAccessToken::findToken($plainTextToken)?->tokenable?->is($user))->toBeTrue()
        ->and($user->tokens()->sole()->name)->toBe('Laptop');
});
