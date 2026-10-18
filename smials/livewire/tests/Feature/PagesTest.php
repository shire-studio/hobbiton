<?php

declare(strict_types=1);

use App\Models\User;

it('renders the welcome page', function (): void {
    $this->get(route('home'))
        ->assertOk()
        ->assertViewIs('pages.welcome');
});

it('renders the dashboard', function (): void {
    $this->actingAs(User::factory()->create())
        ->get(route('dashboard'))
        ->assertOk()
        ->assertViewIs('pages.dashboard');
});

it('renders the appearance settings', function (): void {
    $this->actingAs(User::factory()->create())
        ->get(route('appearance.edit'))
        ->assertOk()
        ->assertViewIs('pages.settings.appearance');
});

it('renders the confirm password page', function (): void {
    $this->actingAs(User::factory()->create())
        ->get(route('password.confirm'))
        ->assertOk()
        ->assertViewIs('pages.auth.confirm-password');
});

it('renders the two factor challenge', function (): void {
    $user = User::factory()->withTwoFactor()->create();

    $this->withSession(['login.id' => $user->id])
        ->get(route('two-factor.login'))
        ->assertOk()
        ->assertViewIs('pages.auth.two-factor-challenge');
});
