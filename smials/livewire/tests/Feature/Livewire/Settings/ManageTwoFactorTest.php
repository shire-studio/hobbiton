<?php

declare(strict_types=1);

use App\Livewire\Settings\ManageTwoFactor;
use App\Models\User;
use Livewire\Livewire;

it('offers to enable two factor authentication', function (): void {
    Livewire::actingAs(User::factory()->create())
        ->test(ManageTwoFactor::class, ['canManageTwoFactor' => true, 'requiresConfirmation' => true, 'twoFactorEnabled' => false])
        ->assertSee('Enable 2FA')
        ->assertDontSee('Disable 2FA');
});

it('renders nothing when two factor cannot be managed', function (): void {
    Livewire::actingAs(User::factory()->create())
        ->test(ManageTwoFactor::class, ['canManageTwoFactor' => false])
        ->assertDontSee('Two-factor authentication');
});

it('marks two factor as enabled when the setup finishes', function (): void {
    Livewire::actingAs(User::factory()->withTwoFactor()->create())
        ->test(ManageTwoFactor::class, ['canManageTwoFactor' => true, 'twoFactorEnabled' => false])
        ->dispatch('two-factor-enabled')
        ->assertSet('twoFactorEnabled', true);
});

it('disables two factor authentication', function (): void {
    $user = User::factory()->withTwoFactor()->create();

    Livewire::actingAs($user)
        ->test(ManageTwoFactor::class, ['canManageTwoFactor' => true, 'twoFactorEnabled' => true])
        ->assertSee('Disable 2FA')
        ->call('disable')
        ->assertSet('twoFactorEnabled', false);

    expect($user->refresh()->two_factor_secret)->toBeNull();
});
