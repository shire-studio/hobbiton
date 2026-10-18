<?php

declare(strict_types=1);

use App\Actions\DeleteUserToken;
use App\Models\User;

it('deletes the token the user authenticated with', function (): void {
    $user = User::factory()->create();
    $user->createToken('current');
    $user->createToken('other');
    $user->withAccessToken($user->tokens()->where('name', 'current')->sole());

    resolve(DeleteUserToken::class)->handle($user);

    expect($user->tokens()->pluck('name')->all())->toBe(['other']);
});
