<?php

declare(strict_types=1);

it('renders the welcome page', function (): void {
    $this->get(route('home'))
        ->assertOk()->assertViewIs('welcome')->assertSeeHtml("Let's get started");
});

it('applies the dark appearance from the cookie', function (): void {
    $this->withUnencryptedCookie('appearance', 'dark')
        ->get(route('home'))->assertOk()->assertSeeHtml('<html lang="en" class="dark">');
});
