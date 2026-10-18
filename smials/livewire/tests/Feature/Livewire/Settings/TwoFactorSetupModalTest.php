<?php

declare(strict_types=1);

use App\Livewire\Settings\TwoFactorSetupModal;
use App\Models\User;
use Livewire\Livewire;
use PragmaRX\Google2FA\Google2FA;

it('starts the setup with a qr code and setup key', function (): void {
    $user = User::factory()->create();

    $component = Livewire::actingAs($user)
        ->test(TwoFactorSetupModal::class, ['requiresConfirmation' => true])
        ->dispatch('start-two-factor-setup');

    $user->refresh();

    expect($component->get('qrCodeSvg'))->toContain('<svg')
        ->and($component->get('manualSetupKey'))->toBe(decrypt((string) $user->two_factor_secret));
});

it('shows the verification step when confirmation is required', function (): void {
    Livewire::actingAs(User::factory()->create())
        ->test(TwoFactorSetupModal::class, ['requiresConfirmation' => true])
        ->call('showVerificationIfNecessary')
        ->assertSet('showVerificationStep', true)
        ->assertSee('Verify authentication code');
});

it('finishes immediately when confirmation is not required', function (): void {
    Livewire::actingAs(User::factory()->create())
        ->test(TwoFactorSetupModal::class, ['requiresConfirmation' => false])
        ->call('showVerificationIfNecessary')
        ->assertSet('showVerificationStep', false)
        ->assertDispatched('two-factor-enabled');
});

it('confirms two factor authentication with a valid code', function (): void {
    $user = User::factory()->create();

    $component = Livewire::actingAs($user)
        ->test(TwoFactorSetupModal::class, ['requiresConfirmation' => true])
        ->dispatch('start-two-factor-setup');

    $code = resolve(Google2FA::class)
        ->getCurrentOtp(decrypt((string) $user->refresh()->two_factor_secret));

    $component->set('code', $code)
        ->call('confirmTwoFactor')
        ->assertHasNoErrors()
        ->assertDispatched('two-factor-enabled')
        ->assertSet('qrCodeSvg', '');

    expect($user->refresh()->two_factor_confirmed_at)->not->toBeNull();
});

it('requires a six digit code', function (): void {
    Livewire::actingAs(User::factory()->create())
        ->test(TwoFactorSetupModal::class, ['requiresConfirmation' => true])
        ->set('code', '123')
        ->call('confirmTwoFactor')
        ->assertHasErrors(['code' => 'size']);
});

it('resets the verification step', function (): void {
    Livewire::actingAs(User::factory()->create())
        ->test(TwoFactorSetupModal::class, ['requiresConfirmation' => true])
        ->set('code', '123456')
        ->set('showVerificationStep', true)
        ->call('resetVerification')
        ->assertSet('code', '')
        ->assertSet('showVerificationStep', false);
});
