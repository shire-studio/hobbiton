<?php

declare(strict_types=1);

use App\Livewire\Settings\ManagePasskeys;
use App\Livewire\Settings\ManageTwoFactor;
use App\Models\Passkey;
use App\Models\User;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Hash;
use Laravel\Fortify\Features;

it('renders edit password page', function (): void {
    $user = User::factory()->create();

    $this->actingAs($user)->session(['auth.password_confirmed_at' => time()]);

    $response = $this->fromRoute('dashboard')
        ->get(route('password.edit'));

    $response->assertOk()
        ->assertViewIs('pages.settings.security')
        ->assertViewHas('canManageTwoFactor', true)
        ->assertViewHas('requiresConfirmation', true)
        ->assertViewHas('twoFactorEnabled', false)
        ->assertViewHas('canManagePasskeys', true)
        ->assertSeeLivewire(ManageTwoFactor::class)
        ->assertSeeLivewire(ManagePasskeys::class);
});

it('requires password confirmation before showing the security page', function (): void {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->fromRoute('dashboard')
        ->get(route('password.edit'));

    $response->assertRedirectToRoute('password.confirm');
});

it('does not require two factor confirmation when the option is disabled', function (): void {
    Config::set('fortify.features', [
        Features::twoFactorAuthentication([
            'confirm' => false,
            'confirmPassword' => true,
        ]),
    ]);

    $user = User::factory()->create();

    $this->actingAs($user)->session(['auth.password_confirmed_at' => time()]);

    $response = $this->fromRoute('dashboard')
        ->get(route('password.edit'));

    $response->assertOk()
        ->assertViewHas('requiresConfirmation', false);
});

it('hides passkeys when the feature is disabled', function (): void {
    Config::set('fortify.features', [
        Features::twoFactorAuthentication([
            'confirm' => true,
            'confirmPassword' => true,
        ]),
    ]);

    $user = User::factory()->create();

    Passkey::factory()->for($user)->create();

    $this->actingAs($user)->session(['auth.password_confirmed_at' => time()]);

    $response = $this->fromRoute('dashboard')
        ->get(route('password.edit'));

    $response->assertOk()
        ->assertViewIs('pages.settings.security')
        ->assertViewHas('canManagePasskeys', false)
        ->assertDontSee(__('Manage your passkeys for passwordless sign-in'));
});

it('redirects the legacy two factor settings url to the security page', function (): void {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get('/settings/two-factor');

    $response->assertRedirect(route('password.edit'));
});

it('may update password', function (): void {
    $user = User::factory()->create([
        'password' => Hash::make('old-password'),
    ]);

    $response = $this->actingAs($user)
        ->fromRoute('password.edit')
        ->put(route('password.update'), [
            'current_password' => 'old-password',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

    $response->assertRedirectToRoute('password.edit')
        ->assertSessionHas('toast', ['type' => 'success', 'message' => 'Password updated.']);

    expect(Hash::check('new-password', $user->refresh()->password))->toBeTrue();
});

it('requires current password to update', function (): void {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->fromRoute('password.edit')
        ->put(route('password.update'), [
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

    $response->assertRedirectToRoute('password.edit')
        ->assertSessionHasErrors('current_password');
});

it('requires correct current password to update', function (): void {
    $user = User::factory()->create([
        'password' => Hash::make('old-password'),
    ]);

    $response = $this->actingAs($user)
        ->fromRoute('password.edit')
        ->put(route('password.update'), [
            'current_password' => 'wrong-password',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

    $response->assertRedirectToRoute('password.edit')
        ->assertSessionHasErrors('current_password');
});

it('requires new password to update', function (): void {
    $user = User::factory()->create([
        'password' => Hash::make('old-password'),
    ]);

    $response = $this->actingAs($user)
        ->fromRoute('password.edit')
        ->put(route('password.update'), [
            'current_password' => 'old-password',
        ]);

    $response->assertRedirectToRoute('password.edit')
        ->assertSessionHasErrors('password');
});

it('requires matching password confirmation to update', function (): void {
    $user = User::factory()->create([
        'password' => Hash::make('old-password'),
    ]);

    $response = $this->actingAs($user)
        ->fromRoute('password.edit')
        ->put(route('password.update'), [
            'current_password' => 'old-password',
            'password' => 'new-password',
            'password_confirmation' => 'different-password',
        ]);

    $response->assertRedirectToRoute('password.edit')
        ->assertSessionHasErrors('password_confirmation')
        ->assertSessionDoesntHaveErrors('password');
});

it('shows two factor enabled when enabled', function (): void {
    $user = User::factory()->withTwoFactor()->create();

    $this->actingAs($user)->session(['auth.password_confirmed_at' => time()]);

    $response = $this->fromRoute('dashboard')
        ->get(route('password.edit'));

    $response->assertOk()
        ->assertViewIs('pages.settings.security')
        ->assertViewHas('twoFactorEnabled', true);
});
