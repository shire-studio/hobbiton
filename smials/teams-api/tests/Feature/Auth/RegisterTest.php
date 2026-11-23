<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Support\Facades\Notification;

it('may register a new user and receive a token', function (): void {
    Notification::fake();

    $response = $this->postJson(route('register.store'), [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password1234',
        'password_confirmation' => 'password1234',
    ]);

    $user = User::query()->where('email', 'test@example.com')->firstOrFail();

    $response->assertCreated()
        ->assertJsonPath('user.id', $user->id)
        ->assertJsonPath('user.email_verified_at', null)
        ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email', 'email_verified_at', 'current_team']]);

    expect($user->tokens()->count())->toBe(1);

    Notification::assertSentTo($user, VerifyEmail::class);
});

it('validates registration input', function (): void {
    $this->postJson(route('register.store'), [
        'name' => '',
        'email' => 'not-an-email',
        'password' => 'password1234',
        'password_confirmation' => 'different',
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['name', 'email', 'password_confirmation']);
});

it('rejects duplicate emails', function (): void {
    User::factory()->create(['email' => 'test@example.com']);

    $this->postJson(route('register.store'), [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password1234',
        'password_confirmation' => 'password1234',
    ])->assertUnprocessable()
        ->assertJsonValidationErrors('email');
});

it('creates a personal team on registration', function (): void {
    Notification::fake();

    $this->postJson(route('register.store'), [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password1234',
        'password_confirmation' => 'password1234',
    ])->assertCreated()
        ->assertJsonPath('user.current_team.name', "Test User's Team")
        ->assertJsonPath('user.current_team.is_personal', true)
        ->assertJsonPath('user.current_team.role', 'owner')
        ->assertJsonPath('user.current_team.is_current', true);

    $user = User::query()->where('email', 'test@example.com')->firstOrFail();

    expect($user->personalTeam())->not->toBeNull()
        ->and($user->current_team_id)->toBe($user->personalTeam()->id);
});
