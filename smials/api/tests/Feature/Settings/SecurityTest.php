<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;

it('updates the password', function (): void {
    $user = User::factory()->create(['password' => Hash::make('old-password')]);

    Sanctum::actingAs($user);

    $this->putJson(route('password.update'), [
        'current_password' => 'old-password',
        'password' => 'new-password',
        'password_confirmation' => 'new-password',
    ])->assertNoContent();

    expect(Hash::check('new-password', $user->refresh()->password))->toBeTrue();
});

it('requires the current password', function (): void {
    Sanctum::actingAs(User::factory()->create());

    $this->putJson(route('password.update'), [
        'current_password' => 'wrong-password',
        'password' => 'new-password',
        'password_confirmation' => 'new-password',
    ])->assertUnprocessable()
        ->assertJsonValidationErrors('current_password');
});
