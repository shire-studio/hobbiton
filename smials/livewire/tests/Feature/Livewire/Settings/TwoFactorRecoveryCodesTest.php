<?php

declare(strict_types=1);

use App\Livewire\Settings\TwoFactorRecoveryCodes;
use App\Models\User;
use Livewire\Livewire;

it('shows the users recovery codes', function (): void {
    Livewire::actingAs(User::factory()->withTwoFactor()->create())
        ->test(TwoFactorRecoveryCodes::class)
        ->assertSet('recoveryCodes', ['recovery-code-1', 'recovery-code-2'])
        ->assertSee('recovery-code-1');
});

it('regenerates the recovery codes', function (): void {
    $user = User::factory()->withTwoFactor()->create();

    $component = Livewire::actingAs($user)
        ->test(TwoFactorRecoveryCodes::class)
        ->call('regenerateRecoveryCodes');

    expect($component->get('recoveryCodes'))
        ->toHaveCount(8)
        ->not->toContain('recovery-code-1')
        ->toBe($user->refresh()->recoveryCodes());
});
