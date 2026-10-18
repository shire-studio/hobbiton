<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Notification;

it('sends a password reset link', function (): void {
    Notification::fake();

    $user = User::factory()->create(['email' => 'test@example.com']);

    $this->postJson(route('password.email'), ['email' => 'TEST@example.com'])
        ->assertOk()
        ->assertJson(['status' => 'A reset link will be sent if the account exists.']);

    Notification::assertSentTo($user, ResetPassword::class, function (ResetPassword $notification) use ($user): bool {
        $url = $notification->toMail($user)->actionUrl;

        expect($url)->toBe(config('app.frontend_url').'/reset-password/'.$notification->token.'?email=test%40example.com');

        return true;
    });
});

it('does not reveal whether an account exists', function (): void {
    Notification::fake();

    $this->postJson(route('password.email'), ['email' => 'missing@example.com'])
        ->assertOk()
        ->assertJson(['status' => 'A reset link will be sent if the account exists.']);

    Notification::assertNothingSent();
});

it('validates the email', function (): void {
    $this->postJson(route('password.email'), ['email' => 'not-an-email'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('email');
});
