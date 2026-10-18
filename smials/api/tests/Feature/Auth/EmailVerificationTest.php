<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Laravel\Sanctum\Sanctum;

it('sends a verification notification', function (): void {
    Notification::fake();

    $user = User::factory()->unverified()->create();

    Sanctum::actingAs($user);

    $this->postJson(route('verification.send'))
        ->assertAccepted()
        ->assertJson(['status' => 'verification-link-sent']);

    Notification::assertSentTo($user, VerifyEmail::class);
});

it('does not send a notification to verified users', function (): void {
    Notification::fake();

    Sanctum::actingAs(User::factory()->create());

    $this->postJson(route('verification.send'))->assertNoContent();

    Notification::assertNothingSent();
});

it('verifies the email with a signed url', function (): void {
    Event::fake();

    $user = User::factory()->unverified()->create();

    Sanctum::actingAs($user);

    $url = URL::temporarySignedRoute('verification.verify', now()->addHour(), [
        'id' => $user->id,
        'hash' => sha1($user->email),
    ]);

    $this->getJson($url)
        ->assertOk()
        ->assertJsonPath('data.id', $user->id);

    expect($user->refresh()->hasVerifiedEmail())->toBeTrue();

    Event::assertDispatched(Verified::class);
});

it('rejects an invalid verification hash', function (): void {
    $user = User::factory()->unverified()->create();

    Sanctum::actingAs($user);

    $url = URL::temporarySignedRoute('verification.verify', now()->addHour(), [
        'id' => $user->id,
        'hash' => sha1('wrong@example.com'),
    ]);

    $this->getJson($url)->assertForbidden();

    expect($user->refresh()->hasVerifiedEmail())->toBeFalse();
});
