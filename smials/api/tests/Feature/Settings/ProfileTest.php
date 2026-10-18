<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;

it('shows the authenticated user', function (): void {
    $user = User::factory()->create(['name' => 'Test User']);

    Sanctum::actingAs($user);

    $this->getJson(route('user.show'))
        ->assertOk()
        ->assertExactJson(['data' => [
            'id' => $user->id,
            'name' => 'Test User',
            'email' => $user->email,
            'email_verified_at' => $user->email_verified_at?->toIso8601String(),
        ]]);
});

it('updates the profile', function (): void {
    Sanctum::actingAs(User::factory()->create());

    $this->patchJson(route('user.update'), [
        'name' => 'New Name',
        'email' => 'new@example.com',
    ])->assertOk()
        ->assertJsonPath('data.name', 'New Name')
        ->assertJsonPath('data.email', 'new@example.com')
        ->assertJsonPath('data.email_verified_at', null);
});

it('sends a verification notification when the email changes', function (): void {
    Notification::fake();

    $user = User::factory()->create();

    Sanctum::actingAs($user);

    $this->patchJson(route('user.update'), [
        'name' => $user->name,
        'email' => 'new@example.com',
    ])->assertOk();

    Notification::assertSentTo($user, VerifyEmail::class);
});

it('validates profile updates', function (): void {
    Sanctum::actingAs(User::factory()->create());

    $this->patchJson(route('user.update'), ['name' => '', 'email' => 'not-an-email'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name', 'email']);
});

it('requires authentication', function (): void {
    $this->getJson(route('user.show'))->assertUnauthorized();
});
