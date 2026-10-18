<?php

declare(strict_types=1);

use App\Models\User;

it('renders verify email page', function (): void {
    $user = User::factory()->unverified()->create();

    $response = $this->actingAs($user)
        ->fromRoute('home')
        ->get(route('verification.notice'));

    $response->assertOk()
        ->assertViewIs('pages.auth.verify-email')
        ->assertViewHas('status');
});

it('redirects verified users to dashboard', function (): void {
    $user = User::factory()->create([
        'email_verified_at' => now(),
    ]);

    $response = $this->actingAs($user)
        ->fromRoute('home')
        ->get(route('verification.notice'));

    $response->assertRedirectToRoute('dashboard');
});
