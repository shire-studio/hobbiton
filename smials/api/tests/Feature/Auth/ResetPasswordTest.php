<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;

it('resets the password with a valid token', function (): void {
    $user = User::factory()->create(['email' => 'test@example.com']);
    $token = Password::createToken($user);

    $this->postJson(route('password.store'), [
        'token' => $token,
        'email' => 'test@example.com',
        'password' => 'new-password',
        'password_confirmation' => 'new-password',
    ])->assertOk()
        ->assertJson(['status' => __('passwords.reset')]);

    expect(Hash::check('new-password', $user->refresh()->password))->toBeTrue();
});

it('rejects an invalid token', function (): void {
    User::factory()->create(['email' => 'test@example.com']);

    $this->postJson(route('password.store'), [
        'token' => 'invalid',
        'email' => 'test@example.com',
        'password' => 'new-password',
        'password_confirmation' => 'new-password',
    ])->assertUnprocessable()
        ->assertJsonValidationErrors('email');
});
