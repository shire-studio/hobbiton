<?php

declare(strict_types=1);

it('describes the api', function (): void {
    $this->getJson(route('home'))
        ->assertOk()
        ->assertExactJson(['name' => config('app.name')]);
});

it('renders json for missing routes', function (): void {
    $this->get('/missing')
        ->assertNotFound()
        ->assertJsonStructure(['message']);
});
