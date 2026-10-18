<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Support\Facades\RateLimiter;

it('issues a token for valid credentials', function (): void {
    $user = User::factory()->create(['email' => 'test@example.com']);

    $this->postJson(route('login.store'), [
        'email' => 'TEST@example.com',
        'password' => 'password',
    ])->assertOk()
        ->assertJsonPath('user.id', $user->id)
        ->assertJsonStructure(['token']);

    expect($user->tokens()->count())->toBe(1);
});

it('names the token after the user agent', function (): void {
    $user = User::factory()->create(['email' => 'test@example.com']);

    $this->withHeader('User-Agent', 'Test Device')
        ->postJson(route('login.store'), [
            'email' => 'test@example.com',
            'password' => 'password',
        ])->assertOk();

    expect($user->tokens()->sole()->name)->toBe('Test Device');
});

it('rejects invalid credentials', function (): void {
    User::factory()->create(['email' => 'test@example.com']);

    $this->postJson(route('login.store'), [
        'email' => 'test@example.com',
        'password' => 'wrong-password',
    ])->assertUnprocessable()
        ->assertJsonValidationErrors('email');
});

it('rate limits login attempts', function (): void {
    User::factory()->create(['email' => 'test@example.com']);

    RateLimiter::increment('test@example.com|127.0.0.1', amount: 5);

    $this->postJson(route('login.store'), [
        'email' => 'test@example.com',
        'password' => 'password',
    ])->assertUnprocessable()
        ->assertJsonValidationErrors('email');
});
